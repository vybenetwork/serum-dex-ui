import React, { useContext, useState, useEffect } from 'react';
import { PublicKey, AccountInfo, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Market, OpenOrders, TokenInstructions, TOKEN_MINTS } from '@project-serum/serum';
import { useAccountInfo } from 'utils/connection';
import BN from 'bn.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAsyncData } from 'utils/fetch';
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions';
import { sleep, useLocalStorageState } from 'utils/index';
import { _MARKETS } from './markets';
import { useMarket } from 'utils/context';
import { useMarketOpenOrdersAccounts } from './accounts';
// @ts-ignore
import tuple from 'immutable-tuple';

//@ts-ignore
import * as BufferLayout from 'buffer-layout';
import { resolve } from 'path';

/*
 * Interface declarations used for market util functions
 */
interface BalancesBase {
    key: string;
    coin: string;
    wallet?: number | null | undefined;
    orders?: number | null | undefined;
    openOrders?: OpenOrders | null | undefined;
    unsettled?: number | null | undefined;
}

export interface Balances extends BalancesBase {
    market?: Market | null | undefined;
}

export interface MarketInfo {
    address: PublicKey;
    name: string;
    programId: PublicKey;
    deprecated: boolean;
    quoteLabel?: string;
    baseLabel?: string;
}

export interface FullMarketInfo {
    address?: PublicKey;
    name?: string;
    programId?: PublicKey;
    deprecated?: boolean;
    quoteLabel?: string;
    baseLabel?: string;
    marketName?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    marketInfo?: MarketInfo;
}

export interface CustomMarketInfo {
    address: string;
    name: string;
    programId: string;
    quoteLabel?: string;
    baseLabel?: string;
}

export interface MarketContextValues extends FullMarketInfo {
    market: Market | undefined | null;
    setMarketAddress: (newMarketAddress: string) => void;
    customMarkets: CustomMarketInfo[];
    setCustomMarkets: (newCustomMarkets: CustomMarketInfo[]) => void;
}

export interface TokenAccount {
    pubkey: PublicKey;
    account: AccountInfo<Buffer> | null;
    effectiveMint: PublicKey;
}

export const ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.blob(32, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
]);

export interface SelectedTokenAccounts {
    [tokenMint: string]: string;
}

/*
 * Utility functions used for market operations
 */
const MarketContext: React.Context<null | MarketContextValues> = React.createContext<null | MarketContextValues>(null);

// export function useMarket() {
//     const context = useContext(MarketContext);
//     if (!context) {
//       throw new Error('Missing market context');
//     }
//     return context;
// }

export function useBalances(): Balances[] {
    const baseCurrencyBalances = useSelectedBaseCurrencyBalances();
    const quoteCurrencyBalances = useSelectedQuoteCurrencyBalances();
    const openOrders = useMarketOpenOrdersAccounts(4000)?.data?.[0] || null;

    const { baseCurrency, quoteCurrency, market } = useMarket();
    const baseExists = openOrders && openOrders.baseTokenTotal && openOrders.baseTokenFree;
    const quoteExists = openOrders && openOrders.quoteTokenTotal && openOrders.quoteTokenFree;

    if (baseCurrency === 'UNKNOWN' || quoteCurrency === 'UNKNOWN' || !baseCurrency || !quoteCurrency) {
        return [];
    }
    return [
        {
            market,
            key: `${baseCurrency}${quoteCurrency}${baseCurrency}`,
            coin: baseCurrency,
            wallet: baseCurrencyBalances,
            orders:
                baseExists && market && openOrders
                    ? market.baseSplSizeToNumber(openOrders.baseTokenTotal.sub(openOrders.baseTokenFree))
                    : null,
            openOrders,
            unsettled: baseExists && market && openOrders ? market.baseSplSizeToNumber(openOrders.baseTokenFree) : null,
        },
        {
            market,
            key: `${quoteCurrency}${baseCurrency}${quoteCurrency}`,
            coin: quoteCurrency,
            wallet: quoteCurrencyBalances,
            openOrders,
            orders:
                quoteExists && market && openOrders
                    ? market.quoteSplSizeToNumber(openOrders.quoteTokenTotal.sub(openOrders.quoteTokenFree))
                    : null,
            unsettled:
                quoteExists && market && openOrders ? market.quoteSplSizeToNumber(openOrders.quoteTokenFree) : null,
        },
    ];
}

export function useSelectedBaseCurrencyBalances() {
    const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
    const { market } = useMarket();
    const [accountInfo, loaded] = useAccountInfo(baseCurrencyAccount?.pubkey);
    if (!market || !baseCurrencyAccount || !loaded || !accountInfo) {
        return null;
    }
    if (market.baseMintAddress.equals(TokenInstructions.WRAPPED_SOL_MINT)) {
        return accountInfo?.lamports / 1e9 ?? 0;
    }
    return market.baseSplSizeToNumber(new BN(accountInfo.data.slice(64, 72), 10, 'le'));
}

const _SLOW_REFRESH_INTERVAL = 5 * 1000;
const _FAST_REFRESH_INTERVAL = 1000;

export function useTokenAccounts(): [TokenAccount[] | null | undefined, boolean] {
    const { connected, wallet, publicKey } = useWallet();
    const { connection } = useConnection();
    async function getTokenAccounts() {
        if (!connected || !wallet) {
            return null;
        }
        return await getTokenAccountInfo(connection, publicKey);
    }
    sleep(2000);
    return useAsyncData(getTokenAccounts, tuple('getTokenAccounts', wallet, connected), {
        refreshInterval: _SLOW_REFRESH_INTERVAL,
    });
}

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

export function parseTokenAccountData(data: Buffer): { mint: PublicKey; owner: PublicKey; amount: number } {
    let { mint, owner, amount } = ACCOUNT_LAYOUT.decode(data);
    return {
        mint: new PublicKey(mint),
        owner: new PublicKey(owner),
        amount,
    };
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

export function useSelectedBaseCurrencyAccount() {
    const [accounts] = useTokenAccounts();
    const { market } = useMarket();
    const [selectedTokenAccounts] = useSelectedTokenAccounts();
    const mintAddress = market?.baseMintAddress;
    return getSelectedTokenAccountForMint(
        accounts,
        mintAddress,
        mintAddress && selectedTokenAccounts[mintAddress.toBase58()],
    );
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

export function useSelectedTokenAccounts(): [
    SelectedTokenAccounts,
    (newSelectedTokenAccounts: SelectedTokenAccounts) => void,
] {
    const [selectedTokenAccounts, setSelectedTokenAccounts] = useLocalStorageState<SelectedTokenAccounts>(
        'selectedTokenAccounts',
        {},
    );
    return [selectedTokenAccounts, setSelectedTokenAccounts];
}

export function useSelectedQuoteCurrencyBalances() {
    const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();
    const { market } = useMarket();
    const [accountInfo, loaded] = useAccountInfo(quoteCurrencyAccount?.pubkey);
    if (!market || !quoteCurrencyAccount || !loaded || !accountInfo) {
        return null;
    }
    if (market.quoteMintAddress.equals(TokenInstructions.WRAPPED_SOL_MINT)) {
        return accountInfo?.lamports / 1e9 ?? 0;
    }
    return market.quoteSplSizeToNumber(new BN(accountInfo.data.slice(64, 72), 10, 'le'));
}

export function useSelectedQuoteCurrencyAccount() {
    const [accounts] = useTokenAccounts();
    const { market } = useMarket();
    const [selectedTokenAccounts] = useSelectedTokenAccounts();
    const mintAddress = market?.quoteMintAddress;
    return getSelectedTokenAccountForMint(
        accounts,
        mintAddress,
        mintAddress && selectedTokenAccounts[mintAddress.toBase58()],
    );
}

export function useSelectedOpenOrdersAccount(fast = false) {
    const [accounts] = useOpenOrdersAccounts(fast);
    if (!accounts) {
        return null;
    }
    return accounts[0];
}

export function useOpenOrdersAccounts(fast = false) {
    const { market } = useMarket();
    const { connected, wallet, publicKey } = useWallet();
    const { connection } = useConnection();
    async function getOpenOrdersAccounts() {
        if (!connected || !wallet) {
            return null;
        }
        if (!market || publicKey === null) {
            return null;
        }
        return await market.findOpenOrdersAccountsForOwner(connection, publicKey);
    }
    return useAsyncData<OpenOrders[] | null>(
        getOpenOrdersAccounts,
        tuple('getOpenOrdersAccounts', wallet, market, connected),
        { refreshInterval: fast ? _FAST_REFRESH_INTERVAL : _SLOW_REFRESH_INTERVAL },
    );
}

const DEFAULT_MARKET = 'RAY/USDT';

export function MarketProvider({
    marketAddress,
    setMarketAddress,
    children,
}: {
    marketAddress: any;
    setMarketAddress: any;
    children: any;
}) {
    const { customMarkets, setCustomMarkets } = useCustomMarkets();

    const address = marketAddress && new PublicKey(marketAddress);
    const { connection } = useConnection();
    const marketInfos = getMarketInfos(customMarkets);
    const marketInfo = address && marketInfos.find((market: any) => market.address.equals(address));

    const [market, setMarket] = useState<Market | null>();

    const [marketName, setMarketName] = useState('RAY/USDT');

    // Replace existing market with a non-deprecated one on first load
    useEffect(() => {
        if (marketInfo) {
            if (marketInfo.deprecated) {
                console.log('Switching markets from deprecated', marketInfo);
                if (DEFAULT_MARKET) {
                    // setMarketAddress(DEFAULT_MARKET.address.toBase58());
                    setMarketAddress('C4z32zw9WKaGPhNuU54ohzrV4CE1Uau3cFx6T8RLjxYC');
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (
            market &&
            marketInfo &&
            // @ts-ignore
            market._decoded.ownAddress?.equals(marketInfo?.address)
        ) {
            return;
        }
        setMarket(null);

        if (!marketInfo || !marketInfo.address) {
            // notify({
            //   message: 'Error loading market',
            //   description: 'Please select a market from the dropdown',
            //   type: 'error',
            // });
            console.log('error loading market, select market.');
            return;
        } else {
            setMarketName(marketInfo.name);
        }
        Market.load(connection, marketInfo.address, {}, marketInfo.programId)
            .then(setMarket)
            .catch((e) =>
                //   notify({
                //     message: 'Error loading market',
                //     description: e.message,
                //     type: 'error',
                //   })
                console.log('error loading market' + e),
            );
        // eslint-disable-next-line
    }, [connection, marketInfo]);

    return (
        <MarketContext.Provider
            value={{
                market,
                ...getMarketDetails(market, customMarkets),
                setMarketAddress,
                customMarkets,
                setCustomMarkets,
                marketName,
            }}
        >
            {children}
        </MarketContext.Provider>
    );
}

export function getMarketDetails(market: Market | undefined | null, customMarkets: CustomMarketInfo[]): FullMarketInfo {
    if (!market) {
        return {};
    }
    const marketInfos = getMarketInfos(customMarkets);
    const marketInfo = marketInfos.find((otherMarket) => otherMarket.address.equals(market.address));

    // add new token here
    // TOKEN_MINTS.push({
    //   address: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    //   name: 'RAY',
    // });
    for (let indexItem = 0; indexItem < TOKEN_MINTS.length; indexItem += 1) {
        if (TOKEN_MINTS[indexItem].address.toString() === '3K6rftdAaQYMPunrtNRHgnK2UAtjm2JwyT2oCiTDouYE') {
            TOKEN_MINTS[indexItem].name = 'xCOPE';
        }
    }
    TOKEN_MINTS.push({
        address: new PublicKey('8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh'),
        name: 'COPE',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT'),
        name: 'STEP',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs'),
        name: 'MEDIA',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('8PMHT4swUMtBzgHnh5U564N5sjPSiUz2cjEQzFnnP1Fo'),
        name: 'ROPE',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K'),
        name: 'MER',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('TuLipcqtGVXP9XR62wM8WWCm6a9vhLs7T1uoWBk6FDs'),
        name: 'TULIP',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('E5rk3nmgLUuKUiS94gg4bpWwWwyjCMtddsAXkTFLtHEy'),
        name: 'WOO',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('4dmKkXNHdgYsXqBHCuMikNQWwVomZURhYvkkX5c4pQ7y'),
        name: 'SNY',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('BLwTnYKqf7u4qjgZrrsKeNs2EzWkMLqVCu6j8iHyrNA3'),
        name: 'BOP',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('SLRSSpSLUTP7okbCUBYStWCo1vUgyt775faPqz8HUMr'),
        name: 'SLRS',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
        name: 'SAMO',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5'),
        name: 'renBTC',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('ArUkYE2XDKzqy77PRRGjo4wREWwqk6RXTfM9NeqzPvjU'),
        name: 'renDOGE',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('3bRTivrVsitbmCTGtqwp7hxXPsybkjn4XLNtPsHqa3zR'),
        name: 'LIKE',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('GsNzxJfFn6zQdJGeYsupJWzUAm57Ba7335mfhWvFiE9Z'),
        name: 'DXL',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'),
        name: 'mSOL',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS'),
        name: 'PAI',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('PoRTjZMPXb9T7dyU7tpLEZRQj7e6ssfAE62j2oQuc6y'),
        name: 'PORT',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'),
        name: 'MNGO',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('DubwWZNWiNGMMeeQHPnMATNj77YZPZSAz2WVR5WjLJqz'),
        name: 'CRP',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx'),
        name: 'ATLAS',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk'),
        name: 'POLIS',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('8upjSpvjcdpuzhfR1zriwg5NXkwDruejqNE9WNbPRtyA'),
        name: 'GRAPE',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('Lrxqnh6ZHKbGy3dcrCED43nsoLkM1LTzU2jRfWe8qUC'),
        name: 'LARIX',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp'),
        name: 'RIN',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('51tMb3zBKDiQhNwGqpgwbavaGH54mk8fXFzxTc1xnasg'),
        name: 'APEX',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey'),
        name: 'MNDE',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('4wjPQJ6PrkC4dHhYghwJzGBVP78DkBzA2U3kHoFNBuhj'),
        name: 'LIQ',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('5tN42n9vMi6ubp67Uy4NnmM5DMZYN8aS8GeB3bEDHr6E'),
        name: 'WAG',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('9vaCzR4n4QpdN2vyaFmy7ZtvzGHVY3WVzDnLJAQLsKCX'),
        name: 'JungleCats',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('FnKE9n6aGjQoNWRBZXy4RW6LZVao7qwBonUbiD7edUmZ'),
        name: 'SYP',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('23sUwdK725SsMe9L5sX6h1NaLJvuhFcBQ8tunpNcc3R7'),
        name: 'MUNK',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('Aj2HHSuPg1WmyAa6eAyS2uamESPomsoGsi56LXjNyXrb'),
        name: 'Legends',
    });
    TOKEN_MINTS.push({
        address: new PublicKey('9nEqaUcb16sQ3Tn1psbkWqyhPdLmfHWjKGymREjsAgTE'),
        name: 'WOOF',
    });

    const baseCurrency =
        (market?.baseMintAddress && TOKEN_MINTS.find((token) => token.address.equals(market.baseMintAddress))?.name) ||
        (marketInfo?.baseLabel && `${marketInfo?.baseLabel}*`) ||
        'UNKNOWN';
    const quoteCurrency =
        (market?.quoteMintAddress &&
            TOKEN_MINTS.find((token) => token.address.equals(market.quoteMintAddress))?.name) ||
        (marketInfo?.quoteLabel && `${marketInfo?.quoteLabel}*`) ||
        'UNKNOWN';
    return {
        ...marketInfo,
        marketName: marketInfo?.name,
        baseCurrency,
        quoteCurrency,
        marketInfo,
    };
}

export function getMarketInfos(customMarkets: CustomMarketInfo[]): MarketInfo[] {
    const customMarketsInfo = customMarkets.map((m) => ({
        ...m,
        address: new PublicKey(m.address),
        programId: new PublicKey(m.programId),
        deprecated: false,
    }));

    return [...customMarketsInfo, ...USE_MARKETS];
}

export function useCustomMarkets() {
    const [customMarkets, setCustomMarkets] = useLocalStorageState<CustomMarketInfo[]>('customMarkets', []);
    return { customMarkets, setCustomMarkets };
}

export const USE_MARKETS = _MARKETS;
