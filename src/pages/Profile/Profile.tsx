/* eslint-disable array-callback-return */
import { useState, useMemo, useCallback, Fragment, useEffect, ReactNode } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from 'react-query';
import { PublicKey } from '@solana/web3.js';
import { Market, OpenOrders } from '@project-serum/serum';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { css } from '@emotion/react';
import { Progress } from 'antd';
import { FaWallet } from 'react-icons/fa';

import { Row, Col } from 'components/atoms/Grid/Grid';
import Checkbox from 'components/atoms/Checkbox/Checkbox';
import Button from 'components/atoms/Button/Button';
import Alert from 'components/atoms/Alert/Alert';
import ButtonDropdown from 'components/molecules/ButtonDropdown/ButtonDropdown';
import Skeleton from 'components/atoms/Skeleton/Skeleton';
import Empty from 'components/atoms/Empty/Empty';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';

import { gqlMarketStats, gqlTokenStats, gqlMarketTradesByOOA } from 'requests/index';
import { cancelOrders, useTokenAccounts, settleAllFunds, closeAccount } from 'utils/index';
import { TABLE_HEADER_COL, BALANCE_COLORS } from './styling';
import { useMarket } from 'utils/context';

import vybelogo from 'assets/images/logo192.png';

const SOL_PER_LAMPORT = 0.000000001;
const OOA_RENT_LAMPORT = 23357760;
const SOL_MINT = 'So11111111111111111111111111111111111111112';

const PROGRAM_ID = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
const PROGRAM_ADDRESS = new PublicKey(PROGRAM_ID);

const TABLE_VIEWS = [
    { label: 'OPEN ORDERS', value: 'openorders' },
    { label: 'UNSETTLED BALANCES', value: 'unsettled' },
    { label: 'TRADE HISTORY', value: 'tradehistory' },
];
const DEFAULT_TABLE_VIEW = 'openorders';

const TableHeader = ({ headers, minWidth }: { headers: Record<string, any>[]; minWidth?: string }) => {
    return (
        <Row
            css={css`
                width: 100%;
                height: 100%;
                justify-content: center;
                background: rgba(255, 255, 255, 0.03);
                min-width: ${minWidth || '0px'};
                font-weight: 700;

                .ant-col {
                    padding: 1rem;
                }
            `}
        >
            {headers.map((header: any, index: number) => (
                <Col
                    xs={header.col}
                    style={{
                        ...TABLE_HEADER_COL,
                        textAlign: header?.align ? header.align : index === 0 ? 'start' : 'center',
                    }}
                    key={header.label}
                >
                    {header.label}
                </Col>
            ))}
        </Row>
    );
};

const TableRow = ({ data, key }: { data: Record<string, any>[]; key: string | number }) => {
    return (
        <Row
            key={key}
            css={css`
                font-size: 14px;
                color: rgba(241, 241, 242, 1);
                padding: 1rem 0;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.05);
                .ant-col {
                    padding: 0 1rem;
                }
            `}
        >
            {data?.map((datum: Record<string, any>, i) => (
                <Col
                    span={datum.col}
                    style={{ textAlign: datum?.align ? datum.align : i === 0 ? 'start' : 'center' }}
                    // css={css`
                    //     text-align: centre;
                    //     color: rgba(255, 255, 255, 0.85);
                    // `}
                    key={`${key}-${i}`}
                >
                    {datum.value}
                </Col>
            ))}
        </Row>
    );
};

const UnderlineButton = ({
    children,
    active = false,
    ...props
}: {
    active: boolean;
    children: ReactNode;
    [x: string]: any;
}) => {
    return (
        <button
            type="button"
            css={css`
                text-decoration: none;
                color: ${active ? '#6DC6C1' : 'rgba(255, 255, 255, 0.75)'};
                padding: 0.25rem 1rem;
                margin-bottom: -1px;
                text-transform: uppercase;
                transition: all 1s ease-out 0s;
                letter-spacing: 0.2em;
                border-bottom: ${active ? '1px solid #6DC6C1' : '1px solid rgba(255, 255, 255, 0.75)'};
                background-color: transparent;
                border-top: none;
                border-left: none;
                border-right: none;
                border-image: none;
                cursor: pointer;
            `}
            {...props}
        >
            {children}
        </button>
    );
};

const Profile = () => {
    const [tableView, setTableView] = useState(DEFAULT_TABLE_VIEW);
    const [checkedOO, setCheckedOO] = useState<any>([]);
    const [selectedOOMarket, setSelectedOOMarket] = useState<any>();
    const [selectedTradeMarket, setSelectedTradeMarket] = useState<any>('ALL');
    const [checkedOOA, setCheckedOOA] = useState<any>([]);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('Title');
    const [alertDescription, setAlertDescription] = useState([
        { value: 'test 1', icon: 'error' },
        { value: 'test 2', icon: 'info' },
        { value: 'test 3', icon: 'success' },
        { value: 'test 4', icon: 'loading' },
    ]);
    const [alertType, setAlertType] = useState<'info' | 'error' | 'success' | 'warning'>('warning');
    const wallet = useWallet();
    const { marketName, marketAddress } = useMarket();
    const { publicKey } = wallet;
    const { connection } = useConnection();
    const reactQueryClient = useQueryClient();
    const [accounts] = useTokenAccounts(connection);

    const tokenAccounts = useQuery(
        ['walletTokenAccounts', publicKey?.toBase58()],
        async () => {
            const programAccounts = await connection.getParsedProgramAccounts(
                new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                {
                    filters: [
                        {
                            dataSize: 165, // number of bytes
                        },
                        {
                            memcmp: {
                                offset: 32, // number of bytes
                                bytes: publicKey?.toBase58()!, // base58 encoded string
                            },
                        },
                    ],
                },
            );

            return programAccounts;
        },
        { enabled: !!publicKey && !!connection, refetchOnWindowFocus: false },
    );

    const walletSOL = useQuery(
        ['walletSOL', publicKey?.toBase58()],
        async () => await connection.getAccountInfo(publicKey!),
        {
            enabled: !!publicKey && !!connection,
        },
    );

    const tokenStats = useQuery('tokenStats', gqlTokenStats, {
        enabled: !!publicKey && !!connection,
    });

    const tokenAmounts = useMemo(() => {
        const mappedTokens =
            tokenAccounts?.data
                ?.map((acc) => {
                    const accData = acc.account.data as any;
                    const { info } = accData['parsed'];
                    const { mint, tokenAmount } = info;
                    const { uiAmount } = tokenAmount;
                    const token = tokenStats?.data?.data?.data?.api_serum_dex_m?.tokenStats?.find(
                        (t: any) => t?.tokenMint === mint,
                    );
                    if (uiAmount > 0 && token) {
                        return {
                            token,
                            totalVal: uiAmount * token.price,
                            uiAmount,
                        };
                    }
                })
                ?.filter((acc: any) => !!acc) || [];
        if (walletSOL?.data?.lamports && walletSOL?.data?.lamports > 0) {
            const token = tokenStats?.data?.data?.data?.api_serum_dex_m?.tokenStats?.find(
                (t: any) => t?.tokenMint === SOL_MINT,
            );
            if (token) {
                mappedTokens.push({
                    token,
                    totalVal: walletSOL.data.lamports * SOL_PER_LAMPORT * token?.price,
                    uiAmount: walletSOL.data.lamports * SOL_PER_LAMPORT,
                });
            }
        }
        const sorted = mappedTokens?.sort((t1, t2) => t2!.totalVal - t1!.totalVal);

        if (sorted.length <= 5) {
            return sorted;
        } else {
            let condensed: any[] = [];
            let otherTotal = 0;
            sorted.forEach((s, i) => {
                if (i < 4) {
                    condensed = [...condensed, s];
                } else {
                    otherTotal += s?.totalVal || 0;
                }
            });

            return [...condensed, { token: { tokenName: 'other' }, totalVal: otherTotal }];
        }
    }, [tokenAccounts?.data, tokenStats?.data, walletSOL?.data]);

    const totalAssetAmount = useMemo(() => {
        return tokenAmounts?.reduce((a, b) => a + (b?.totalVal || 0), 0);
    }, [tokenAmounts]);

    const allOOA = useQuery(
        ['allOpenOrdersAcc', publicKey?.toBase58()],
        async () => {
            const raw = (await OpenOrders.findForOwner(connection, publicKey!, PROGRAM_ADDRESS)) || [];
            const formatted =
                raw?.map((openOrder) => ({
                    raw: openOrder,
                    address: openOrder?.address?.toBase58(),
                    market: openOrder?.market?.toBase58(),
                    owner: openOrder?.owner?.toBase58(),
                    baseTokenFree: openOrder?.baseTokenFree?.toNumber(),
                    baseTokenTotal: openOrder?.baseTokenTotal?.toNumber(),
                    quoteTokenFree: openOrder?.quoteTokenFree?.toNumber(),
                    quoteTokenTotal: openOrder?.quoteTokenTotal?.toNumber(),
                })) || [];
            return {
                raw,
                formatted,
            };
        },
        { enabled: !!publicKey && !!connection, refetchOnWindowFocus: false },
    );

    const marketStatsData = useQuery('market_stats', gqlMarketStats, {
        refetchOnWindowFocus: false,
    });
    const marketsQueries = useMemo(() => {
        return (
            allOOA?.data?.formatted?.map((ooa) => ({
                queryKey: ['market', ooa?.market],
                queryFn: async () => {
                    const marketData = await Market.load(
                        connection,
                        new PublicKey(ooa.market),
                        undefined,
                        PROGRAM_ADDRESS,
                    );

                    return {
                        marketData,
                        marketAddress: ooa.market,
                    };
                },
                refetchOnWindowFocus: false,
            })) || []
        );
    }, [allOOA?.data?.formatted, connection]);
    const marketsData = useQueries(marketsQueries);

    const marketOpenOrders = useQuery(
        ['ooByMarket', selectedOOMarket],
        async () => {
            const market = marketsData?.find((m) => m?.data?.marketAddress === selectedOOMarket);
            const openOrdersData =
                (await market?.data?.marketData?.loadOrdersForOwner(connection, publicKey!, 30000)) || [];

            return {
                openOrdersData,
                marketAddress: market?.data?.marketAddress,
                marketName: marketStatsData?.data?.data?.data?.api_serum_dex_m?.marketStats?.find(
                    (marketStat: any) => marketStat.marketAddress === market?.data?.marketAddress,
                )?.marketName,
                baseMint: market?.data?.marketData?.baseMintAddress?.toBase58(),
            };
        },
        {
            refetchOnWindowFocus: false,
            enabled: !!selectedOOMarket,
        },
    );

    const mappedOOA = useMemo(() => {
        const updatedOOA = allOOA?.data?.formatted
            ?.map((ooa) => {
                const mData = marketStatsData?.data?.data?.data?.api_serum_dex_m?.marketStats?.find(
                    (market: any) => market.marketAddress === ooa.market,
                );
                return { ...ooa, baseMint: mData?.baseMint, marketName: mData?.marketName || ooa.market };
            })
            ?.sort((a, b) => a?.marketName?.normalize()?.localeCompare(b?.marketName?.normalize()));
        return updatedOOA || [];
    }, [allOOA?.data?.formatted, marketStatsData?.data]);

    const unsettledBalances = useMemo(() => {
        let unsettled: Record<string, any>[] = [];
        mappedOOA?.forEach((ooa) => {
            if (ooa?.baseTokenFree > 0 || ooa?.quoteTokenFree > 0) {
                const market = marketsData?.find((m) => m?.data?.marketAddress === ooa?.market)?.data?.marketData;

                if (market) {
                    if (ooa?.baseTokenFree > 0) {
                        const marketPairPrice = marketStatsData?.data?.data?.data?.api_serum_dex_m?.marketStats?.find(
                            (m: any) => m.marketAddress === ooa?.market,
                        );
                        const amount = market.baseSplSizeToNumber(ooa.raw.baseTokenFree);
                        const price = marketPairPrice.price;
                        unsettled = [
                            ...unsettled,
                            {
                                ooa,
                                amount,
                                price,
                                total: amount * price,
                            },
                        ];
                    }

                    if (ooa?.quoteTokenFree > 0) {
                        const quoteUSDCMarket = tokenStats.data?.data?.data?.api_serum_dex_m?.tokenStats.find(
                            (t: any) => t.tokenMint === market?.quoteMintAddress.toBase58(),
                        );
                        const amount = market.quoteSplSizeToNumber(ooa.raw.quoteTokenFree);
                        const price = quoteUSDCMarket?.price;
                        unsettled = [
                            ...unsettled,
                            {
                                ooa,
                                amount,
                                price,
                                total: amount * price,
                            },
                        ];
                    }
                }
            }
        });

        return unsettled?.sort((t1, t2) => t2!.total - t1!.total);
    }, [
        mappedOOA,
        marketsData,
        marketStatsData?.data?.data?.data?.api_serum_dex_m?.marketStats,
        tokenStats.data?.data?.data?.api_serum_dex_m?.tokenStats,
    ]);

    const totalUnsettled = useMemo(() => {
        return unsettledBalances?.reduce((a, b) => a + (b?.total || 0), 0);
    }, [unsettledBalances]);

    useEffect(() => {
        if (mappedOOA && mappedOOA?.length > 0) {
            if (!selectedOOMarket) {
                setSelectedOOMarket(mappedOOA[0].market);
            }
        }
    }, [mappedOOA, selectedOOMarket]);

    const loadMarketFills = useMemo(() => {
        return (
            mappedOOA?.map((ooa) => ({
                queryKey: ['fillsByOOA', ooa?.address],
                queryFn: async () => {
                    const fillsData = await gqlMarketTradesByOOA(ooa?.address);

                    return {
                        fills: fillsData?.data?.data?.api_serum_dex_m?.marketTradesByOOA,
                        ...ooa,
                    };
                },
                keepPreviousData: true,
                refetchOnWindowFocus: false,
            })) || []
        );
    }, [mappedOOA]);
    const marketFillsData = useQueries(loadMarketFills);
    const allMarketFills = useMemo(
        () =>
            marketFillsData
                ?.reduce((acc: any, b) => {
                    const fills =
                        b.data && b.data?.fills?.length > 0
                            ? b.data.fills.map((x: any) => ({
                                  ...x,
                                  marketName: b.data.marketName,
                                  marketAddress: b.data.market,
                                  baseMint: b.data.baseMint,
                              }))
                            : [];
                    return [...acc, ...fills];
                }, [])
                ?.sort((a: any, b: any) => b?.time - a?.time)
                ?.filter((trade: any) => selectedTradeMarket === 'ALL' || trade?.marketAddress === selectedTradeMarket),
        [marketFillsData, selectedTradeMarket],
    );

    const onToggleOpenOrders = useCallback(
        (e: any) => {
            if (e.target.value === 'all') {
                const all = marketOpenOrders?.data?.openOrdersData?.map((x: any) => ({
                    openOrder: x,
                    marketAddress: marketOpenOrders?.data?.marketAddress,
                }));
                setCheckedOO((prev: any) =>
                    prev.length === marketOpenOrders?.data?.openOrdersData?.length ? [] : all,
                );
            } else {
                setCheckedOO((prev: any) =>
                    e.target.checked
                        ? [...prev, e.target.value]
                        : prev.filter((c: any) => c.openOrder.orderId !== e.target.value.openOrder.orderId),
                );
            }
        },
        [marketOpenOrders?.data?.marketAddress, marketOpenOrders?.data?.openOrdersData],
    );

    const onToggleOpenOrderAccounts = useCallback(
        (e: any) => {
            if (e.target.value === 'all') {
                setCheckedOOA((prev: any) => (prev.length === mappedOOA?.length ? [] : mappedOOA));
            } else {
                setCheckedOOA((prev: any) =>
                    e.target.checked
                        ? [...prev, e.target.value]
                        : prev.filter((c: any) => c.address !== e.target.value.address),
                );
            }
        },
        [mappedOOA],
    );

    const onCancelOO = useMutation(
        async () => {
            const orders = checkedOO?.map((oo: any) => oo.openOrder);
            const market = marketsData.find((m) => m.data?.marketAddress === checkedOO[0]?.marketAddress)?.data
                ?.marketData;
            if (market && wallet) {
                return await cancelOrders({
                    orders,
                    market,
                    connection,
                    wallet,
                    setAlertTitle,
                    setAlertDescription,
                    setAlertVisible,
                    setAlertType,
                    currentMarketDetails: {
                        name: marketName,
                        addr: marketAddress,
                    },
                });
            }
        },
        {
            mutationKey: 'cancelOpenOrders',
            onSuccess: (d, v) => {
                setCheckedOO([]);
                setTimeout(() => {
                    reactQueryClient.invalidateQueries(['ooByMarket', v]);
                    allOOA.refetch();
                }, 1500);
            },
        },
    );

    const onCloseOOA = useMutation(
        async () => {
            const rawOOAs = checkedOOA.map((ooa: any) => ooa?.raw);

            return await closeAccount(
                rawOOAs,
                connection,
                wallet,
                setAlertTitle,
                setAlertDescription,
                setAlertVisible,
                setAlertType,
                {
                    name: marketName,
                    addr: marketAddress,
                },
            );
        },
        {
            mutationKey: 'closeOpenOrderAccounts',
            onSuccess: () => {
                setCheckedOOA([]);
                setTimeout(() => {
                    allOOA.refetch();
                }, 1500);
            },
        },
    );

    const onSettleAllFunds = useMutation(
        async () => {
            return await settleAllFunds({
                connection,
                tokenAccounts: accounts!,
                wallet,
                markets: marketsData.map((m) => m.data?.marketData!),
                selectedOpenOrdersAccounts: allOOA?.data?.raw,
                setAlertTitle,
                setAlertDescription,
                setAlertVisible,
                setAlertType,
                currentMarketDetails: {
                    name: marketName,
                    addr: marketAddress,
                },
            });
        },
        {
            mutationKey: 'settledAllFunds',
            onSuccess: (d) => {
                setTimeout(() => {
                    allOOA.refetch();
                }, 1500);
            },
        },
    );

    if (!publicKey) {
        return (
            <div
                css={css`
                    padding: 2rem;
                `}
            >
                <h2>Hello, connect your Solana wallet to view profile</h2>
            </div>
        );
    }

    return (
        <div>
            <div
                css={css`
                    margin-top: 1rem;
                    display: flex;
                    /* flex-wrap: wrap; */
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 0.5rem 2rem;
                    flex-direction: column;
                    align-items: flex-start;
                    @media (min-width: 769px) {
                        align-items: center;
                        flex-direction: row;
                    }
                `}
            >
                <h2
                    css={css`
                        padding-right: 2rem;
                        margin-bottom: 0;
                        font-size: 1rem;

                        @media (min-width: 769px) {
                            border-right: 1px solid rgba(255, 255, 255, 0.2);
                            font-size: 1.5rem;
                        }
                    `}
                >
                    Hello,{' '}
                    <span
                        css={css`
                            color: #6dc6c1;
                        `}
                    >
                        {publicKey?.toBase58()?.slice(0, 5)}...{publicKey?.toBase58()?.slice(-5)}
                    </span>
                </h2>
                <div
                    css={css`
                        padding: 0.5rem 0;
                        @media (min-width: 769px) {
                            padding: 0 1rem;
                            border-right: 1px solid rgba(255, 255, 255, 0.2);
                        }
                        .small-muted {
                            font-size: 0.75rem;
                            opacity: 0.5;
                        }
                    `}
                >
                    <div className="small-muted">Total Asset Value</div>
                    <div>${totalAssetAmount.toFixed(2)}</div>
                </div>
                <div
                    css={css`
                        padding: 0.5rem 0;
                        @media (min-width: 769px) {
                            padding: 0 1rem;
                            border-right: 1px solid rgba(255, 255, 255, 0.2);
                        }
                        .small-muted {
                            font-size: 0.75rem;
                            opacity: 0.5;
                        }
                    `}
                >
                    <div className="small-muted">Total Unsettled</div>
                    <div>${totalUnsettled.toFixed(2)}</div>
                </div>
            </div>
            <div
                css={css`
                    padding: 2rem;
                `}
            >
                <div
                    css={css`
                        margin-bottom: 1rem;
                    `}
                >
                    YOUR ASSETS
                </div>
                <div
                    css={css`
                        margin-bottom: 70px;
                    `}
                >
                    <TableHeader
                        headers={[
                            { label: 'Asset', col: 4, align: 'center' },
                            { label: 'Holdings', col: 4 },
                            { label: 'Price', col: 4 },
                            {
                                label: (
                                    <span>
                                        Total{' '}
                                        <span
                                            css={css`
                                                display: none;
                                                @media (min-width: 769px) {
                                                    display: inline-block;
                                                }
                                            `}
                                        >
                                            Value
                                        </span>
                                    </span>
                                ),
                                col: 5,
                            },
                            { label: 'Allocation', col: 7 },
                        ]}
                    />
                    <div
                        css={css`
                            height: 280px;
                            overflow-y: scroll;
                        `}
                    >
                        {(tokenAccounts.isLoading || walletSOL.isLoading) && (
                            <Fragment>
                                <Skeleton active title={false} />
                                <Skeleton active title={false} />
                            </Fragment>
                        )}
                        {!tokenAccounts.isLoading && !walletSOL.isLoading && tokenAmounts?.length === 0 && (
                            <Empty
                                description={`No token accounts for this wallet`}
                                css={css`
                                    height: 100%;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    margin: 0;
                                `}
                            />
                        )}
                        {tokenAmounts?.map((t, i) => {
                            if (!!t) {
                                const { uiAmount = '', totalVal, token } = t;
                                const percent = ((totalVal / totalAssetAmount) * 100).toFixed(2);

                                if (token.tokenName === 'other') {
                                    return (
                                        <TableRow
                                            key={i}
                                            data={[
                                                {
                                                    value: (
                                                        <div
                                                            css={css`
                                                                display: flex;
                                                                align-items: center;
                                                                span {
                                                                    margin-left: 0.5rem;
                                                                }
                                                            `}
                                                        >
                                                            <FaWallet />
                                                            <span>Other</span>
                                                        </div>
                                                    ),
                                                    col: 4,
                                                },
                                                { value: '-', col: 4 },
                                                { value: '-', col: 4 },
                                                { value: '$' + totalVal.toFixed(2), col: 5 },
                                                {
                                                    value: (
                                                        <div>
                                                            <Progress
                                                                strokeWidth={16}
                                                                percent={Number(percent)}
                                                                strokeColor={BALANCE_COLORS[i % 10]}
                                                                trailColor="rgba(255, 255, 255, 0.1)"
                                                                css={css`
                                                                    width: 80%;

                                                                    .ant-progress-outer {
                                                                        display: none;
                                                                        @media (min-width: 769px) {
                                                                            display: inline-block;
                                                                        }
                                                                    }
                                                                    .ant-progress-text {
                                                                        color: ${BALANCE_COLORS[i % 10]};
                                                                    }
                                                                `}
                                                            />
                                                        </div>
                                                    ),
                                                    col: 7,
                                                    align: 'start',
                                                },
                                            ]}
                                        />
                                    );
                                }

                                return (
                                    <TableRow
                                        key={i}
                                        data={[
                                            {
                                                value: (
                                                    <div>
                                                        <span
                                                            css={css`
                                                                display: none;
                                                                @media (min-width: 769px) {
                                                                    display: inline-block;
                                                                }
                                                            `}
                                                        >
                                                            <TokenIcon
                                                                mint={token.tokenMint}
                                                                css={css`
                                                                    width: 1rem;
                                                                    height: 1rem;
                                                                    margin-right: 0.5rem;
                                                                `}
                                                            />
                                                        </span>
                                                        {token.tokenName}
                                                    </div>
                                                ),
                                                col: 4,
                                            },
                                            { value: uiAmount.toFixed(2), col: 4 },
                                            { value: '$' + token.price.toFixed(2), col: 4 },
                                            { value: '$' + totalVal.toFixed(2), col: 5 },
                                            {
                                                value: (
                                                    <div
                                                        css={css`
                                                            display: flex;
                                                            justify-content: space-between;
                                                        `}
                                                    >
                                                        <Progress
                                                            strokeWidth={16}
                                                            percent={Number(percent)}
                                                            strokeColor={BALANCE_COLORS[i % 10]}
                                                            trailColor="rgba(255, 255, 255, 0.1)"
                                                            css={css`
                                                                width: 80%;
                                                                .ant-progress-outer {
                                                                    display: none;
                                                                    @media (min-width: 769px) {
                                                                        display: inline-block;
                                                                    }
                                                                }
                                                                .ant-progress-text {
                                                                    color: ${BALANCE_COLORS[i % 10]};
                                                                }
                                                            `}
                                                        />
                                                        <a
                                                            href={`https://projectserum.vybenetwork.com/#/tokens/${token.tokenMint}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            css={css`
                                                                display: none;
                                                                @media (min-width: 769px) {
                                                                    display: inline-block;
                                                                }
                                                            `}
                                                        >
                                                            <img
                                                                src={vybelogo}
                                                                alt="vybe"
                                                                css={css`
                                                                    width: 1rem;
                                                                    height: 1rem;
                                                                `}
                                                            />
                                                        </a>
                                                    </div>
                                                ),
                                                col: 7,
                                            },
                                        ]}
                                    />
                                );
                            }
                        })}
                    </div>
                </div>
                <div
                    css={css`
                        margin-bottom: 1rem;
                        @media (min-width: 769px) {
                            display: none;
                            margin-bottom: 0;
                        }
                    `}
                >
                    <div
                        css={css`
                            display: flex;
                        `}
                    >
                        <ButtonDropdown
                            values={TABLE_VIEWS}
                            selected={tableView}
                            setSelected={setTableView}
                            display="block"
                        />
                        <div
                            css={css`
                                width: ${tableView === 'unsettled' ? 'auto' : '100%'};
                            `}
                        >
                            {mappedOOA?.length > 0 && selectedOOMarket && tableView === 'openorders' && (
                                <ButtonDropdown
                                    values={mappedOOA.map((ooa) => ({ label: ooa.marketName, value: ooa.market }))}
                                    selected={selectedOOMarket}
                                    setSelected={(m: string) => {
                                        setCheckedOO([]);
                                        setSelectedOOMarket(m);
                                    }}
                                    display="block"
                                />
                            )}

                            {mappedOOA?.length > 0 && tableView === 'tradehistory' && (
                                <ButtonDropdown
                                    values={[
                                        { label: 'ALL', value: 'ALL' },
                                        ...mappedOOA.map((ooa) => ({ label: ooa.marketName, value: ooa.market })),
                                    ]}
                                    selected={selectedTradeMarket}
                                    setSelected={(m: string) => {
                                        setSelectedTradeMarket(m);
                                    }}
                                    display="block"
                                />
                            )}
                        </div>
                    </div>
                    {tableView === 'unsettled' && !allOOA.isLoading && unsettledBalances?.length > 0 && (
                        <div
                            css={css`
                                .ant-btn.ant-btn-default {
                                    width: 100%;
                                    margin-top: 0.5rem;
                                }
                            `}
                        >
                            <Button type="default" onClick={() => onSettleAllFunds.mutate()}>
                                SETTLE ALL
                            </Button>
                        </div>
                    )}
                    {tableView === 'openorders' && (
                        <div
                            css={css`
                                .ant-btn.ant-btn-default {
                                    width: 100%;
                                    margin-top: 0.5rem;
                                }
                            `}
                        >
                            <Button
                                ghost
                                danger
                                type="default"
                                onClick={() => {
                                    return onCancelOO.mutate(selectedOOMarket);
                                }}
                                disabled={onCancelOO.isLoading || checkedOO?.length === 0}
                            >
                                CANCEL ({checkedOO?.length})
                            </Button>
                        </div>
                    )}
                </div>
                <div
                    css={css`
                        display: none;
                        @media (min-width: 769px) {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            flex-wrap: wrap;
                        }
                    `}
                >
                    <div
                        css={css`
                            margin-bottom: 1rem;
                        `}
                    >
                        <UnderlineButton active={tableView === 'openorders'} onClick={() => setTableView('openorders')}>
                            open orders
                        </UnderlineButton>
                        <UnderlineButton active={tableView === 'unsettled'} onClick={() => setTableView('unsettled')}>
                            unsettled Balances
                        </UnderlineButton>
                        <UnderlineButton
                            active={tableView === 'tradehistory'}
                            onClick={() => setTableView('tradehistory')}
                        >
                            trade history
                        </UnderlineButton>
                    </div>

                    <div
                        css={css`
                            display: flex;
                            margin-bottom: 1rem;
                            margin-left: auto;
                            .button_dropdown__inner_wrapper a {
                                padding: 0 0.5rem;
                            }
                        `}
                    >
                        {mappedOOA?.length > 0 && selectedOOMarket && tableView === 'openorders' && (
                            <ButtonDropdown
                                values={mappedOOA.map((ooa) => ({ label: ooa.marketName, value: ooa.market }))}
                                selected={selectedOOMarket}
                                setSelected={(m: string) => {
                                    setCheckedOO([]);
                                    setSelectedOOMarket(m);
                                }}
                            />
                        )}
                        {mappedOOA?.length > 0 && tableView === 'tradehistory' && (
                            <ButtonDropdown
                                values={[
                                    { label: 'ALL', value: 'ALL' },
                                    ...mappedOOA.map((ooa) => ({ label: ooa.marketName, value: ooa.market })),
                                ]}
                                selected={selectedTradeMarket}
                                setSelected={(m: string) => {
                                    setSelectedTradeMarket(m);
                                }}
                            />
                        )}

                        {tableView === 'unsettled' && !allOOA.isLoading && unsettledBalances?.length > 0 && (
                            <Button type="default" onClick={() => onSettleAllFunds.mutate()}>
                                SETTLE ALL
                            </Button>
                        )}
                        {tableView === 'openorders' && (
                            <div
                                css={css`
                                    margin-left: 1rem;
                                `}
                            >
                                <Button
                                    ghost
                                    danger
                                    type="default"
                                    onClick={() => {
                                        return onCancelOO.mutate(selectedOOMarket);
                                    }}
                                    disabled={onCancelOO.isLoading || checkedOO?.length === 0}
                                >
                                    CANCEL ({checkedOO?.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    css={css`
                        margin-bottom: 70px;
                    `}
                >
                    <Fragment>
                        {tableView === 'openorders' && (
                            <div>
                                <TableHeader
                                    headers={[
                                        {
                                            label: (
                                                <Fragment>
                                                    {!marketOpenOrders.isIdle &&
                                                        !marketOpenOrders.isLoading &&
                                                        marketOpenOrders?.data?.openOrdersData?.length !== 0 && (
                                                            <Checkbox
                                                                onChange={onToggleOpenOrders}
                                                                checked={
                                                                    checkedOO.length ===
                                                                    marketOpenOrders?.data?.openOrdersData?.length
                                                                }
                                                                value={'all'}
                                                                disabled={
                                                                    marketOpenOrders?.data?.openOrdersData?.length ===
                                                                        0 || onCancelOO.isLoading
                                                                }
                                                                css={css`
                                                                    margin-right: 1rem;
                                                                `}
                                                            />
                                                        )}
                                                    Market
                                                </Fragment>
                                            ),
                                            col: 7,
                                        },
                                        { label: 'Side', col: 4 },
                                        { label: 'Size', col: 4 },
                                        { label: 'Price', col: 4 },
                                        { label: 'Value', col: 5 },
                                    ]}
                                />
                                <div
                                    css={css`
                                        height: 350px;
                                        overflow-y: scroll;
                                    `}
                                >
                                    {(allOOA.isLoading || marketOpenOrders.isLoading) && (
                                        <Fragment>
                                            <Skeleton active title={false} />
                                            <Skeleton active title={false} />
                                        </Fragment>
                                    )}
                                    {!allOOA.isLoading &&
                                        !marketOpenOrders.isLoading &&
                                        (!marketOpenOrders?.data ||
                                            marketOpenOrders?.data?.openOrdersData?.length === 0) && (
                                            <Empty
                                                description={`No open orders${
                                                    selectedOOMarket ? ' for selected market' : ''
                                                }`}
                                                css={css`
                                                    height: 100%;
                                                    display: flex;
                                                    flex-direction: column;
                                                    align-items: center;
                                                    justify-content: center;
                                                    margin: 0;
                                                `}
                                            />
                                        )}

                                    {marketOpenOrders?.data?.openOrdersData?.map((openOrder, i: number) => {
                                        const { side, size, price }: { side: string; size: any; price: any } =
                                            openOrder;
                                        return (
                                            <TableRow
                                                key={i}
                                                data={[
                                                    {
                                                        value: (
                                                            <Fragment>
                                                                <Checkbox
                                                                    onChange={onToggleOpenOrders}
                                                                    checked={checkedOO.some(
                                                                        (oo: any) =>
                                                                            oo?.openOrder.orderId === openOrder.orderId,
                                                                    )}
                                                                    value={{
                                                                        openOrder,
                                                                        marketAddress:
                                                                            marketOpenOrders?.data?.marketAddress,
                                                                    }}
                                                                    disabled={onCancelOO.isLoading}
                                                                    css={css`
                                                                        margin-right: 1rem;
                                                                    `}
                                                                />
                                                                <TokenIcon
                                                                    mint={marketOpenOrders?.data?.baseMint || ''}
                                                                    css={css`
                                                                        width: 1rem;
                                                                        height: 1rem;
                                                                        margin-right: 0.25rem;
                                                                    `}
                                                                />
                                                                {marketOpenOrders?.data?.marketName}
                                                            </Fragment>
                                                        ),
                                                        col: 7,
                                                    },
                                                    {
                                                        value: (
                                                            <span
                                                                css={css`
                                                                    text-transform: uppercase;
                                                                    color: ${side === 'buy' ? '#45C493' : '#FF5C5C'};
                                                                `}
                                                            >
                                                                {side}
                                                            </span>
                                                        ),
                                                        col: 4,
                                                    },
                                                    { value: size, col: 4 },
                                                    { value: price, col: 4 },
                                                    { value: (Number(price) * Number(size)).toFixed(2), col: 5 },
                                                ]}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {tableView === 'unsettled' && (
                            <div>
                                <TableHeader
                                    headers={[
                                        { label: 'Market', col: 6 },
                                        { label: 'Unsettled Amount', col: 6 },
                                        { label: 'Price', col: 6 },
                                        { label: 'Value', col: 6 },
                                    ]}
                                />
                                <div
                                    css={css`
                                        height: 350px;
                                        overflow-y: scroll;
                                    `}
                                >
                                    {allOOA.isLoading && (
                                        <Fragment>
                                            <Skeleton active title={false} />
                                            <Skeleton active title={false} />
                                        </Fragment>
                                    )}
                                    {!allOOA.isLoading && unsettledBalances?.length === 0 && (
                                        <Empty
                                            description={`No unsettled balances`}
                                            css={css`
                                                height: 100%;
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                justify-content: center;
                                                margin: 0;
                                            `}
                                        />
                                    )}

                                    {unsettledBalances?.map((balance, i) => {
                                        return (
                                            <TableRow
                                                key={i}
                                                data={[
                                                    {
                                                        value: (
                                                            <Fragment>
                                                                <TokenIcon
                                                                    mint={balance?.ooa?.baseMint || ''}
                                                                    css={css`
                                                                        width: 1rem;
                                                                        height: 1rem;
                                                                        margin-right: 0.25rem;
                                                                    `}
                                                                />
                                                                {balance.ooa.marketName}
                                                            </Fragment>
                                                        ),
                                                        col: 6,
                                                    },
                                                    {
                                                        value: balance.amount,
                                                        col: 6,
                                                    },
                                                    { value: '$' + balance.price.toFixed(2), col: 6 },
                                                    {
                                                        value: '$' + balance.total.toFixed(2),
                                                        col: 6,
                                                    },
                                                ]}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {tableView === 'tradehistory' && (
                            <div
                                css={css`
                                    overflow-x: scroll;
                                `}
                            >
                                <TableHeader
                                    headers={[
                                        { label: 'Market', col: 3 },
                                        { label: 'Side', col: 3 },
                                        { label: 'Size', col: 3 },
                                        { label: 'Price', col: 3 },
                                        { label: 'Value', col: 3 },
                                        { label: 'Liquidity', col: 3 },
                                        { label: 'Fee', col: 3 },
                                        { label: 'Time', col: 3 },
                                    ]}
                                    minWidth="750px"
                                />
                                <div
                                    css={css`
                                        height: 350px;
                                        overflow-y: scroll;
                                        min-width: 750px;
                                    `}
                                >
                                    {marketFillsData?.some((m) => m?.isLoading) && (
                                        <Fragment>
                                            <Skeleton active title={false} />
                                            <Skeleton active title={false} />
                                        </Fragment>
                                    )}
                                    {!marketFillsData?.some((m) => m?.isLoading) && allMarketFills?.length === 0 && (
                                        <Empty
                                            description={`No trades`}
                                            css={css`
                                                height: 100%;
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                justify-content: center;
                                                margin: 0;
                                                background: rgba(255, 255, 255, 0.05);
                                            `}
                                        />
                                    )}
                                    {allMarketFills?.map((market: any, i: number) => {
                                        return (
                                            <TableRow
                                                key={i}
                                                data={[
                                                    {
                                                        value: (
                                                            <Fragment>
                                                                <TokenIcon
                                                                    mint={market?.baseMint || ''}
                                                                    css={css`
                                                                        width: 1rem;
                                                                        height: 1rem;
                                                                        margin-right: 0.25rem;
                                                                    `}
                                                                />{' '}
                                                                {market?.marketName}
                                                            </Fragment>
                                                        ),
                                                        col: 3,
                                                    },
                                                    {
                                                        value: (
                                                            <span
                                                                css={css`
                                                                    text-transform: uppercase;
                                                                    color: ${market?.side === 'buy'
                                                                        ? '#45C493'
                                                                        : '#FF5C5C'};
                                                                `}
                                                            >
                                                                {market?.side}
                                                            </span>
                                                        ),
                                                        col: 3,
                                                    },
                                                    { value: market?.size, col: 3 },
                                                    { value: (market?.price).toFixed(3), col: 3 },
                                                    { value: (market?.size * market?.price).toFixed(4), col: 3 },
                                                    { value: market?.type?.toUpperCase(), col: 3 },
                                                    { value: market?.feeCost, col: 3 },
                                                    { value: new Date(market?.time)?.toLocaleDateString(), col: 3 },
                                                ]}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Fragment>
                </div>
                <div
                    css={css`
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 1rem;
                    `}
                >
                    <UnderlineButton active={true} onClick={() => {}}>
                        OPEN ORDER ACCOUNTS ({mappedOOA?.length ?? 0})
                    </UnderlineButton>
                    <Button
                        ghost
                        danger
                        type="default"
                        onClick={() => {
                            return onCloseOOA.mutate();
                        }}
                        disabled={onCloseOOA.isLoading || checkedOOA.length === 0}
                    >
                        CLOSE ({checkedOOA.length})
                    </Button>
                </div>
                <div>
                    <TableHeader
                        headers={[
                            {
                                label: (
                                    <Fragment>
                                        {mappedOOA && mappedOOA?.length > 0 && (
                                            <Checkbox
                                                css={css`
                                                    margin-right: 1rem;
                                                `}
                                                onChange={onToggleOpenOrderAccounts}
                                                checked={checkedOOA.length === mappedOOA?.length}
                                                value="all"
                                                disabled={onCloseOOA.isLoading}
                                            />
                                        )}
                                        Market
                                    </Fragment>
                                ),
                                col: 13,
                            },
                            {
                                label: `Claimable SOL (${SOL_PER_LAMPORT * OOA_RENT_LAMPORT * mappedOOA?.length})`,
                                col: 11,
                                align: 'end',
                            },
                        ]}
                    />
                    <div
                        css={css`
                            max-height: 420px;
                            height: 100%;
                            overflow-y: scroll;
                        `}
                    >
                        {allOOA.isLoading && (
                            <Fragment>
                                <Skeleton active title={false} />
                                <Skeleton active title={false} />
                            </Fragment>
                        )}
                        {!allOOA.isLoading && mappedOOA?.length === 0 && (
                            <Empty
                                description={`No open order accounts`}
                                css={css`
                                    height: 100%;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    margin: 0;
                                `}
                            />
                        )}
                        {mappedOOA?.map((ooa, i) => {
                            return (
                                <TableRow
                                    key={i}
                                    data={[
                                        {
                                            value: (
                                                <Fragment>
                                                    <Checkbox
                                                        css={css`
                                                            margin-right: 1rem;
                                                        `}
                                                        onChange={onToggleOpenOrderAccounts}
                                                        checked={checkedOOA.some(
                                                            (openOrderAcc: any) =>
                                                                openOrderAcc?.address === ooa.address,
                                                        )}
                                                        value={ooa}
                                                        disabled={onCloseOOA.isLoading}
                                                    />
                                                    <TokenIcon
                                                        mint={ooa?.baseMint || ''}
                                                        css={css`
                                                            width: 1rem;
                                                            height: 1rem;
                                                            margin-right: 0.25rem;
                                                        `}
                                                    />
                                                    {ooa?.marketName}
                                                </Fragment>
                                            ),
                                            col: 13,
                                        },
                                        {
                                            value: <Fragment>{SOL_PER_LAMPORT * OOA_RENT_LAMPORT} SOL</Fragment>,
                                            col: 11,
                                            align: 'end',
                                        },
                                    ]}
                                />
                            );
                        })}
                    </div>
                </div>
                <Alert
                    type={alertType}
                    title={alertTitle}
                    description={alertDescription}
                    visible={alertVisible}
                    setVisible={setAlertVisible}
                />
            </div>
        </div>
    );
};

export default Profile;
