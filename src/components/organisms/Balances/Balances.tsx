// External Imports
import React, { useEffect, useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { FaQuestionCircle } from 'react-icons/fa';
import { useQueryClient } from 'react-query';

// Local Imports
import Button from 'components/atoms/Button/Button';
import { Row, Col } from 'components/atoms/Grid/Grid';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';
import { settleFunds } from 'utils/index';
import {
    Balances as BalancesType,
    useBalances,
    useSelectedBaseCurrencyAccount,
    useSelectedOpenOrdersAccount,
    useSelectedQuoteCurrencyAccount,
} from 'utils/market';
import { useMarket } from 'utils/context';
import { countDecimals } from 'utils';

// CSS Imports
import './Balances.less';

interface BalancesProps {
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
}

function Balances({ setAlertTitle, setAlertDescription, setAlertVisible, setAlertType }: BalancesProps) {
    const { baseCurrency, quoteCurrency, market, baseMintAddress, quoteMintAddress, marketName, marketAddress } =
        useMarket();
    const openOrdersAccount = useSelectedOpenOrdersAccount(true);
    const { connection } = useConnection();
    const wallet = useWallet();
    const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
    const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();
    const balances = useBalances();
    const reactQueryClient = useQueryClient();

    const quoteDecimalDigits = useMemo(() => {
        if (market) {
            return countDecimals(market['tickSize']) === 0 ? 1 : countDecimals(market['tickSize']);
        } else {
            return 4;
        }
    }, [market]);

    const baseDecimalDigits = useMemo(() => {
        if (market) {
            return countDecimals(market['minOrderSize']) === 0 ? 1 : countDecimals(market['minOrderSize']);
        } else {
            return 4;
        }
    }, [market]);

    const formattedBalances = useMemo(() => {
        if (balances) {
            const baseCurrencyBalances = balances && balances.find((b) => b.coin === baseCurrency);
            const quoteCurrencyBalances = balances && balances.find((b) => b.coin === quoteCurrency);
            const formatted: [string | undefined, BalancesType | undefined, string, string | undefined][] = [
                [baseCurrency, baseCurrencyBalances, 'base', market?.baseMintAddress.toBase58()],
                [quoteCurrency, quoteCurrencyBalances, 'quote', market?.quoteMintAddress.toBase58()],
            ];
            return formatted;
        }
        return [];
    }, [balances, baseCurrency, market?.baseMintAddress, market?.quoteMintAddress, quoteCurrency]);

    async function onSettleFunds() {
        if (!wallet) {
            console.log('no wallet connected');
            return;
        }

        if (!market) {
            console.log('market is undefined');
            return;
        }

        if (!openOrdersAccount) {
            console.log('open orders account is undefined');
            return;
        }

        if (!baseCurrencyAccount) {
            console.log('base open orders account is undefined');
            return;
        }

        if (!quoteCurrencyAccount) {
            console.log('quote open orders account is undefined');
            return;
        }

        try {
            await settleFunds({
                market,
                openOrders: openOrdersAccount,
                connection,
                wallet,
                baseCurrencyAccount,
                quoteCurrencyAccount,
                setAlertTitle,
                setAlertDescription,
                setAlertVisible,
                setAlertType,
                currentMarketDetails: {
                    name: marketName,
                    addr: marketAddress,
                },
            });

            reactQueryClient.refetchQueries(['marketOOA', wallet?.publicKey?.toBase58() || '', marketAddress]);
        } catch (e: any) {
            console.log(e.message);
        }
    }

    return (
        <div style={{ height: '23.1vh', position: 'relative', margin: '0vh 1rem' }}>
            <Row
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'white',
                    textAlign: 'center',
                }}
            >
                <Col
                    span={6}
                    style={{
                        textAlign: 'left',
                        fontFamily: 'Inconsolata',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        lineHeight: '5vh',
                    }}
                >
                    Asset
                </Col>
                <Col
                    span={6}
                    style={{
                        fontFamily: 'Inconsolata',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        lineHeight: '5vh',
                    }}
                >
                    Wallet
                </Col>
                <Col
                    span={6}
                    style={{
                        fontFamily: 'Inconsolata',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        lineHeight: '5vh',
                    }}
                >
                    Orders
                </Col>
                <Col
                    span={6}
                    style={{
                        fontFamily: 'Inconsolata',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        lineHeight: '5vh',
                    }}
                >
                    Unsettled
                </Col>
            </Row>
            {formattedBalances?.map(
                // @ts-ignore
                ([currency, balances, type], index) => (
                    <React.Fragment key={index}>
                        <Row
                            style={{
                                fontSize: 12,
                                color: 'rgba(241, 241, 242, 1)',
                                textAlign: 'center',
                                paddingBottom: 18,
                            }}
                        >
                            <Col
                                span={6}
                                style={{
                                    fontWeight: '900',
                                    textAlign: 'left',
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '14px',
                                }}
                            >
                                {index === 0 && (
                                    <div className="balances__asset_wrapper">
                                        <TokenIcon mint={baseMintAddress} className="balances__asset_icon" />
                                        {currency}
                                    </div>
                                )}
                                {index === 1 && (
                                    <div className="balances__asset_wrapper">
                                        <TokenIcon mint={quoteMintAddress} className="balances__asset_icon" />
                                        {currency}
                                    </div>
                                )}
                            </Col>
                            <Col
                                span={6}
                                style={{
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '14px',
                                }}
                            >
                                {balances &&
                                    balances.wallet?.toFixed(index === 0 ? baseDecimalDigits : quoteDecimalDigits)}
                            </Col>
                            <Col
                                span={6}
                                style={{
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '14px',
                                }}
                            >
                                {balances && balances.orders}
                            </Col>
                            <Col
                                span={6}
                                style={{
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '14px',
                                }}
                            >
                                {balances && balances.unsettled}
                            </Col>
                        </Row>
                    </React.Fragment>
                ),
            )}
            {formattedBalances &&
            ((formattedBalances[0][1]?.unsettled && formattedBalances[0][1]?.unsettled > 0) ||
                (formattedBalances[1][1]?.unsettled && formattedBalances[1][1]?.unsettled > 0)) ? (
                <Row>
                    <Col span={24} style={{ paddingTop: '1.7rem' }}>
                        <Button
                            type="default"
                            className="balances__settle_button"
                            onClick={() => {
                                onSettleFunds();
                            }}
                        >
                            Settle All
                        </Button>
                    </Col>
                </Row>
            ) : (
                <div></div>
            )}
        </div>
    );
}

export default Balances;
