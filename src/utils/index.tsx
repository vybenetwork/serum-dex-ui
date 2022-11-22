import {
    Account,
    Connection,
    Commitment,
    PublicKey,
    Transaction,
    TransactionSignature,
    RpcResponseAndContext,
    SimulatedTransactionResponse,
    AccountInfo,
} from '@solana/web3.js';
import { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Market, parseInstructionErrorResponse, OpenOrders } from '@project-serum/serum';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
//@ts-ignore
import { cloneDeep } from 'lodash-es';
import { Order } from '@project-serum/serum/lib/market';
import axios from 'axios';

import React, { useContext, useEffect, useReducer, useState, useCallback, useMemo } from 'react';
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions';
import assert from 'assert';
import { useQuery } from 'react-query';
import { v4 as uuid } from 'uuid';
import { gqlMarketStats } from 'requests';
import { DexInstructions } from '@project-serum/serum';
import { MINT_TO_REFERRER } from '../config';

//@ts-ignore
import * as BufferLayout from 'buffer-layout';
//@ts-ignore
import tuple from 'immutable-tuple';
//@ts-ignore
import Big from 'big.js';
import mixpanel from 'mixpanel-browser';
import { MIX_PANEL_EVENTS } from './mixPanelEvents';
import { SendTransactionOptions } from '@solana/wallet-adapter-base/src/adapter';

const pageLoadTime = new Date();
const globalCache: Map<any, any> = new Map();

interface WalletAdapter {
    publicKey: PublicKey;
    autoApprove: boolean;
    connected: boolean;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
    connect: () => any;
    disconnect: () => any;
    on<T>(event: string, fn: () => void): this;
}

interface WalletAdapter2 extends WalletAdapter {
    sendTransaction: (
        transaction: Transaction,
        connection: Connection,
        options?: SendTransactionOptions,
    ) => Promise<TransactionSignature>;
}

const DEFAULT_TIMEOUT = 60000;

export type CurrentMarketDetails = {
    name: string;
    addr: string;
};

export type DexTxType = 'CANCEL_ORDER' | 'SETTLE_FUNDS' | 'CLOSE_ACCOUNT' | 'PLACE_ORDER';

// ORDERS
export async function sendTransaction({
    transaction,
    actionId,
    txType,
    wallet,
    signers = [],
    connection,
    sendingMessage,
    sentMessage = 'Transaction sent',
    successMessage = 'Transaction confirmed',
    timeout = DEFAULT_TIMEOUT,
    sendNotification = true,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    alertTitle,
    currentMarketDetails,
}: {
    transaction: Transaction;
    actionId: string;
    txType: DexTxType;
    wallet: WalletContextState;
    signers?: Array<Account>;
    connection: Connection;
    sendingMessage?: string;
    sentMessage?: string;
    successMessage?: string;
    timeout?: number;
    sendNotification?: boolean;
    setAlertTitle?: any;
    setAlertDescription?: any;
    setAlertVisible?: any;
    setAlertType?: any;
    alertTitle?: any;
    currentMarketDetails: CurrentMarketDetails;
}) {
    // workaround since WalletAdapter does not contain sendTransaction,
    // so WalletAdapter2 extends WalletAdapter and adds sendTransaction - this uses the new sendTransaction if available
    if ('sendTransaction' in wallet) {
        let wallet2 = wallet as unknown as WalletAdapter2;
        const txid = await wallet2.sendTransaction(transaction, connection, { signers: signers });
        if (sendNotification) {
            setAlertTitle('Transaction sent');
            setAlertDescription(
                [{ value: `Transaction sent.`, icon: 'success', txid: txid }],
                [{ value: `Confirming transaction.`, icon: 'loading', txid: txid }],
            );
            setAlertType('success');
            setAlertVisible(true);
        }
        try {
            await awaitTransactionSignatureConfirmation(txid, timeout, connection);
        } catch (err: any) {
            if (err.timeout) {
                setAlertTitle('Error signing transaction');
                setAlertDescription([
                    { value: `Timed out awaiting confirmation on transaction`, icon: 'error', txid: txid },
                ]);
                setAlertType('error');
                setAlertVisible(true);
                throw new Error('Timed out awaiting confirmation on transaction');
            }
            if (err.error) setAlertTitle('Error signing transaction');
            setAlertDescription([
                { value: `User rejected signing or transaction too large`, icon: 'error', txid: txid },
            ]);
            setAlertType('error');
            setAlertVisible(true);
            throw new Error('Transaction failed');
        }
        if (sendNotification) {
            setAlertTitle('Transaction sent');
            setAlertDescription(
                [{ value: `Transaction sent.`, icon: 'success', txid: txid }],
                [{ value: `Transaction confirmed.`, icon: 'success', txid: txid }],
            );
            setAlertType('success');
            setAlertVisible(true);
        }
        return txid;
    } else {
        let signedTransaction;
        try {
            const signedTX = await signTransaction({
                transaction,
                wallet,
                signers,
                connection,
            });
            signedTransaction = signedTX;
        } catch (err) {
            sendMixPanelEvent(MIX_PANEL_EVENTS.SEND_TRANSACTION_FAILED.name, {
                vybeActionId: actionId,
                currentMarketDetails,
                txType,
            });
            console.error(err);
            setAlertTitle('Error signing transaction');
            setAlertDescription([{ value: `User rejected signing or transaction too large`, icon: 'error' }]);
            setAlertType('error');
            setAlertVisible(true);
        }
        if (signedTransaction) {
            return await sendSignedTransaction({
                signedTransaction,
                actionId,
                txType,
                connection,
                sendingMessage,
                sentMessage,
                successMessage,
                timeout,
                sendNotification,
                setAlertTitle,
                setAlertDescription,
                setAlertVisible,
                setAlertType,
                alertTitle,
                currentMarketDetails,
            });
        }
    }
}

export async function signTransaction({
    transaction,
    wallet,
    signers = [],
    connection,
}: {
    transaction: Transaction;
    wallet: WalletContextState;
    signers?: Array<Account>;
    connection: Connection;
}) {
    transaction.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;

    if (wallet.publicKey) {
        transaction.setSigners(wallet.publicKey, ...signers.map((s) => s.publicKey));
    }
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    if (wallet.signTransaction) {
        return await wallet.signTransaction(transaction);
    }
}

export async function signTransactions({
    transactionsAndSigners,
    wallet,
    connection,
}: {
    transactionsAndSigners: {
        transaction: Transaction;
        signers?: Array<Account>;
    }[];
    wallet: WalletContextState;
    connection: Connection;
}) {
    const blockhash = (await connection.getRecentBlockhash('max')).blockhash;
    transactionsAndSigners.forEach(({ transaction, signers = [] }) => {
        transaction.recentBlockhash = blockhash;
        transaction.setSigners(
            // @ts-ignore
            wallet.publicKey,
            ...signers.map((s) => s.publicKey),
        );
        if (signers?.length > 0) {
            transaction.partialSign(...signers);
        }
    });
    // @ts-ignore
    return await wallet.signAllTransactions(transactionsAndSigners.map(({ transaction }) => transaction));
}

export async function sendSignedTransaction({
    signedTransaction,
    actionId,
    txType,
    connection,
    sendingMessage,
    sentMessage = 'Transaction sent',
    successMessage = 'Transaction confirmed',
    timeout = DEFAULT_TIMEOUT,
    sendNotification = true,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    alertTitle,
    currentMarketDetails,
}: {
    signedTransaction: Transaction | undefined;
    actionId: string;
    txType: DexTxType;
    connection: Connection;
    sendingMessage?: string;
    sentMessage?: string;
    successMessage?: string;
    timeout?: number;
    sendNotification?: boolean;
    setAlertTitle?: any;
    setAlertDescription?: any;
    setAlertVisible?: any;
    setAlertType?: any;
    alertTitle?: any;
    currentMarketDetails: CurrentMarketDetails;
}): Promise<string> {
    // @ts-ignore
    const rawTransaction = signedTransaction.serialize();
    const startTime = getUnixTs();
    if (sendNotification) {
        setAlertTitle(alertTitle);
        setAlertDescription([{ value: sendingMessage, icon: 'loading' }]);
        setAlertType('info');
        setAlertVisible(true);
    }
    const txid: TransactionSignature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
    });
    if (sendNotification) {
        setAlertDescription([
            { value: sendingMessage, icon: 'success' },
            { value: sentMessage, icon: 'success' },
        ]);
        setAlertType('info');
        setAlertVisible(true);
    }

    console.log('Started awaiting confirmation for', txid);
    setAlertTitle(alertTitle);
    setAlertDescription([
        { value: sendingMessage, icon: 'success' },
        { value: sentMessage, icon: 'success' },
        { value: `Awaiting transaction confirmation`, icon: 'loading' },
    ]);
    setAlertType('info');
    setAlertVisible(true);

    let done = false;
    (async () => {
        while (!done && getUnixTs() - startTime < timeout) {
            connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
            });
            await sleep(1500);
        }
    })();
    try {
        await awaitTransactionSignatureConfirmation(txid, timeout, connection);
    } catch (err: any) {
        if (err.timeout) {
            sendMixPanelEvent(MIX_PANEL_EVENTS.SEND_TRANSACTION_FAILED.name, {
                vybeActionId: actionId,
                currentMarketDetails,
                txType,
            });
            setAlertDescription([
                { value: sentMessage, icon: 'success' },
                { value: `Timed out awaiting confirmation.`, icon: 'error', txid: txid },
            ]);
            setAlertType('error');
            setAlertVisible(true);
            throw new Error('Timed out awaiting confirmation on transaction');
        }
        let simulateResult: SimulatedTransactionResponse | null = null;
        try {
            simulateResult = // @ts-ignore
                (await simulateTransaction(connection, signedTransaction, 'single')).value;
        } catch (e) {}
        if (simulateResult && simulateResult.err) {
            if (simulateResult.logs) {
                for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
                    const line = simulateResult.logs[i];
                    if (line.startsWith('Program log: ')) {
                        sendMixPanelEvent(MIX_PANEL_EVENTS.SEND_TRANSACTION_FAILED.name, {
                            vybeActionId: actionId,
                            currentMarketDetails,
                            reason: 'Transaction failed: ' + line.slice('Program log: '.length),
                            txType,
                        });
                        throw new Error('Transaction failed: ' + line.slice('Program log: '.length));
                    }
                }
            }
            let parsedError;
            if (typeof simulateResult.err == 'object' && 'InstructionError' in simulateResult.err) {
                const parsedErrorInfo = parseInstructionErrorResponse(
                    // @ts-ignore
                    signedTransaction,
                    simulateResult.err['InstructionError'],
                );
                parsedError = parsedErrorInfo.error;
            } else {
                parsedError = JSON.stringify(simulateResult.err);
            }
            sendMixPanelEvent(MIX_PANEL_EVENTS.SEND_TRANSACTION_FAILED.name, {
                vybeActionId: actionId,
                currentMarketDetails,
                error: parsedError,
                txType,
            });
            throw new Error(parsedError);
        }
        setAlertDescription([
            { value: sendingMessage, icon: 'success' },
            { value: sentMessage, icon: 'success' },
            { value: `Transaction failed`, icon: 'error', txid: txid },
        ]);
        setAlertType('error');
        setAlertVisible(true);
        sendMixPanelEvent(MIX_PANEL_EVENTS.SEND_TRANSACTION_FAILED.name, {
            vybeActionId: actionId,
            currentMarketDetails,
            error: 'Transaction Failed',
            txType,
        });
        throw new Error('Transaction failed');
    } finally {
        done = true;
    }
    if (sendNotification) {
        setAlertTitle(alertTitle);
        setAlertDescription([
            { value: sendingMessage, icon: 'success' },
            { value: successMessage, icon: 'success' },
            { value: `Transaction completed`, icon: 'success', txid: txid },
        ]);
        setAlertType('success');
        setAlertVisible(true);
    }
    const latency = getUnixTs() - startTime;
    sendMixPanelEvent(MIX_PANEL_EVENTS.SEND_TRANSACTION_SUCCESS.name, {
        vybeActionId: actionId,
        currentMarketDetails,
        latency,
        txType,
    });

    console.log('Latency', txid, latency);
    return txid;
}

export async function cancelOrder(params: {
    market: Market;
    connection: Connection;
    wallet: WalletContextState;
    order: Order;
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    currentMarketDetails: CurrentMarketDetails;
}) {
    return cancelOrders({ ...params, orders: [params.order] });
}

export async function cancelOrders({
    market,
    wallet,
    connection,
    orders,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    currentMarketDetails,
}: {
    market: Market;
    wallet: WalletContextState;
    connection: Connection;
    orders: Order[];
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    currentMarketDetails: CurrentMarketDetails;
}) {
    const transaction = market.makeMatchOrdersTransaction(5);
    orders.forEach((order) => {
        if (wallet.publicKey) {
            transaction.add(market.makeCancelOrderInstruction(connection, wallet.publicKey, order));
        }
    });
    transaction.add(market.makeMatchOrdersTransaction(5));
    const actionId = uuid();
    sendMixPanelEvent(MIX_PANEL_EVENTS.CANCEL_ORDERS_CALLED.name, {
        orders: orders.map((o) => o.orderId.toString()),
        market: market.address.toBase58(),
        vybeActionId: actionId,
        currentMarketDetails,
    });
    return await sendTransaction({
        transaction,
        actionId,
        txType: 'CANCEL_ORDER',
        wallet,
        connection,
        sendingMessage: 'Sending cancel...',
        alertTitle: 'Cancel Order',
        setAlertTitle,
        setAlertDescription,
        setAlertVisible,
        setAlertType,
        currentMarketDetails,
    });
}

export async function settleFunds({
    market,
    openOrders,
    connection,
    wallet,
    baseCurrencyAccount,
    quoteCurrencyAccount,
    sendNotification = true,
    usdcRef = undefined,
    usdtRef = undefined,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    currentMarketDetails,
}: {
    market: Market;
    openOrders: OpenOrders;
    connection: Connection;
    wallet: WalletContextState;
    baseCurrencyAccount: TokenAccount;
    quoteCurrencyAccount: TokenAccount;
    sendNotification?: boolean;
    usdcRef?: PublicKey;
    usdtRef?: PublicKey;
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    currentMarketDetails: CurrentMarketDetails;
}): Promise<string | undefined> {
    if (!market || !wallet || !connection || !openOrders || (!baseCurrencyAccount && !quoteCurrencyAccount)) {
        if (sendNotification) {
            console.log('not connected');
        }
        return;
    }

    const actionId = uuid();
    sendMixPanelEvent(MIX_PANEL_EVENTS.SETTLE_FUNDS_CALLED.name, {
        market: market.address.toBase58(),
        vybeActionId: actionId,
        currentMarketDetails,
    });

    let createAccountTransaction: Transaction | undefined;
    let baseCurrencyAccountPubkey = baseCurrencyAccount?.pubkey;
    let quoteCurrencyAccountPubkey = quoteCurrencyAccount?.pubkey;

    if (!baseCurrencyAccountPubkey) {
        const result = await createTokenAccountTransaction({
            connection,
            wallet,
            mintPublicKey: market.baseMintAddress,
        });
        baseCurrencyAccountPubkey = result?.newAccountPubkey;
        createAccountTransaction = result?.transaction;
    }
    if (!quoteCurrencyAccountPubkey) {
        const result = await createTokenAccountTransaction({
            connection,
            wallet,
            mintPublicKey: market.quoteMintAddress,
        });
        quoteCurrencyAccountPubkey = result?.newAccountPubkey;
        createAccountTransaction = result?.transaction;
    }
    let referrerQuoteWallet: PublicKey | null = null;
    if (market.supportsReferralFees) {
        const quoteReferrer = MINT_TO_REFERRER[market.quoteMintAddress.toBase58()];

        if (quoteReferrer) {
            referrerQuoteWallet = new PublicKey(quoteReferrer);
        }
    }

    const { transaction: settleFundsTransaction, signers: settleFundsSigners } =
        await market.makeSettleFundsTransaction(
            connection,
            openOrders,
            baseCurrencyAccountPubkey,
            quoteCurrencyAccountPubkey,
            referrerQuoteWallet,
        );

    let transaction = mergeTransactions([createAccountTransaction, settleFundsTransaction]);

    function mergeTransactions(transactions: (Transaction | undefined)[]) {
        const transaction = new Transaction();
        transactions
            .filter((t): t is Transaction => t !== undefined)
            .forEach((t) => {
                transaction.add(t);
            });
        return transaction;
    }

    return await sendTransaction({
        transaction,
        actionId,
        txType: 'SETTLE_FUNDS',
        signers: settleFundsSigners,
        wallet,
        connection,
        sendingMessage: 'Settling funds...',
        alertTitle: 'Settling Funds',
        setAlertTitle,
        setAlertDescription,
        setAlertVisible,
        setAlertType,
        sendNotification,
        currentMarketDetails,
    });
}

export interface SelectedTokenAccounts {
    [tokenMint: string]: string;
}

function mergeTransactions(transactions: (Transaction | undefined)[]) {
    const transaction = new Transaction();
    transactions
        .filter((t): t is Transaction => t !== undefined)
        .forEach((t) => {
            transaction.add(t);
        });
    return transaction;
}

export async function settleAllFunds({
    connection,
    wallet,
    tokenAccounts,
    markets,
    selectedTokenAccounts,
    selectedOpenOrdersAccounts,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    currentMarketDetails,
}: {
    connection: Connection;
    wallet: WalletContextState;
    tokenAccounts: TokenAccount[];
    markets: Market[];
    selectedTokenAccounts?: SelectedTokenAccounts;
    selectedOpenOrdersAccounts?: OpenOrders[];
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    currentMarketDetails: CurrentMarketDetails;
}) {
    if (!markets || !wallet || !connection || !tokenAccounts) {
        return;
    }
    const actionId = uuid();
    sendMixPanelEvent(MIX_PANEL_EVENTS.SETTLE_ALL_FUNDS_CALLED.name, {
        markets: markets.map((m) => m.programId.toBase58()),
        owner: wallet.publicKey?.toBase58(),
        currentMarketDetails,
        vybeActionId: actionId,
    });

    try {
        let openOrdersAccounts;
        if (selectedOpenOrdersAccounts) {
            openOrdersAccounts = selectedOpenOrdersAccounts;
        } else {
            const programIds: PublicKey[] = [];
            markets
                .reduce((cumulative, m) => {
                    // @ts-ignore
                    cumulative.push(m._programId);
                    return cumulative;
                }, [])
                .forEach((programId: any) => {
                    if (!programIds.find((p) => p.equals(programId))) {
                        programIds.push(programId);
                    }
                });

            const getOpenOrdersAccountsForProgramId = async (programId: any) => {
                const openOrdersAccounts = await OpenOrders.findForOwner(connection, wallet.publicKey!, programId!);
                return openOrdersAccounts.filter(
                    (openOrders: any) => openOrders.baseTokenFree.toNumber() || openOrders.quoteTokenFree.toNumber(),
                );
            };

            const openOrdersAccountsForProgramIds = await Promise.all(
                programIds.map((programId) => getOpenOrdersAccountsForProgramId(programId)),
            );

            openOrdersAccounts = openOrdersAccountsForProgramIds.reduce(
                (accounts, current) => accounts.concat(current),
                [],
            );
        }

        const settleTransactions = (
            await Promise.all(
                openOrdersAccounts.map((openOrdersAccount: any) => {
                    const market = markets.find((m) =>
                        // @ts-ignore
                        m._decoded?.ownAddress?.equals(openOrdersAccount.market),
                    );
                    if (openOrdersAccount.baseTokenFree.isZero() && openOrdersAccount.quoteTokenFree.isZero()) {
                        // nothing to settle for this market.
                        return null;
                    }
                    const baseMint = market?.baseMintAddress;
                    const quoteMint = market?.quoteMintAddress;

                    const selectedBaseTokenAccount = getSelectedTokenAccountForMint(
                        tokenAccounts,
                        baseMint,
                        baseMint && selectedTokenAccounts && selectedTokenAccounts[baseMint.toBase58()],
                    )?.pubkey;
                    const selectedQuoteTokenAccount = getSelectedTokenAccountForMint(
                        tokenAccounts,
                        quoteMint,
                        quoteMint && selectedTokenAccounts && selectedTokenAccounts[quoteMint.toBase58()],
                    )?.pubkey;
                    if (!selectedBaseTokenAccount || !selectedQuoteTokenAccount) {
                        return null;
                    }

                    let referrerQuoteWallet: PublicKey | null = null;
                    if (market && market.supportsReferralFees) {
                        const quoteReferrer = MINT_TO_REFERRER[market.quoteMintAddress.toBase58()];

                        if (quoteReferrer) {
                            referrerQuoteWallet = new PublicKey(quoteReferrer);
                        }
                    }
                    return (
                        market &&
                        market.makeSettleFundsTransaction(
                            connection,
                            openOrdersAccount,
                            selectedBaseTokenAccount,
                            selectedQuoteTokenAccount,
                            referrerQuoteWallet,
                        )
                    );
                }),
            )
        ).filter(
            (
                x,
            ): x is {
                signers: Account[];
                transaction: Transaction;
                payer: PublicKey;
            } => !!x,
        );

        if (!settleTransactions || settleTransactions.length === 0) {
            sendMixPanelEvent(MIX_PANEL_EVENTS.SETTLE_ALL_FUNDS_FAILED.name, {
                openOrderAccounts: openOrdersAccounts.map((a) => {
                    return {
                        [a.address.toBase58()]: {
                            orderIds: a.orders.map((o) => o.toString()),
                        },
                    };
                }),
                reason: "Transactions weren't settled. No transaction event or called event would be found",
                currentMarketDetails,
                vybeActionId: actionId,
            });
            setAlertTitle('Error trying to settle');
            setAlertDescription([{ value: `No valid settle transactions`, icon: 'error' }]);
            setAlertType('error');
            setAlertVisible(true);
            throw new Error('Unable to settle');
        }

        const transactions = settleTransactions.slice(0, 2).map((t) => t.transaction);

        const signers: Array<Account> = [];
        settleTransactions
            .reduce((cumulative: Array<Account>, t) => cumulative.concat(t.signers), [])
            .forEach((signer) => {
                if (!signers.find((s) => s.publicKey.equals(signer.publicKey))) {
                    signers.push(signer);
                }
            });

        const transaction = mergeTransactions(transactions);

        transaction.recentBlockhash =
            transaction.recentBlockhash || (await connection.getLatestBlockhash('finalized')).blockhash;

        return await sendTransaction({
            transaction,
            actionId,
            txType: 'SETTLE_FUNDS',
            signers,
            wallet,
            connection,
            setAlertTitle,
            setAlertDescription,
            setAlertVisible,
            setAlertType,
            sendingMessage: 'Settling funds...',
            alertTitle: 'Settling Funds',
            currentMarketDetails,
        });
    } catch (err: any) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.SETTLE_ALL_FUNDS_FAILED.name, {
            markets: markets.map((m) => m.programId.toBase58()),
            owner: wallet.publicKey?.toBase58(),
            currentMarketDetails,
            vybeActionId: actionId,
        });
        throw new Error(err);
    }
}

export const closeAccount = async (
    OOAs: any,
    connection: Connection,
    wallet: WalletContextState,
    setAlertTitle: any,
    setAlertDescription: any,
    setAlertVisible: any,
    setAlertType: any,
    currentMarketDetails: CurrentMarketDetails,
) => {
    const transaction = new Transaction();
    const actionId = uuid();

    sendMixPanelEvent(MIX_PANEL_EVENTS.CLOSE_ACCOUNT_CALLED.name, {
        vybeActionId: actionId,
        currentMarketDetails,
        openOrderAccounts: OOAs.map((o: any) => {
            return {
                market: o.market.toBase58(),
                openOrders: o.address.toBase58(),
                owner: o.owner.toBase58(),
                solWallet: o.owner.toBase58(),
                // what's the type here?
                programId: o._programId,
            };
        }),
    });

    const openOrderAccs = OOAs;

    openOrderAccs.forEach((ooa: any) => {
        transaction.add(
            DexInstructions.closeOpenOrders({
                market: ooa.market,
                openOrders: ooa.address,
                owner: ooa.owner,
                solWallet: ooa.owner,
                programId: ooa._programId,
            }),
        );
    });

    transaction.recentBlockhash =
        transaction.recentBlockhash || (await connection.getLatestBlockhash('finalized')).blockhash;

    return await sendTransaction({
        transaction,
        actionId,
        txType: 'CLOSE_ACCOUNT',
        wallet,
        connection,
        setAlertTitle,
        setAlertDescription,
        setAlertVisible,
        setAlertType,
        sendingMessage: `Closing account${openOrderAccs.length > 1 ? 's' : ''}...`,
        alertTitle: `Closing account${openOrderAccs.length > 1 ? 's' : ''}`,
        currentMarketDetails,
    });
};

export interface TokenInfo {
    symbol: string;
    name: string;
    mintAddress: string;
    decimals: number;
    referrer?: string;
}

interface Tokens {
    [key: string]: any;
    [index: number]: any;
}

export function getTokenByMintAddress(mintAddress: string): TokenInfo | null {
    if (mintAddress === NATIVE_SOL.mintAddress) {
        return cloneDeep(NATIVE_SOL);
    }

    let token = null;

    for (const symbol of Object.keys(TOKENS)) {
        const info = cloneDeep(TOKENS[symbol]);

        if (info.mintAddress === mintAddress) {
            token = info;
        }
    }

    return token;
}

export const TOKENS: Tokens = {
    WSOL: {
        symbol: 'WSOL',
        mintAddress: 'So11111111111111111111111111111111111111112',
        referrer: 'GPU6KSDxV25iVBJkUnrHY4kYVhRGQ6sTL9jyxorpaXLu',
    },
    BTC: {
        symbol: 'BTC',
        mintAddress: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
        referrer: '8NKivfZqKHgFVNLUzjuRXnQq4ncMSR8sZKbWLauX3nzk',
    },
    soETH: {
        symbol: 'soETH',
        mintAddress: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
        referrer: '8XW2qkA7PxEGEqfHhdGjuDHNQEWqfB2iuV9vpWzxqSaJ',
    },
    // USDT: {
    //     symbol: 'USDT',
    //     mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    //     referrer: '8DwwDNagph8SdwMUdcXS5L9YAyutTyDJmK6cTKrmNFk3',
    // },
    // soUSDT: {
    //     symbol: 'soUSDT',
    //     mintAddress: 'BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4',
    //     referrer: 'CA98hYunCLKgBuD6N8MJSgq1GbW9CXdksLf5mw736tS3',
    // },
    USDC: {
        symbol: 'USDC',
        mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        referrer: '2mEQSN51aZcaYqgH4QWj25FWoJvQtfzv42zHVPJWLF5g',
    },
    RAY: {
        symbol: 'RAY',
        mintAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        referrer: '33XpMmMQRf6tSPpmYyzpwU4uXpZHkFwCZsusD9dMYkjy',
    },
};

export const NATIVE_SOL: TokenInfo = {
    symbol: 'SOL',
    name: 'Native Solana',
    mintAddress: '11111111111111111111111111111111',
    decimals: 9,
};

export async function createTokenAccountTransaction({
    connection,
    wallet,
    mintPublicKey,
}: {
    connection: Connection;
    wallet: WalletContextState;
    mintPublicKey: PublicKey;
}): Promise<{
    transaction: Transaction;
    newAccountPubkey: PublicKey;
}> {
    if (wallet.publicKey) {
    }
    const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintPublicKey,
        // @ts-ignore
        wallet.publicKey,
    );
    const transaction = new Transaction();
    transaction.add(
        Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPublicKey,
            ata,
            // @ts-ignore
            wallet.publicKey,
            wallet.publicKey,
        ),
    );
    return {
        transaction,
        newAccountPubkey: ata,
    };
}

export async function placeOrder({
    side,
    price,
    size,
    kind,
    orderType,
    market,
    connection,
    wallet,
    baseCurrencyAccount,
    quoteCurrencyAccount,
    feeDiscountPubkey = undefined,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    currentMarketDetails,
}: {
    side: 'buy' | 'sell';
    price: number;
    size: number;
    kind: 'limit' | 'market';
    orderType: 'ioc' | 'postOnly' | 'limit';
    market: Market | undefined | null;
    connection: Connection;
    wallet: WalletContextState;
    baseCurrencyAccount: PublicKey | undefined;
    quoteCurrencyAccount: PublicKey | undefined;
    feeDiscountPubkey: PublicKey | undefined;
    setAlertTitle?: any;
    setAlertDescription?: any;
    setAlertVisible?: any;
    setAlertType?: any;
    currentMarketDetails: CurrentMarketDetails;
}) {
    const actionId = uuid();
    sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_CALLED.name, {
        side,
        price,
        size,
        kind,
        orderType,
        owner: wallet.publicKey?.toBase58(),
        marketAddr: market?.address.toBase58(),
        baseCurrencyAccount,
        quoteCurrencyAccount,
        feeDiscountPubkey: feeDiscountPubkey ? feeDiscountPubkey.toBase58() : null,
        vybeActionId: actionId,
        currentMarketDetails,
    });
    const isIncrement = (num: any, step: any) =>
        Math.abs((num / step) % 1) < 1e-5 || Math.abs(((num / step) % 1) - 1) < 1e-5;
    if (isNaN(price)) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: 'price is non a number',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([{ value: `Error: Please ensure your order price is a valid number.`, icon: 'error' }]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    if (isNaN(size)) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: 'size is non a number',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([{ value: `Error: Please ensure your order amount is a valid number.`, icon: 'error' }]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    if (!wallet || !wallet.publicKey) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: 'wallet not initialized correctly',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([
            { value: `Error: Please reconnect your wallet and try placing the order again.`, icon: 'error' },
        ]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    if (!market) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: 'market not found',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([
            { value: `Error: Please reselect your market and try placing the order again.`, icon: 'error' },
        ]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    // if (!isIncrement(size, market.minOrderSize)) {
    //     setAlertTitle('Error Placing Order')
    //     setAlertDescription([{value: `Error: Please make sure your order amount is an increment of the minimum order size for this market.`, icon: 'error'}])
    //     setAlertType('error')
    //     setAlertVisible(true);
    //     return;
    // }
    if (size < market.minOrderSize) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_FAILED.name, {
            reason: 'size is less than min order size',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([
            {
                value: `Error: Please increase your amount to meet the minimum order size (${market.minOrderSize}) for this market.`,
                icon: 'error',
            },
        ]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    if (!isIncrement(price, market.tickSize)) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: "price didn't increment according to market tick size",
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([{ value: `Price must be increment of ${market.tickSize}.`, icon: 'error' }]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    if (price < market.tickSize) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: 'price is less than market tick size',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([{ value: `Price must be above the market tick size ${market.tickSize}.`, icon: 'error' }]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    const owner = wallet.publicKey;
    const transaction = new Transaction();
    const signers: Account[] = [];

    // Creating necessary token accounts
    if (!baseCurrencyAccount) {
        const { transaction: createAccountTransaction, newAccountPubkey } = await createTokenAccountTransaction({
            connection,
            wallet,
            mintPublicKey: market.baseMintAddress,
        });
        transaction.add(createAccountTransaction);
        baseCurrencyAccount = newAccountPubkey;
    }
    if (!quoteCurrencyAccount) {
        const { transaction: createAccountTransaction, newAccountPubkey } = await createTokenAccountTransaction({
            connection,
            wallet,
            mintPublicKey: market.quoteMintAddress,
        });
        transaction.add(createAccountTransaction);
        quoteCurrencyAccount = newAccountPubkey;
    }

    const payer = side === 'sell' ? baseCurrencyAccount : quoteCurrencyAccount;
    if (!payer) {
        sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_ERROR.name, {
            reason: 'payer not found',
            vybeActionId: actionId,
            currentMarketDetails,
        });
        setAlertTitle('Error Placing Order');
        setAlertDescription([
            { value: `Error creating a token account for a token on this market. Please try again.`, icon: 'error' },
        ]);
        setAlertType('error');
        setAlertVisible(true);
        return;
    }
    const params = {
        owner,
        payer,
        side,
        price,
        size,
        orderType,
        feeDiscountPubkey: feeDiscountPubkey || null,
    };

    const matchOrderstransaction = market.makeMatchOrdersTransaction(5);
    transaction.add(matchOrderstransaction);
    const startTime = getUnixTs();
    let { transaction: placeOrderTx, signers: placeOrderSigners } = await market.makePlaceOrderTransaction(
        connection,
        params,
        120_000,
        120_000,
    );
    const endTime = getUnixTs();
    const timeTaken = endTime - startTime;
    console.log(`Creating order transaction took ${timeTaken}`);
    transaction.add(placeOrderTx);
    transaction.add(market.makeMatchOrdersTransaction(5));
    signers.push(...placeOrderSigners);

    sendMixPanelEvent(MIX_PANEL_EVENTS.ORDER_PLACE_TX_CREATED.name, {
        vybeActionId: actionId,
        currentMarketDetails,
    });
    return await sendTransaction({
        transaction,
        actionId,
        txType: 'PLACE_ORDER',
        wallet,
        connection,
        signers,
        alertTitle: 'Place Order',
        sendingMessage: 'Sending order...',
        setAlertTitle,
        setAlertDescription,
        setAlertVisible,
        setAlertType,
        currentMarketDetails,
    });
}

export async function awaitTransactionSignatureConfirmation(
    txid: TransactionSignature,
    timeout: number,
    connection: Connection,
) {
    let done = false;
    const result = await new Promise((resolve, reject) => {
        const confirmTxSignature = async () => {
            setTimeout(() => {
                if (done) {
                    return;
                }
                done = true;
                console.log('Timed out for txid', txid);
                reject({ timeout: true });
            }, timeout);

            try {
                connection.onSignature(
                    txid,
                    (result) => {
                        console.log('WS confirmed', txid, result);
                        done = true;
                        if (result.err) {
                            console.log(result.err);
                            reject(result.err);
                        } else {
                            resolve(result);
                        }
                    },
                    'recent',
                );
                console.log('Set up WS connection', txid);
            } catch (e) {
                done = true;
                console.log('WS error in setup', txid, e);
            }

            const checkSignatureStatuses = async () => {
                try {
                    const signatureStatuses = await connection.getSignatureStatuses([txid]);
                    const result = signatureStatuses && signatureStatuses.value[0];
                    if (!done) {
                        if (!result) {
                            console.log('REST null result for', txid, result);
                        } else if (result.err) {
                            console.log('REST error for', txid, result);
                            done = true;
                            reject(result.err);
                        } else if (!result.confirmations) {
                            console.log('REST no confirmations for', txid, result);
                        } else {
                            console.log('REST confirmation for', txid, result);
                            done = true;
                            resolve(result);
                        }
                    }
                } catch (e) {
                    if (!done) {
                        console.log('REST connection error: txid', txid, e);
                    }
                }
            };

            while (!done) {
                checkSignatureStatuses();
                await sleep(300);
            }
        };

        confirmTxSignature();
    });
    done = true;
    return result;
}

export async function simulateTransaction(
    connection: Connection,
    transaction: Transaction,
    commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    // @ts-ignore
    transaction.recentBlockhash = await connection._recentBlockhash(
        // @ts-ignore
        connection._disableBlockhashCaching,
    );

    const signData = transaction.serializeMessage();
    // @ts-ignore
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config: any = { encoding: 'base64', commitment };
    const args = [encodedTransaction, config];

    // @ts-ignore
    const res = await connection._rpcRequest('simulateTransaction', args);
    if (res.error) {
        throw new Error('failed to simulate transaction: ' + res.error.message);
    }
    return res.result;
}

export type UserTokenInfo = {
    mintAddress: PublicKey;
    tokenAccountPublicKey?: PublicKey;
    balance?: number;
    accountInfo: {
        executable?: boolean;
        lamports?: number;
        owner?: PublicKey;
    };
};

export type AllUserTokenList = {
    [index: string]: UserTokenInfo;
};

export const getUnixTs = () => {
    return new Date().getTime() / 1000;
};

export async function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const countDecimals = (value: number) => {
    if (String(value).indexOf('e-') > -1) {
        let [base, trail] = String(value).split('e-');
        let val = parseInt(trail, 10);
        return val;
    }
    if (Math.floor(value) !== Number(value)) {
        return value.toString().split('.')[1].length || 0;
    }
    return 0;
};

export const roundDownUnixTimeMs = (unixTime: number): number => {
    let formatted = new Date(unixTime);
    let seconds = formatted.getSeconds();
    return Number(((unixTime - seconds) / 1000).toFixed(0));
};

export const getSizeByTotal = (
    total: number,
    orderbook: any,
): [Big | undefined, number | undefined, number | undefined] => {
    let sizeCounter = new Big(0);
    let size = new Big(0);
    let index = 0;

    // Note: orderbook[index]: [price: number, size: number]
    // price = 0, size = 1
    while (Number(sizeCounter) < Number(total)) {
        if (!orderbook[index] || !orderbook[index]['price'] || !orderbook[index]['size']) {
            return [undefined, undefined, undefined];
        }
        let gap = new Big(total).minus(sizeCounter);
        if (gap.minus(new Big(orderbook[index]['price']).times(orderbook[index]['size'])) > new Big(0)) {
            size = size.plus(orderbook[index]['size']);
            sizeCounter = sizeCounter.plus(new Big(orderbook[index]['price']).times(orderbook[index]['size']));
        } else {
            size = size.plus(gap.div(orderbook[index]['price']));
            sizeCounter = sizeCounter.plus(gap);
        }
        index = index + 1;
    }

    const price = index > 0 ? orderbook[index - 1]['price'] : 0;
    const marketPrice = Math.min(price * 1.02, orderbook[0]['price'] * 1.05);
    const priceImpact =
        orderbook[0]['price'] && price ? Math.abs((orderbook[0]['price'] - price) / orderbook[0]['price']) : 0;

    return [size, marketPrice, priceImpact];
};

export const getTotalBySize = (
    size: number,
    orderbook: any,
): [Big | undefined, number | undefined, number | undefined] => {
    let sizeCounter = new Big(0);
    let total = new Big(0);
    let index = 0;

    // Note: orderbook[index]: [price: number, size: number]
    // size = 1, price = 0
    while (Number(sizeCounter) < Number(size)) {
        let gap = new Big(size).minus(sizeCounter).toFixed(6);
        if (!orderbook[index] || !orderbook[index]['price'] || !orderbook[index]['size']) {
            console.log('returning undefined');
            return [undefined, undefined, undefined];
        }
        if (Number(gap - orderbook[index]['size']) > 0) {
            total = total.plus(new Big(orderbook[index]['size']).times(orderbook[index]['price']));
            sizeCounter = sizeCounter.plus(orderbook[index]['size']);
        } else {
            total = total.plus(new Big(orderbook[index]['price']).times(gap));
            sizeCounter = sizeCounter.plus(gap);
        }
        index = index + 1;
    }

    const price = index > 0 ? orderbook[index - 1]['price'] : 0;
    const marketPrice = Math.min(price * 1.02, orderbook[0]['price'] * 1.05);
    const priceImpact =
        orderbook[0]['price'] && price ? Math.abs((orderbook[0]['price'] - price) / orderbook[0]['price']) : 0;

    return [total, marketPrice, priceImpact];
};

export const roundDown = (value: number | string, precision: number, fill?: boolean): string => {
    if (!value || (typeof value === 'string' && value === 'undefined')) {
        return '';
    }
    if (precision === 0) {
        return String(value).split('.')[0];
    }
    const regExp = new RegExp(`(\\d+\\.\\d{${precision}})`, 'g');
    const result = String(value).match(regExp);

    if (fill) {
        if (!result) {
            const dotPosition = String(value).split('.')[1];
            const isDotOnly = dotPosition === '';
            const decimalLength = dotPosition ? dotPosition.length : 0;
            let formatted = decimalLength === 0 ? (isDotOnly ? String(value) : String(value) + '.') : String(value);
            for (let i = 0; i < precision - decimalLength; i += 1) {
                formatted = formatted + '0';
            }
            return formatted;
        }
        return value < 0 ? '-' + result[0] : result[0];
    } else {
        return result ? (value < 0 ? '-' + result[0] : result[0]) : String(value);
    }
};

// MARKET UTILS
export interface TokenAccount {
    pubkey: PublicKey;
    account: AccountInfo<Buffer> | null;
    effectiveMint: PublicKey;
}

const _SLOW_REFRESH_INTERVAL = 5 * 1000;

export function useTokenAccounts(connection: any): [TokenAccount[] | null | undefined, boolean] {
    const { connected, wallet, publicKey } = useWallet();
    async function getTokenAccounts() {
        if (!connected || !wallet) {
            return null;
        }
        return await getTokenAccountInfo(connection, publicKey);
    }
    return useAsyncData(getTokenAccounts, tuple('getTokenAccounts', wallet, connected), {
        refreshInterval: _SLOW_REFRESH_INTERVAL,
    });
}

export function getSelectedTokenAccountForMint(
    accounts: TokenAccount[] | undefined | null,
    mint: PublicKey | undefined,
    selectedPubKey?: string | PublicKey | null,
) {
    if (!accounts || !mint) {
        return null;
    }
    const filtered = accounts.filter(
        ({ effectiveMint, pubkey }) =>
            mint.equals(effectiveMint) &&
            (!selectedPubKey ||
                (typeof selectedPubKey === 'string' ? selectedPubKey : selectedPubKey.toBase58()) ===
                    pubkey.toBase58()),
    );
    return filtered && filtered[0];
}

// TOKEN UTILS
export const ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.blob(32, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
]);

export async function getTokenAccountInfo(connection: Connection, ownerAddress: PublicKey | null) {
    if (!ownerAddress) {
        console.log('No Owner Address');
        return null;
    }

    let [splAccounts, account] = await Promise.all([
        getOwnedTokenAccounts(connection, ownerAddress),
        connection.getAccountInfo(ownerAddress),
    ]);
    const parsedSplAccounts: TokenAccount[] = splAccounts.map(({ publicKey, accountInfo }) => {
        return {
            pubkey: publicKey,
            account: accountInfo,
            effectiveMint: parseTokenAccountData(accountInfo.data).mint,
        };
    });
    return parsedSplAccounts.concat({
        pubkey: ownerAddress,
        account,
        effectiveMint: WRAPPED_SOL_MINT,
    });
}

export async function getOwnedTokenAccounts(
    connection: Connection,
    publicKey: PublicKey,
): Promise<Array<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }>> {
    let filters = getOwnedAccountsFilters(publicKey);
    let resp = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters,
    });
    return resp.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
        publicKey: new PublicKey(pubkey),
        accountInfo: {
            data,
            executable,
            owner: new PublicKey(owner),
            lamports,
        },
    }));
}

export function parseTokenAccountData(data: Buffer): { mint: PublicKey; owner: PublicKey; amount: number } {
    let { mint, owner, amount } = ACCOUNT_LAYOUT.decode(data);
    return {
        mint: new PublicKey(mint),
        owner: new PublicKey(owner),
        amount,
    };
}

export function getOwnedAccountsFilters(publicKey: PublicKey) {
    return [
        {
            memcmp: {
                offset: ACCOUNT_LAYOUT.offsetOf('owner'),
                bytes: publicKey.toBase58(),
            },
        },
        {
            dataSize: ACCOUNT_LAYOUT.span,
        },
    ];
}

// FETCHING DATA
class FetchLoopInternal<T = any> {
    cacheKey: any;
    fn: () => Promise<T>;
    timeoutId: null | any;
    listeners: Set<FetchLoopListener<T>>;
    errors: number;
    cacheNullValues: Boolean = true;

    constructor(cacheKey: any, fn: () => Promise<T>, cacheNullValues: Boolean) {
        this.cacheKey = cacheKey;
        this.fn = fn;
        this.timeoutId = null;
        this.listeners = new Set();
        this.errors = 0;
        this.cacheNullValues = cacheNullValues;
    }

    get refreshInterval(): number {
        return Math.min(...Array.from(this.listeners).map((listener) => listener.refreshInterval));
    }

    get refreshIntervalOnError(): number | null {
        const refreshIntervalsOnError: number[] = Array.from(this.listeners)
            .map((listener) => listener.refreshIntervalOnError)
            .filter((x): x is number => x !== null);
        if (refreshIntervalsOnError.length === 0) {
            return null;
        }
        return Math.min(...refreshIntervalsOnError);
    }

    get stopped(): boolean {
        return this.listeners.size === 0;
    }

    addListener(listener: FetchLoopListener<T>): void {
        const previousRefreshInterval = this.refreshInterval;
        this.listeners.add(listener);
        if (this.refreshInterval < previousRefreshInterval) {
            this.refresh();
        }
    }

    removeListener(listener: FetchLoopListener<T>): void {
        assert(this.listeners.delete(listener));
        if (this.stopped) {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        }
    }

    notifyListeners(): void {
        this.listeners.forEach((listener) => listener.callback());
    }

    refresh = async () => {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.stopped) {
            return;
        }

        let errored = false;
        try {
            const data = await this.fn();
            if (!this.cacheNullValues && data === null) {
                console.log(`Not caching null value for ${this.cacheKey}`);
                // cached data has not changed so no need to re-render
                this.errors = 0;
                return data;
            } else {
                globalCache.set(this.cacheKey, data);
                this.errors = 0;
                this.notifyListeners();
                return data;
            }
        } catch (error) {
            ++this.errors;
            console.warn(error);
            errored = true;
        } finally {
            if (!this.timeoutId && !this.stopped) {
                let waitTime = this.refreshInterval;
                if (errored && this.refreshIntervalOnError && this.refreshIntervalOnError > 0) {
                    waitTime = this.refreshIntervalOnError;
                }

                // Back off on errors.
                if (this.errors > 0) {
                    waitTime = Math.min(1000 * 2 ** (this.errors - 1), 60000);
                }

                // Don't do any refreshing for the first five seconds, to make way for other things to load.
                const timeSincePageLoad = +new Date() - +pageLoadTime;
                if (timeSincePageLoad < 5000) {
                    waitTime += 5000 - timeSincePageLoad / 2;
                }

                // Refresh background pages slowly.
                if (document.visibilityState === 'hidden') {
                    waitTime = 60000;
                } else if (!document.hasFocus()) {
                    waitTime *= 1.5;
                }

                // Add jitter so we don't send all requests at the same time.
                waitTime *= 0.8 + 0.4 * Math.random();

                this.timeoutId = setTimeout(this.refresh, waitTime);
            }
        }
    };
}

class FetchLoops {
    loops = new Map();

    addListener<T>(listener: FetchLoopListener<T>) {
        if (!this.loops.has(listener.cacheKey)) {
            this.loops.set(
                listener.cacheKey,
                new FetchLoopInternal<T>(listener.cacheKey, listener.fn, listener.cacheNullValues),
            );
        }
        this.loops.get(listener.cacheKey).addListener(listener);
    }

    removeListener<T>(listener: FetchLoopListener<T>) {
        const loop = this.loops.get(listener.cacheKey);
        loop.removeListener(listener);
        if (loop.stopped) {
            this.loops.delete(listener.cacheKey);
            globalCache.delete(listener.cacheKey);
        }
    }

    refresh(cacheKey: any) {
        if (this.loops.has(cacheKey)) {
            this.loops.get(cacheKey).refresh();
        }
    }

    refreshAll() {
        return Promise.all(Array.from(this.loops.values()).map((loop) => loop.refresh()));
    }
}

const globalLoops = new FetchLoops();

export function useAsyncData<T = any>(
    asyncFn: () => Promise<T>,
    cacheKey: any,
    { refreshInterval = 60000, refreshIntervalOnError = null } = {},
    cacheNullValues: Boolean = true,
): [null | undefined | T, boolean] {
    const [, rerender] = useReducer((i) => i + 1, 0);

    useEffect(() => {
        if (!cacheKey) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {};
        }
        const listener = new FetchLoopListener<T>(
            cacheKey,
            asyncFn,
            refreshInterval,
            refreshIntervalOnError,
            rerender,
            cacheNullValues,
        );
        globalLoops.addListener(listener);
        return () => globalLoops.removeListener(listener);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, refreshInterval]);

    if (!cacheKey) {
        return [null, false];
    }

    const loaded = globalCache.has(cacheKey);
    const data = loaded ? globalCache.get(cacheKey) : undefined;
    return [data, loaded];
}

class FetchLoopListener<T = any> {
    cacheKey: any;
    fn: () => Promise<T>;
    refreshInterval: number;
    refreshIntervalOnError: number | null;
    callback: () => void;
    cacheNullValues: Boolean = true;

    constructor(
        cacheKey: any,
        fn: () => Promise<T>,
        refreshInterval: number,
        refreshIntervalOnError: number | null,
        callback: () => void,
        cacheNullValues: Boolean,
    ) {
        this.cacheKey = cacheKey;
        this.fn = fn;
        this.refreshInterval = refreshInterval;
        this.refreshIntervalOnError = refreshIntervalOnError;
        this.callback = callback;
        this.cacheNullValues = cacheNullValues;
    }
}

// CONNECTION
export interface EndpointInfo {
    name: string;
    endpoint: string;
    custom: boolean;
}

export interface ConnectionContextValues {
    endpoint: string;
    setEndpoint: (newEndpoint: string) => void;
    connection: Connection;
    sendConnection: Connection;
    availableEndpoints: EndpointInfo[];
    setCustomEndpoints: (newCustomEndpoints: EndpointInfo[]) => void;
}

const ConnectionContext: React.Context<null | ConnectionContextValues> =
    React.createContext<null | ConnectionContextValues>(null);

export function useConnection() {
    const context = useContext(ConnectionContext);
    if (!context) {
        throw new Error('Missing connection context');
    }
    return context.connection;
}

export function useLocalStorageState<T = any>(key: string, defaultState: T | null = null): [T, (newState: T) => void] {
    let [stringState, setStringState] = useLocalStorageStringState(key, JSON.stringify(defaultState));
    return [
        useMemo(() => stringState && JSON.parse(stringState), [stringState]),
        (newState) => setStringState(JSON.stringify(newState)),
    ];
}

export interface LocalStorageStringState {
    [state: string]: any;
}

const localStorageListeners: LocalStorageStringState = {} as any;

export function useLocalStorageStringState(
    key: string,
    defaultState: string | null = null,
): [string | null, (newState: string | null) => void] {
    const state = localStorage.getItem(key) || defaultState;

    const [, notify] = useState(key + '\n' + state);

    useEffect(() => {
        if (!localStorageListeners[key]) {
            localStorageListeners[key] = [];
        }
        localStorageListeners[key].push(notify);
        return () => {
            localStorageListeners[key] = localStorageListeners[key].filter((listener: any) => listener !== notify);
            if (localStorageListeners[key].length === 0) {
                delete localStorageListeners[key];
            }
        };
    }, [key]);

    const setState = useCallback<(newState: string | null) => void>(
        (newState: any) => {
            const changed = state !== newState;
            if (!changed) {
                return;
            }

            if (newState === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, newState);
            }
            localStorageListeners[key]?.forEach((listener: any) => listener(key + '\n' + newState));
        },
        [state, key],
    );

    return [state, setState];
}

export const useMarketData = () => {
    const marketData = useQuery('market_stats', gqlMarketStats);

    let marketsData = [];
    if (marketData?.data?.data?.data?.api_serum_dex_m?.marketStats) {
        const response = marketData?.data?.data.data.api_serum_dex_m.marketStats;
        for (let i = 0; i < marketData?.data?.data.data.api_serum_dex_m.marketStats.length; i++) {
            marketsData.push({
                name: response[i].marketName,
                deprecated: false,
                address: new PublicKey(response[i].marketAddress),
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                baseLabel: response[i].marketName.split('/')[0],
                quoteLabel: response[i].marketName.split('/')[1],
            });
        }
    }

    return marketsData;
};

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height,
    };
}

export function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

export function jsonFriendlyErrorReplacer(key: string, value: any): any {
    if (value instanceof Error) {
        return {
            // Pull all enumerable properties, supporting properties on custom Errors
            ...value,
            // Explicitly pull Error's non-enumerable properties
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    return value;
}

export function sendMixPanelEvent(eventName: string, additionalProps?: Record<string, any>) {
    if (process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN) {
        try {
            mixpanel.track(eventName, additionalProps);
        } catch (e) {
            if (process.env.REACT_APP_ENV === 'development') {
                console.error(
                    'Failed to send event to mixpanel. Error: ' + JSON.stringify(e, jsonFriendlyErrorReplacer),
                );
            }
        }
    }
}
