import { useState, useMemo, Fragment, useEffect } from 'react';
import Button from 'components/atoms/Button/Button';
import { Row, Col } from 'components/atoms/Grid/Grid';
import SubHeader from 'components/organisms/SubHeader/SubHeader';
import ButtonGroup from 'components/molecules/ButtonGroup/ButtonGroup';
import { selectedButtonStyle } from 'utils/styles';
import Balances from 'components/organisms/Balances/Balances';
import OpenOrders from 'components/organisms/OpenOrders/OpenOrders';
import FilledOrders from 'components/organisms/FilledOrders/FilledOrders';
import LimitOrder from 'components/organisms/LimitOrder/LimitOrder';
import MarketOrder from 'components/organisms/MarketOrder/MarketOrder';
import Orderbook from 'components/organisms/Orderbook/Orderbook';
import TradeBook from 'components/organisms/TradeBook/Tradebook';
import TradingView from 'components/organisms/TradingView/TradingView';
import { useQuery, useQueries } from 'react-query';
import {
    gqlMarketStatsByAddress,
    gqlMarketTVLByAddress,
    gqlMarketStats,
    gqlTokenStats,
    gqlGlobalTVLStats,
    gqlGlobalVolumeStats,
    gqlGlobalTrades,
    gqlChartData,
} from 'requests/index';
import { PublicKey, Connection } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Alert from 'components/atoms/Alert/Alert';
import ButtonDropdown from 'components/molecules/ButtonDropdown/ButtonDropdown';
import Dropdown from 'components/atoms/Dropdown/Dropdown';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWindowDimensions } from 'utils';
import './Trade.less';
import MobileFooter from 'components/organisms/MobileFooter/MobileFooter';
import { Modal } from 'antd';
import { useGeoLocation, useMarket } from 'utils/context';
import TokenDetails from 'components/organisms/TokenDetails/TokenDetails';
import axios from 'axios';
import Footer from 'components/organisms/Footer/Footer';
import { useLocation, useNavigate } from 'react-router-dom';
import { _MARKETS } from 'utils/markets';
import { useParams } from 'react-router-dom';
import ProhibitedTooltip from 'components/molecules/ProhibitedTooltip/ProhibitedTooltip';
import NewDepthChart from 'components/organisms/NewDepthChart/NewDepthChart';
import Analytics from 'components/organisms/Analytics/Analytics';
import { FaWallet } from 'react-icons/fa';
import MarketDetails from 'components/organisms/MarketDetails/MarketDetails';

export const SAMPLE_HISTORY_HOURS = 6;

const programAddress = {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
};

function Trade() {
    const [orderType, setOrderType] = useState('limit');
    const [marketDetails, setMarketDetails] = useState<'tradingview' | 'marketdepth' | 'analytics' | 'details'>(
        'tradingview',
    );
    const [orderDetails, setOrderDetails] = useState('openorders');
    const [mobileOrderType, setMobileOrderType] = useState<'orderbook' | 'recenttrades'>('orderbook');
    const [footerButtonSelected, setFooterButtonSelected] = useState<'buysell' | 'orders' | 'balances' | 'none'>(
        'none',
    );
    const [detailsType, setDetailsType] = useState<'token' | 'market'>('token');

    const {
        market,
        marketName,
        marketAddress,
        setMarketAddress,
        setMarketName,
        baseCurrency,
        quoteCurrency,
        baseMintAddress,
    } = useMarket();

    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const marketData = useQuery('market_stats', gqlMarketStats, {
        // enabled: !!market,
        staleTime: 30000,
        refetchInterval: 30000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    useEffect(() => {
        if (params.id !== undefined) {
            setMarketAddress('');
            setMarketName('');
            // @ts-ignore
            let obj = _MARKETS.find((market) => String(market.address).includes(params?.id));
            if (obj) {
                setMarketAddress(obj.address.toBase58());
                setMarketName(obj.name);
                return;
            }

            if (marketData.isLoading) {
                return;
            }
            const fetchedMarkets = marketData.data?.data?.data?.api_serum_dex_m?.marketStats;
            if (fetchedMarkets?.length > 0) {
                const foundMarket = fetchedMarkets.find(
                    (m: { marketAddress: string; marketName: string }) => m.marketAddress === params.id,
                );

                if (foundMarket) {
                    setMarketAddress(foundMarket.marketAddress);
                    setMarketName(foundMarket.marketName);
                    return;
                } else {
                    setMarketAddress('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT');
                    setMarketName('SOL/USDC');
                    navigate('/trade');
                }
            } else {
                setMarketAddress('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT');
                setMarketName('SOL/USDC');
                navigate('/trade');
            }
        }
    }, [location, params, setMarketAddress, setMarketName, marketData.data, marketData.isLoading, navigate]);

    const { isRestricted } = useGeoLocation();

    const [selectedBidAsk, setSelctedBidAsk] = useState<'ALL' | 'BIDS' | 'ASKS'>('ALL');
    const [selectedBuySell, setSelctedBuySell] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('Title');
    const [alertDescription, setAlertDescription] = useState([
        { value: 'test 1', icon: 'error' },
        { value: 'test 2', icon: 'info' },
        { value: 'test 3', icon: 'success' },
        { value: 'test 4', icon: 'loading' },
    ]);
    const [alertType, setAlertType] = useState<'info' | 'error' | 'success' | 'warning'>('warning');
    const [avgTPS, setAvgTPS] = useState(0);

    const wallet = useWallet();
    const { publicKey } = useWallet();
    const { connection } = useConnection();

    const marketDataByAddress = useQuery(['market_stats_by_address', marketAddress], async () =>
        gqlMarketStatsByAddress(marketAddress),
    );

    useEffect(() => {
        // This will run when the page first loads and whenever the marketName or marketDataByAddress changes
        document.title = marketDataByAddress?.data?.data?.data?.api_serum_dex_m
            ? '$' +
              marketDataByAddress.data?.data.data.api_serum_dex_m.marketStatsByMarketAddress.price.toFixed(2) +
              ' ' +
              marketName
            : marketName;
    }, [marketName, marketDataByAddress]);

    const tokenData = useQuery('token_stats', gqlTokenStats, {
        enabled: !!market,
        staleTime: 30000,
        refetchInterval: 30000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    const volumeBase1D = useMemo(() => {
        if (marketDataByAddress?.data?.data.data?.api_serum_dex_m?.marketStatsByMarketAddress.v1db) {
            return marketDataByAddress?.data?.data.data?.api_serum_dex_m?.marketStatsByMarketAddress.v1db;
        } else {
            return '-';
        }
    }, [marketDataByAddress]);

    const volumeQuote1D = useMemo(() => {
        if (marketDataByAddress?.data?.data.data?.api_serum_dex_m?.marketStatsByMarketAddress.v1dq) {
            return marketDataByAddress?.data?.data.data?.api_serum_dex_m?.marketStatsByMarketAddress.v1dq;
        } else {
            return '-';
        }
    }, [marketDataByAddress]);

    const tvlData = useQuery('global_tvl_data', gqlGlobalTVLStats, {
        enabled: !!market,
        staleTime: 30000,
        refetchInterval: 300000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    const todaysTVL = useMemo(() => {
        if (tvlData?.data?.data.data?.api_serum_dex_m?.globalTVLStats.tvl) {
            return tvlData?.data?.data.data?.api_serum_dex_m?.globalTVLStats.tvl.slice(-1)[0];
        }
    }, [tvlData]);

    const volumeData = useQuery('global_volume_data', gqlGlobalVolumeStats, {
        enabled: !!market,
        staleTime: 30000,
        refetchInterval: 300000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    const todaysVolume = useMemo(() => {
        if (volumeData?.data?.data.data?.api_serum_dex_m?.globalVolumeStats.v) {
            return volumeData?.data?.data.data?.api_serum_dex_m?.globalVolumeStats.v.slice(-1)[0];
        }
    }, [volumeData]);

    const tradeData = useQuery('global_trade_data', gqlGlobalTrades, {
        enabled: !!market,
        staleTime: 30000,
        refetchInterval: 300000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    const todaysTrades = useMemo(() => {
        return tradeData?.data?.data.data?.api_serum_dex_m?.globalTrades.length
            ? tradeData?.data?.data.data?.api_serum_dex_m?.globalTrades.length
            : 0;
    }, [tradeData]);

    const marketChartData = useQuery(['market_chart_data', marketAddress], async () => gqlChartData(marketAddress), {
        enabled: !!market,
        staleTime: 30000,
        refetchInterval: 300000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    const marketTVLData = useQuery(
        ['market_tvl_data', marketAddress],
        async () => gqlMarketTVLByAddress(marketAddress),
        {
            enabled: !!market,
            staleTime: 30000,
            refetchInterval: 300000,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        },
    );

    const quoteDecimalDigits = market ? market['_quoteSplTokenDecimals'] : 4;

    const bidsData = useQuery(
        ['marketBids', market],
        async () => {
            return await market?.loadBids(connection);
        },
        {
            enabled: !!market && !!connection,
            staleTime: 5000,
            refetchInterval: 5000,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        },
    );

    const asksData = useQuery(['marketAsks', market], async () => await market?.loadAsks(connection), {
        enabled: !!market && !!connection,
        staleTime: 5000,
        refetchInterval: 5000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    });

    const tokenAccountsData = useQuery(
        ['tokenAccounts', publicKey],
        async () => await connection.getParsedTokenAccountsByOwner(publicKey!, programAddress),
        {
            enabled: !!publicKey && !!connection,
            staleTime: 20000,
        },
    );

    const solscanTokenData = useQueries(
        [0, 1, 2, 3, 4, 5, 6].map((offset) => ({
            queryKey: ['tokenInfo', offset],
            queryFn: async () => {
                return await axios.get(
                    `https://public-api.solscan.io/token/list?sortBy=holder&direction=desc&limit=50&offset=${
                        offset * 50
                    }`,
                );
            },
            refetchOnWindowFocus: false,
            staleTime: 250000,
        })),
    );

    const mergedSolscanData = useMemo(() => {
        return solscanTokenData.reduce((acc: any, token: any) => {
            const data = token?.data?.data?.data || [];
            return [...acc, ...data];
        }, []);
    }, [solscanTokenData]);

    const { marketCap, marketCapRank, baseTokenName, holders, circulatingSupply } = useMemo(() => {
        const data = mergedSolscanData?.find((a) => a?.address === baseMintAddress);
        return {
            marketCap: data?.marketCapFD,
            marketCapRank: data?.marketCapRank,
            baseTokenName: data?.tokenName,
            holders: data?.holder,
            circulatingSupply: data?.coingeckoInfo?.marketData?.circulatingSupply,
        };
    }, [mergedSolscanData, baseMintAddress]);

    const { tvl, v1d, v7d } = useMemo(() => {
        const data = tokenData.data?.data?.data?.api_serum_dex_m?.tokenStats?.find(
            (t: { tokenMint: string }) => t?.tokenMint === baseMintAddress,
        );
        return {
            tvl: data?.tvl,
            v1d: data?.v1d,
            v7d: data?.v7d,
        };
    }, [tokenData, baseMintAddress]);

    // Using a different connection than from @solana/wallet-adapter-react library
    useEffect(() => {
        const a = async () => {
            const asdf = new Connection('https://rpcs.vybenetwork.com');
            const b = await asdf.getRecentPerformanceSamples(360);

            // Getting average TPS
            let avgTPS = b
                .filter((sample) => {
                    return sample.numTransactions !== 0;
                })
                .map((sample) => {
                    return sample.numTransactions / sample.samplePeriodSecs;
                });

            setAvgTPS(avgTPS[0]);
        };
        a();
    }, []);

    const {
        bidsNewDepthChartData,
        bidsOrderbookData,
        bidsAmounts,
        asksNewDepthChartData,
        asksOrderbookData,
        asksAmounts,
        uniqueOOAs,
    }: any = useMemo(() => {
        let bidsOrderbook = [];
        let bidsDepthChart = [];
        let bidsAmounts = [];
        let bidsNewDepthChart = [];

        let asksOrderbook = [];
        let asksDepthChart = [];
        let asksAmounts = [];
        let asksNewDepthChart = [];

        if (bidsData?.data && asksData?.data) {
            let bids = bidsData?.data;
            let asks = asksData?.data;

            let bidsAmount = 0;

            // L2 orderbook data
            if (bids.getL2(50)?.length > 0) {
                for (let [price, size] of bids.getL2(50)) {
                    bidsAmount = bidsAmount + size;

                    if (
                        bidsDepthChart.length === 0 ||
                        (bidsDepthChart.length > 0 && price < bidsDepthChart[0][0] * 2)
                    ) {
                        bidsDepthChart.push([price, bidsAmount]);
                        bidsNewDepthChart.push({ x: price, y: bidsAmount });
                    }

                    bidsOrderbook.push({
                        price,
                        size,
                        total: price * size,
                    });

                    bidsAmounts.push(size);
                }
            }

            let summedBidsAmount = bidsAmounts.map(
                (
                    (s) => (a) =>
                        (s += a)
                )(0),
            );

            let asksAmount = 0;
            if (asks.getL2(50)?.length > 0) {
                for (let [price, size] of asks.getL2(50)) {
                    asksAmount = asksAmount + size;

                    if (
                        asksDepthChart.length === 0 ||
                        (asksDepthChart.length > 0 &&
                            price < asksDepthChart[0]?.[0] * 2 - bidsDepthChart[bidsDepthChart.length - 1]?.[0])
                    ) {
                        asksDepthChart.push([price, asksAmount]);
                        asksNewDepthChart.push({ x: price, y: asksAmount });
                    }

                    asksOrderbook.push({
                        price,
                        size,
                        total: price * size,
                    });

                    asksAmounts.push(size);
                }
            }

            let summedAsksAmount = asksAmounts.map(
                (
                    (s) => (a) =>
                        (s += a)
                )(0),
            );

            const askDiff = asksDepthChart[asksDepthChart.length - 1]?.[0] - asksDepthChart[0]?.[0];
            const bid1 = bidsDepthChart[0]?.[0];

            const filteredBids = bidsDepthChart.filter((a) => bid1 - a?.[0] <= askDiff);

            if (asksNewDepthChart[0] && bidsNewDepthChart[0] && asksNewDepthChart[0].x && bidsNewDepthChart[0].x) {
                let difference = asksNewDepthChart[0].x - bidsNewDepthChart[0].x;

                bidsNewDepthChart.unshift({
                    x: bidsNewDepthChart[0].x + difference / 2,
                    y: 0,
                });

                asksNewDepthChart.unshift({
                    x: asksNewDepthChart[0].x - difference / 2,
                    y: 0,
                });
            }

            return {
                bidsDepthChartData: filteredBids || [],
                bidsNewDepthChartData: bidsNewDepthChart || [],
                bidsOrderbookData: bidsOrderbook || [],
                bidsAmounts: summedBidsAmount || [],
                asksDepthChartData: asksDepthChart || [],
                asksNewDepthChartData: asksNewDepthChart || [],
                asksOrderbookData: asksOrderbook || [],
                asksAmounts: summedAsksAmount || [],
            };
        }
        return {
            bidsDepthChartData: [],
            bidsNewDepthChartData: [],
            bidsOrderbookData: [],
            bidsAmounts: [],
            asksDepthChartData: [],
            asksNewDepthChartData: [],
            asksOrderbookData: [],
            asksAmounts: [],
        };
    }, [asksData?.data, bidsData?.data]);

    const marketCount = useMemo(() => {
        if (marketData?.data) {
            return marketData?.data?.data?.data?.api_serum_dex_m?.marketStats?.reduce((acc: any, market: any) => {
                acc[market.baseMint] = (acc[market.baseMint] || 0) + 1;
                return acc;
            }, {});
        }
    }, [marketData?.data]);

    const { width } = useWindowDimensions();

    return (
        <Fragment>
            <SubHeader
                setMarketAddress={setMarketAddress}
                setMarketName={setMarketName}
                marketAddress={marketAddress}
                marketName={marketName}
                price={
                    marketDataByAddress?.data?.data?.data?.api_serum_dex_m
                        ? marketDataByAddress.data?.data.data.api_serum_dex_m.marketStatsByMarketAddress.price.toFixed(
                              quoteDecimalDigits,
                          )
                        : 'Loading...'
                }
                baseVolume={volumeBase1D}
                quoteVolume={volumeQuote1D}
            />
            {width >= 768 ? (
                <Row>
                    <Col style={{ borderRight: '0.25px solid rgba(255, 255, 255, 0.1)', height: '83vh' }} span={13}>
                        <div style={{ height: '60%' }}>
                            <ButtonGroup
                                values={[
                                    { label: 'TRADING VIEW', value: 'tradingview' },
                                    { label: 'MARKET DEPTH', value: 'marketdepth' },
                                    { label: 'DETAILS', value: 'details' },
                                    { label: 'ANALYTICS', value: 'analytics' },
                                ]}
                                className="trade__button_group--tradingview"
                                selected={marketDetails}
                                setSelected={setMarketDetails}
                            />
                            {marketDetails === 'analytics' && (
                                <Analytics
                                    marketChartData={marketChartData}
                                    tvlChartData={marketTVLData}
                                    bidsData={bidsData?.data}
                                    asksData={asksData?.data}
                                    baseCurrency={baseCurrency}
                                    quoteCurrency={quoteCurrency}
                                    liquidity={
                                        marketDataByAddress?.data?.data?.data?.api_serum_dex_m
                                            ?.marketStatsByMarketAddress?.tvl
                                    }
                                />
                            )}
                            {marketDetails === 'tradingview' && (
                                <TradingView marketAddress={marketAddress} marketName={marketName} />
                            )}
                            {marketDetails === 'details' && (
                                <div className="trade__details-container">
                                    <div className="trade__details-btn-container">
                                        <Button
                                            type="default"
                                            onClick={() => setDetailsType('token')}
                                            className={
                                                detailsType === 'token'
                                                    ? 'trade__details_btn--selected'
                                                    : 'trade__details_btn'
                                            }
                                        >
                                            Token Stats
                                        </Button>
                                        <Button
                                            type="default"
                                            onClick={() => setDetailsType('market')}
                                            className={
                                                detailsType === 'market'
                                                    ? 'trade__details_btn--selected'
                                                    : 'trade__details_btn'
                                            }
                                        >
                                            Market Stats
                                        </Button>
                                    </div>
                                    {detailsType === 'market' && <MarketDetails name={baseTokenName} />}
                                    {detailsType === 'token' && (
                                        <TokenDetails
                                            baseTokenAddress={baseMintAddress}
                                            marketAddress={marketAddress}
                                            marketName={marketName}
                                            marketCount={marketCount?.[baseMintAddress] || 0}
                                            name={baseTokenName}
                                            tvl={tvl}
                                            marketCap={marketCap}
                                            marketCapRank={marketCapRank}
                                            holders={holders}
                                            circulatingSupply={circulatingSupply}
                                            v1d={v1d}
                                            v7d={v7d}
                                            price={
                                                marketDataByAddress?.data?.data?.data?.api_serum_dex_m
                                                    ? marketDataByAddress.data?.data.data.api_serum_dex_m.marketStatsByMarketAddress.price.toFixed(
                                                          quoteDecimalDigits,
                                                      )
                                                    : 'Loading...'
                                            }
                                            priceChange={
                                                marketDataByAddress?.data?.data?.data?.api_serum_dex_m
                                                    ?.marketStatsByMarketAddress?.priceChange
                                            }
                                        />
                                    )}
                                </div>
                            )}
                            {marketDetails === 'marketdepth' && (
                                <NewDepthChart
                                    bidsData={bidsNewDepthChartData || []}
                                    asksData={asksNewDepthChartData || []}
                                />
                            )}
                        </div>
                        <div style={{ height: '40%' }}>
                            <ButtonGroup
                                values={[
                                    { label: 'OPEN ORDERS', value: 'openorders' },
                                    { label: 'FILLED ORDERS', value: 'filledorders' },
                                ]}
                                selected={orderDetails}
                                setSelected={setOrderDetails}
                            />
                            {orderDetails === 'openorders' && (
                                <OpenOrders
                                    marketName={marketName}
                                    setAlertTitle={setAlertTitle}
                                    setAlertDescription={setAlertDescription}
                                    setAlertVisible={setAlertVisible}
                                    setAlertType={setAlertType}
                                    bidsData={bidsData}
                                    asksData={asksData}
                                    isRestricted={isRestricted}
                                />
                            )}
                            {orderDetails === 'filledorders' && (
                                <FilledOrders marketName={marketName} isRestricted={isRestricted} />
                            )}
                            <Alert
                                type={alertType}
                                title={alertTitle}
                                description={alertDescription}
                                visible={alertVisible}
                                setVisible={setAlertVisible}
                            />
                        </div>
                    </Col>
                    <Col style={{ borderRight: '0.25px solid rgba(255, 255, 255, 0.1)', height: '83vh' }} span={5}>
                        <div style={{ height: '60%', borderTop: '0.25px solid rgba(255, 255, 255, 0.1)' }}>
                            <ButtonDropdown
                                values={[
                                    { label: 'ALL', value: 'ALL' },
                                    { label: 'BIDS', value: 'BIDS' },
                                    { label: 'ASKS', value: 'ASKS' },
                                ]}
                                selected={selectedBidAsk}
                                setSelected={setSelctedBidAsk}
                                buttonText={'ORDERBOOK'}
                            />
                            <Orderbook
                                selected={selectedBidAsk}
                                price={
                                    marketDataByAddress?.data?.data?.data?.api_serum_dex_m &&
                                    marketDataByAddress.data?.data?.data.api_serum_dex_m.marketStatsByMarketAddress.price.toFixed(
                                        2,
                                    )
                                }
                                mobileView={false}
                                bidsData={bidsOrderbookData}
                                asksData={asksOrderbookData}
                                bidsAmounts={bidsAmounts}
                                asksAmounts={asksAmounts}
                                marketAddress={marketAddress}
                            />
                        </div>
                        <div style={{ height: '40%', borderTop: '0.25px solid rgba(255, 255, 255, 0.1)' }}>
                            <ButtonDropdown
                                values={[
                                    { label: 'ALL', value: 'ALL' },
                                    { label: 'BUY', value: 'BUY' },
                                    { label: 'SELL', value: 'SELL' },
                                ]}
                                selected={selectedBuySell}
                                setSelected={setSelctedBuySell}
                                buttonText={'RECENT TRADES'}
                            />
                            <TradeBook marketAddress={marketAddress} selected={selectedBuySell} mobileView={false} />
                        </div>
                    </Col>
                    {/* WALLET CONNECTED */}
                    {wallet.connected ? (
                        <Col style={{ height: '83vh' }} span={6}>
                            <div style={{ height: '35%' }}>
                                <Button type="default" className="trade__balances_button" style={selectedButtonStyle}>
                                    BALANCES
                                </Button>
                                <Balances
                                    setAlertTitle={setAlertTitle}
                                    setAlertDescription={setAlertDescription}
                                    setAlertVisible={setAlertVisible}
                                    setAlertType={setAlertType}
                                />
                            </div>
                            <div style={{ height: '65%' }}>
                                <ButtonGroup
                                    values={[
                                        { label: 'LIMIT', value: 'limit' },
                                        { label: 'MARKET', value: 'market' },
                                    ]}
                                    selected={orderType}
                                    setSelected={setOrderType}
                                />
                                {orderType === 'limit' && (
                                    <LimitOrder
                                        connection={connection}
                                        wallet={wallet}
                                        marketName={marketName}
                                        setAlertTitle={setAlertTitle}
                                        setAlertDescription={setAlertDescription}
                                        setAlertVisible={setAlertVisible}
                                        setAlertType={setAlertType}
                                        asksData={asksData}
                                        tokenAccountsData={tokenAccountsData}
                                    />
                                )}
                                {orderType === 'market' && (
                                    <MarketOrder
                                        connection={connection}
                                        wallet={wallet}
                                        marketName={marketName}
                                        setAlertTitle={setAlertTitle}
                                        setAlertDescription={setAlertDescription}
                                        setAlertVisible={setAlertVisible}
                                        setAlertType={setAlertType}
                                        tokenAccountsData={tokenAccountsData}
                                        asksData={asksData}
                                        bidsData={bidsData}
                                    />
                                )}
                            </div>
                        </Col>
                    ) : (
                        // WALLET DISCONNECTED
                        <Col style={{ height: '83vh' }} span={6}>
                            <div style={{ height: '100%' }}>
                                <Button type="default" style={selectedButtonStyle}>
                                    BALANCES
                                </Button>
                                <div
                                    style={{
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexDirection: 'column',
                                        height: '90%',
                                        placeContent: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '16px',
                                            fontFamily: 'Inconsolata',
                                            letterSpacing: '0.1em',
                                            textAlign: 'center',
                                            margin: '0rem 0.5rem 0.75rem 0.5rem',
                                        }}
                                    >
                                        Connect your Solana wallet to start trading
                                    </div>
                                    {
                                        // Prohibited Country Codes
                                        // US, CU, IR, AF, SY, KP
                                        // Crimea (UA-43), Sevastopol (UA-40), Luhansk People's Republic (UA-09), Donetsk People's Republic (UA-14)
                                        isRestricted ? (
                                            <ProhibitedTooltip />
                                        ) : (
                                            <WalletMultiButton
                                                className="trade__select_wallet_button"
                                                children={
                                                    wallet.connected ? (
                                                        wallet.publicKey?.toBase58()?.slice(0, 5) +
                                                        '...' +
                                                        wallet.publicKey?.toBase58()?.slice(-5)
                                                    ) : wallet.connecting ? (
                                                        'Connecting...'
                                                    ) : (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <FaWallet
                                                                style={{ marginRight: '0.5rem', fontSize: '12px' }}
                                                            />
                                                            Select Wallet
                                                        </div>
                                                    )
                                                }
                                            />
                                        )
                                    }
                                </div>
                            </div>
                        </Col>
                    )}
                    <Footer trades={todaysTrades} volume={todaysVolume} tvl={todaysTVL} tps={avgTPS} />
                </Row>
            ) : (
                // MOBILE VIEW
                <Row>
                    <Col style={{ borderRight: '0.25px solid rgba(255, 255, 255, 0.2)', height: '86vh' }} span={24}>
                        <div style={{ height: '60%' }}>
                            <ButtonGroup
                                values={[
                                    { label: 'TRADING VIEW', value: 'tradingview' },
                                    { label: 'ANALYTICS', value: 'analytics' },
                                ]}
                                selected={'tradingview'}
                                setSelected={setMarketDetails}
                            />
                            <TradingView marketAddress={marketAddress} marketName={marketName} />
                        </div>
                        <div style={{ height: '65%' }}>
                            <ButtonGroup
                                values={[
                                    { label: 'ORDERBOOK', value: 'orderbook' },
                                    { label: 'RECENT TRADES', value: 'recenttrades' },
                                ]}
                                selected={mobileOrderType}
                                setSelected={setMobileOrderType}
                            />
                            {mobileOrderType === 'orderbook' && (
                                <div>
                                    <Dropdown
                                        values={[
                                            { label: 'ALL', value: 'ALL' },
                                            { label: 'BIDS', value: 'BIDS' },
                                            { label: 'ASKS', value: 'ASKS' },
                                        ]}
                                        selected={selectedBidAsk}
                                        setSelected={setSelctedBidAsk}
                                    />
                                    <Orderbook
                                        selected={selectedBidAsk}
                                        price={
                                            marketDataByAddress?.data?.data?.data?.api_serum_dex_m &&
                                            marketDataByAddress.data?.data.data.api_serum_dex_m.marketStatsByMarketAddress.price.toFixed(
                                                2,
                                            )
                                        }
                                        mobileView={true}
                                        bidsData={bidsOrderbookData}
                                        asksData={asksOrderbookData}
                                        bidsAmounts={bidsAmounts}
                                        asksAmounts={asksAmounts}
                                        marketAddress={marketAddress}
                                    />
                                </div>
                            )}
                            {mobileOrderType === 'recenttrades' && (
                                <div>
                                    <Dropdown
                                        values={[
                                            { label: 'ALL', value: 'ALL' },
                                            { label: 'BUY', value: 'BUY' },
                                            { label: 'SELL', value: 'SELL' },
                                        ]}
                                        selected={selectedBuySell}
                                        setSelected={setSelctedBuySell}
                                    />
                                    <TradeBook
                                        marketAddress={marketAddress}
                                        selected={selectedBuySell}
                                        mobileView={true}
                                    />
                                </div>
                            )}
                        </div>
                    </Col>
                    <MobileFooter
                        values={[
                            { label: 'BUY/SELL', value: 'buysell' },
                            { label: 'ORDERS', value: 'orders' },
                            { label: 'BALANCES', value: 'balances' },
                        ]}
                        selected={footerButtonSelected}
                        setSelected={setFooterButtonSelected}
                    />
                    {footerButtonSelected === 'buysell' && (
                        <Modal
                            footer={null}
                            className="trade__mobile_buysell_modal"
                            visible={footerButtonSelected === 'buysell'}
                            onCancel={() => setFooterButtonSelected('none')}
                        >
                            <div>
                                <ButtonGroup
                                    values={[
                                        { label: 'LIMIT', value: 'limit' },
                                        { label: 'MARKET', value: 'market' },
                                    ]}
                                    selected={orderType}
                                    setSelected={setOrderType}
                                />
                                {orderType === 'limit' && (
                                    <LimitOrder
                                        connection={connection}
                                        wallet={wallet}
                                        marketName={marketName}
                                        setAlertTitle={setAlertTitle}
                                        setAlertDescription={setAlertDescription}
                                        setAlertVisible={setAlertVisible}
                                        setAlertType={setAlertType}
                                        asksData={asksData}
                                        tokenAccountsData={tokenAccountsData}
                                    />
                                )}
                                {orderType === 'market' && (
                                    <MarketOrder
                                        connection={connection}
                                        wallet={wallet}
                                        marketName={marketName}
                                        setAlertTitle={setAlertTitle}
                                        setAlertDescription={setAlertDescription}
                                        setAlertVisible={setAlertVisible}
                                        setAlertType={setAlertType}
                                        tokenAccountsData={tokenAccountsData}
                                        asksData={asksData}
                                        bidsData={bidsData}
                                    />
                                )}
                            </div>
                        </Modal>
                    )}
                    {footerButtonSelected === 'orders' && (
                        <Modal
                            footer={null}
                            className="trade__mobile_open_orders_modal"
                            visible={footerButtonSelected === 'orders'}
                            onCancel={() => setFooterButtonSelected('none')}
                        >
                            <OpenOrders
                                marketName={marketName}
                                setAlertTitle={setAlertTitle}
                                setAlertDescription={setAlertDescription}
                                setAlertVisible={setAlertVisible}
                                setAlertType={setAlertType}
                                bidsData={bidsData}
                                asksData={asksData}
                                isRestricted={isRestricted}
                            />
                        </Modal>
                    )}
                    {footerButtonSelected === 'balances' && (
                        <Modal
                            footer={null}
                            className="trade__mobile_balances_modal"
                            visible={footerButtonSelected === 'balances'}
                            onCancel={() => setFooterButtonSelected('none')}
                        >
                            <Balances
                                setAlertTitle={setAlertTitle}
                                setAlertDescription={setAlertDescription}
                                setAlertVisible={setAlertVisible}
                                setAlertType={setAlertType}
                            />
                        </Modal>
                    )}
                </Row>
            )}
        </Fragment>
    );
}

export default Trade;
