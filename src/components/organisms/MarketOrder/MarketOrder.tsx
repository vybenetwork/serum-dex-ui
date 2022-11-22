import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import BuySellButtonGroup from 'components/molecules/BuySellButtons/BuySellButtonGroup';
import Input from 'components/atoms/Input/Input';
import './MarketOrder.less';
import Button from 'components/atoms/Button/Button';
import { Row, Col } from 'components/atoms/Grid/Grid';
import { placeOrder, countDecimals, getSizeByTotal, roundDown } from 'utils';
import { useMarket } from 'utils/context';
import { getSelectedTokenAccountForMint, useTokenAccounts, getTotalBySize } from 'utils';
import { FaInfoCircle } from 'react-icons/fa';
import Tooltip from 'components/atoms/Tooltip/Tooltip';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const SOL_PER_LAMPORT = 0.000000001;

interface MarketOrderProps {
    connection: any;
    wallet: any;
    marketName: string;
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    tokenAccountsData: any;
    asksData: any;
    bidsData: any;
}

function MarketOrder({
    connection,
    wallet,
    marketName,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    tokenAccountsData,
    asksData,
    bidsData,
}: MarketOrderProps) {
    const [selected, setSelected] = useState<'buy' | 'sell'>('buy');
    const [marketPrice, setMarketPrice] = useState<number>(0);
    const [amount, setAmount] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    const { market, marketName: marketNameFromCtx, marketAddress } = useMarket();

    const [accounts] = useTokenAccounts(connection);
    const reactQueryClient = useQueryClient();

    useEffect(() => {
        if (marketAddress) {
            setAmount(0);
            setTotal(0);
        }
    }, [marketAddress]);

    const baseDecimalDigits = useMemo(() => (market ? market['_baseSplTokenDecimals'] : 6), [market]);
    const quoteDecimalDigits = useMemo(() => (market ? market['_quoteSplTokenDecimals'] : 6), [market]);
    const roundedTotalDecimals = useMemo(() => (market ? countDecimals(market['minOrderSize']) : 4), [market]);

    const tooltipText = (
        <div>
            <Title className="market_order__rounded_total_tooltip_title">
                The minimum increment for {marketName} is {market && market['minOrderSize']} {marketName.split('/')[0]}.
            </Title>
            <Title className="market_order__rounded_total_tooltip_title">
                Your order will be rounded down to the closest increment. This means an order for{' '}
                {Number(10).toFixed(roundedTotalDecimals)}55 {marketName.split('/')[0]} will be rounded down to{' '}
                {Number(10).toFixed(roundedTotalDecimals)} {marketName.split('/')[0]}.
            </Title>
        </div>
    );

    const { baseBalance = 0, quoteBalance = 0 } = useMemo(() => {
        let baseBalance = 0;
        let quoteBalance = 0;

        const solAcc = accounts?.find((account) => account.effectiveMint.toBase58() === SOL_MINT);

        if (solAcc) {
            if (market?.baseMintAddress.toBase58() === SOL_MINT) {
                baseBalance = (solAcc?.account?.lamports || 0) * SOL_PER_LAMPORT;
            }
            if (market?.quoteMintAddress.toBase58() === SOL_MINT) {
                quoteBalance = (solAcc?.account?.lamports || 0) * SOL_PER_LAMPORT;
            }
        }

        const base = tokenAccountsData?.data?.value?.find(
            (acc: any) => acc?.account?.data?.parsed?.info?.mint === market?.baseMintAddress.toBase58(),
        );

        const quote = tokenAccountsData?.data?.value?.find(
            (acc: any) => acc?.account?.data?.parsed?.info?.mint === market?.quoteMintAddress.toBase58(),
        );

        if (base) {
            baseBalance = base.account.data.parsed?.info.tokenAmount.uiAmount;
        }

        if (quote) {
            quoteBalance = quote.account.data.parsed?.info.tokenAmount.uiAmount;
        }

        return {
            baseBalance,
            quoteBalance,
        };
    }, [accounts, market?.baseMintAddress, market?.quoteMintAddress, tokenAccountsData?.data?.value]);

    const orderbookForPlacingOrder = useMemo(() => {
        let bidsPollingData = [];
        let asksPollingData = [];
        if (bidsData?.data) {
            // L2 orderbook data
            for (let [price, size] of bidsData?.data?.getL2(50)) {
                bidsPollingData.push({
                    price,
                    size,
                    total: price * size,
                });
            }
        }

        if (asksData?.data) {
            for (let [price, size] of asksData?.data.getL2(50)) {
                asksPollingData.push({
                    price,
                    size,
                    total: price * size,
                });
            }
        }

        return {
            asks: asksPollingData,
            bids: bidsPollingData,
        };
    }, [bidsData?.data, asksData?.data]);

    // handling helper buttons to enter amount & total values in these fields to buy/sell
    const handleClickPercentageButton = useCallback(
        (percentage: number) => {
            const isAsk = selected === 'buy';
            let totalVal = 0;

            if (isAsk) {
                totalVal = quoteBalance * (percentage / 100);
                setTotal(quoteBalance * (percentage / 100));
            } else {
                totalVal = baseBalance * (percentage / 100);
                setAmount(baseBalance * (percentage / 100));
            }

            if (totalVal === 0) {
                setMarketPrice(0);
                setAmount(0);
                if (!isAsk) setTotal(0);
            } else {
                const [calculatedAmount, marketPrice] = getSizeByTotal(
                    totalVal,
                    orderbookForPlacingOrder[`${isAsk ? 'asks' : 'bids'}`],
                );

                if (calculatedAmount && marketPrice) {
                    setMarketPrice(marketPrice);
                    if (isAsk) setAmount(calculatedAmount);
                    if (!isAsk) setTotal(totalVal * marketPrice);
                }
            }
        },
        [baseBalance, orderbookForPlacingOrder, quoteBalance, selected],
    );

    const onAmountChange = useCallback(
        (e: any) => {
            const amountVal = e.target.value;
            if (amountVal.length === 1 && amountVal === '.') {
                setAmount(amountVal);
                setTotal(0);
            }

            if (isNaN(Number(amountVal))) {
                return;
            }
            setAmount(amountVal);

            if (Number(amountVal) === 0) {
                setMarketPrice(0);
                setTotal(0);
            } else {
                const isAsk = selected === 'buy';
                const [calculatedTotal, marketPrice] = getTotalBySize(
                    Number(amountVal),
                    orderbookForPlacingOrder[`${isAsk ? 'asks' : 'bids'}`],
                );

                if (calculatedTotal && marketPrice) {
                    setMarketPrice(marketPrice);
                    setTotal(calculatedTotal.toFixed(quoteDecimalDigits));
                }
            }
        },
        [orderbookForPlacingOrder, quoteDecimalDigits, selected],
    );

    const onTotalChange = useCallback(
        (e: any) => {
            const totalVal = e.target.value;
            if (totalVal.length === 1 && totalVal === '.') {
                setAmount(0);
                setTotal(totalVal);
            }

            if (isNaN(Number(totalVal))) {
                return;
            }
            setTotal(totalVal);

            if (Number(totalVal) === 0) {
                setMarketPrice(0);
                setAmount(0);
            } else {
                const isAsk = selected === 'buy';
                const [calculatedSize, marketPrice] = getSizeByTotal(
                    Number(totalVal),
                    orderbookForPlacingOrder[`${isAsk ? 'asks' : 'bids'}`],
                );

                if (calculatedSize && marketPrice) {
                    setMarketPrice(marketPrice);
                    setAmount(calculatedSize.toFixed(baseDecimalDigits));
                }
            }
        },
        [orderbookForPlacingOrder, baseDecimalDigits, selected],
    );

    const handleSubmit = async (event: React.MouseEvent<HTMLElement>) => {
        // Get accounts
        const baseCurrencyAccount = getSelectedTokenAccountForMint(accounts, market?.baseMintAddress);
        const quoteCurrencyAccount = getSelectedTokenAccountForMint(accounts, market?.quoteMintAddress);

        try {
            if (!wallet) {
                return null;
            }

            let decimals;
            if (market) {
                decimals = countDecimals(market.tickSize);
            } else {
                decimals = 6;
            }

            await placeOrder({
                side: selected,
                price: selected === 'sell' ? Number(market?.tickSize) : Number(marketPrice.toFixed(decimals)),
                size: amount,
                orderType: 'ioc',
                kind: 'market',
                market,
                connection,
                wallet,
                baseCurrencyAccount: baseCurrencyAccount?.pubkey,
                quoteCurrencyAccount: quoteCurrencyAccount?.pubkey,
                feeDiscountPubkey: undefined,
                setAlertTitle,
                setAlertDescription,
                setAlertVisible,
                setAlertType,
                currentMarketDetails: {
                    name: marketNameFromCtx,
                    addr: marketAddress,
                },
            });

            reactQueryClient.refetchQueries(['marketOOA', wallet?.publicKey?.toBase58() || '', marketAddress]);
        } catch (e) {
            console.warn(e);
        }
    };

    return (
        <div className="market_order__wrapper" style={{ margin: '1rem', position: 'relative', height: '47.6vh' }}>
            <BuySellButtonGroup selected={selected} setSelected={setSelected} />
            <div style={{ margin: '2vh 0' }}>
                <Input
                    style={{
                        background: '#202533',
                        border: 'none',
                        boxShadow: 'none',
                        height: '40px',
                    }}
                    value={amount !== 0 ? amount : ''}
                    onChange={onAmountChange}
                    prefix="Amount"
                    suffix={marketName.split('/')[0]}
                />
            </div>
            <div style={{ margin: '2vh 0' }}>
                <Input
                    style={{
                        background: '#202533',
                        border: 'none',
                        boxShadow: 'none',
                        height: '40px',
                    }}
                    value={total !== 0 ? total : ''}
                    onChange={onTotalChange}
                    prefix="Total"
                    suffix={marketName.split('/')[1]}
                />
            </div>
            <div style={{ margin: '2vh 0' }}>
                <Input
                    style={{
                        background: '#202533',
                        border: 'none',
                        boxShadow: 'none',
                        height: '40px',
                    }}
                    value={
                        total === 0
                            ? ''
                            : roundedTotalDecimals && amount !== 0 && countDecimals(amount) > roundedTotalDecimals
                            ? Number(roundDown(amount, roundedTotalDecimals)) * marketPrice
                            : total
                    }
                    onChange={onTotalChange}
                    prefix={
                        <div className="market_order__rounded_total_input_prefix">
                            Rounded Total
                            <Tooltip
                                placement="top"
                                title={tooltipText}
                                color="rgba(32, 37, 51, 1)"
                                className="market_order__rounded_total_tooltip"
                            >
                                <FaInfoCircle className="market_order__rounded_total_input_icon" />
                            </Tooltip>
                        </div>
                    }
                    suffix={marketName.split('/')[1]}
                    className="market_order__rounded_total_input"
                />
            </div>
            <Row style={{ width: '100%', justifyContent: 'space-between', margin: '2vh 0' }}>
                <Col style={{ width: '20%' }}>
                    <Button
                        type="default"
                        style={{
                            padding: '2px',
                            width: '100%',
                            border: '0.25px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0px',
                            fontFamily: 'Inconsolata',
                        }}
                        onClick={() => handleClickPercentageButton(10)}
                    >
                        10%
                    </Button>
                </Col>
                <Col style={{ width: '20%' }}>
                    <Button
                        type="default"
                        style={{
                            padding: '2px',
                            width: '100%',
                            border: '0.25px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0px',
                            fontFamily: 'Inconsolata',
                        }}
                        onClick={() => handleClickPercentageButton(25)}
                    >
                        25%
                    </Button>
                </Col>
                <Col style={{ width: '20%' }}>
                    <Button
                        type="default"
                        style={{
                            padding: '2px',
                            width: '100%',
                            border: '0.25px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0px',
                            fontFamily: 'Inconsolata',
                        }}
                        onClick={() => handleClickPercentageButton(50)}
                    >
                        50%
                    </Button>
                </Col>
                <Col style={{ width: '20%' }}>
                    <Button
                        type="default"
                        style={{
                            padding: '2px',
                            width: '100%',
                            border: '0.25px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0px',
                            fontFamily: 'Inconsolata',
                        }}
                        onClick={() => handleClickPercentageButton(75)}
                    >
                        75%
                    </Button>
                </Col>
                <Col style={{ width: '20%' }}>
                    <Button
                        type="default"
                        style={{
                            padding: '2px',
                            width: '100%',
                            border: '0.25px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0px',
                            fontFamily: 'Inconsolata',
                        }}
                        onClick={() => handleClickPercentageButton(100)}
                    >
                        100%
                    </Button>
                </Col>
            </Row>
            <Button
                type="default"
                className={`market_order__buy_sell_button ${
                    selected === 'sell' ? 'market_order__buy_sell_button--sell' : 'market_order__buy_sell_button--buy'
                }`}
                style={{
                    color: selected === 'sell' ? '#FF5C5C' : '#45C493',
                    border: selected === 'sell' ? '2px solid #FF5C5C' : '2px solid #45C493',
                    width: '100%',
                    bottom: '0',
                    position: 'absolute',
                    marginBottom: '0.5rem',
                    height: '40px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    letterSpacing: '0.15em',
                }}
                onClick={(event: React.MouseEvent<HTMLElement>) => handleSubmit(event)}
            >
                Market {selected} {marketName.split('/')[0]}
            </Button>
        </div>
    );
}

export default MarketOrder;
