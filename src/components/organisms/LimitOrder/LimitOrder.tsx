// External Imports
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from 'react-query';
// Local Imports
import Input from 'components/atoms/Input/Input';
import Button from 'components/atoms/Button/Button';
import BuySellButtonGroup from 'components/molecules/BuySellButtons/BuySellButtonGroup';
import { Row, Col } from 'components/atoms/Grid/Grid';
import { placeOrder, useTokenAccounts } from 'utils';
import { useSelectedBaseCurrencyAccount, useSelectedQuoteCurrencyAccount } from 'utils/market';
import { useMarket } from 'utils/context';

// CSS Imports
import './LimitOrder.less';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const SOL_PER_LAMPORT = 0.000000001;
interface LimitOrderProps {
    connection: any;
    wallet: any;
    marketName: string;
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    asksData: any;
    tokenAccountsData: any;
}

function LimitOrder({
    connection,
    wallet,
    marketName,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    asksData,
    tokenAccountsData,
}: LimitOrderProps) {
    const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'limit' | 'ioc' | 'postOnly'>('limit');
    const [price, setPrice] = useState(0);
    const [amount, setAmount] = useState(0);
    const [total, setTotal] = useState(0);
    const [accounts] = useTokenAccounts(connection);
    const reactQueryClient = useQueryClient();

    const baseCurrencyAccount = useSelectedBaseCurrencyAccount();
    const quoteCurrencyAccount = useSelectedQuoteCurrencyAccount();

    const { market, marketName: marketNameFromCtx, marketAddress } = useMarket();

    const baseDecimalDigits = useMemo(() => (market ? market['_baseSplTokenDecimals'] : 4), [market]);
    const quoteDecimalDigits = useMemo(() => (market ? market['_quoteSplTokenDecimals'] : 4), [market]);

    // Fetching highest ask to set the price as
    useEffect(() => {
        setPrice(0);
        setAmount(0);
        setTotal(0);
        try {
            // Had to do a duplicate asks call here to avoid asksData change, will make it better in the future
            const asks = async () => {
                const res = await market?.loadAsks(connection);
                if (res && res.getL2(1).length > 0) {
                    for (let [price] of res.getL2(1)) {
                        setPrice(Number(price.toFixed(quoteDecimalDigits)));
                    }
                }
            };
            asks();
        } catch (e) {}
    }, [quoteDecimalDigits, market, connection]);

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

    const handleClickPercentageButton = useCallback(
        (percentage: number) => {
            const isAsk = buySell === 'buy';
            let totalVal = 0;

            if (Number(price) === 0) {
                return;
            }

            if (isAsk) {
                totalVal = quoteBalance * (percentage / 100);
                setTotal(quoteBalance * (percentage / 100));
            } else {
                totalVal = baseBalance * (percentage / 100);
                setAmount(baseBalance * (percentage / 100));
            }

            if (totalVal === 0) {
                setAmount(0);
                if (!isAsk) setTotal(0);
            } else {
                if (isAsk) setAmount(Number((totalVal / price).toFixed(quoteDecimalDigits)));
                if (!isAsk) setTotal(Number((totalVal * price).toFixed(baseDecimalDigits)));
            }
        },
        [baseBalance, baseDecimalDigits, buySell, price, quoteBalance, quoteDecimalDigits],
    );

    const handleSubmit = async (event: React.MouseEvent<HTMLElement>) => {
        try {
            if (!wallet) {
                return null;
            }

            await placeOrder({
                side: buySell,
                price: Number(price),
                size: Number(amount),
                kind: 'limit',
                orderType,
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
        <div className="limit_order__wrapper" style={{ margin: '1rem', position: 'relative', height: '47.6vh' }}>
            <BuySellButtonGroup selected={buySell} setSelected={setBuySell} />
            <div style={{ margin: '2vh 0' }}>
                <Input
                    style={{
                        background: '#202533',
                        border: 'none',
                        boxShadow: 'none',
                        height: '40px',
                    }}
                    prefix="Price"
                    suffix={marketName.split('/')[1]}
                    value={price}
                    onChange={(e: any) => {
                        const val = e.target.value;
                        if (isNaN(Number(val))) return;
                        setPrice(val);
                        setTotal(val * amount);
                    }}
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
                    prefix="Amount"
                    suffix={marketName.split('/')[0]}
                    value={amount !== 0 ? amount : ''}
                    onChange={(e: any) => {
                        const val = e.target.value;
                        if (val.length === 1 && val === '.') {
                            setAmount(val);
                            setTotal(0);
                        }
                        if (isNaN(Number(val))) return;
                        setAmount(val);
                        setTotal(val * price);
                    }}
                />
            </div>
            <div style={{ margin: '2vh 0' }}>
                <Input
                    value={total !== 0 ? total : ''}
                    suffix={marketName.split('/')[1]}
                    style={{
                        background: '#202533',
                        border: 'none',
                        boxShadow: 'none',
                        height: '40px',
                    }}
                    prefix="Total"
                    onChange={(e: any) => {
                        const val = e.target.value;
                        if (val.length === 1 && val === '.') {
                            setTotal(val);
                            setAmount(0);
                        }
                        if (isNaN(Number(val))) return;
                        let amt = Number((val / price).toFixed(baseDecimalDigits));
                        setAmount(amt);
                        setTotal(val);
                    }}
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
            <Row style={{ width: '100%', margin: '2vh 0' }}>
                <Col xs={2.4}>
                    <Button
                        type="default"
                        style={
                            orderType === 'ioc'
                                ? {
                                      padding: '4px 8px',
                                      marginRight: '1vw',
                                      borderRadius: '0px',
                                      fontFamily: 'Inconsolata',
                                      background: '#2E3548',
                                      color: 'rgba(0, 255, 231, 1)',
                                  }
                                : {
                                      padding: '4px 8px',
                                      marginRight: '1vw',
                                      fontFamily: 'Inconsolata',
                                      background: '#202533',
                                      color: 'rgba(255, 255, 255, 0.5)',
                                  }
                        }
                        onClick={() => {
                            orderType === 'ioc' ? setOrderType('limit') : setOrderType('ioc');
                        }}
                    >
                        IOC
                    </Button>
                </Col>
                <Col xs={2.4}>
                    <Button
                        type="default"
                        style={
                            orderType === 'postOnly'
                                ? {
                                      padding: '4px 8px',
                                      fontFamily: 'Inconsolata',
                                      borderRadius: '0px',
                                      background: '#2E3548',
                                      color: 'rgba(0, 255, 231, 1)',
                                  }
                                : {
                                      padding: '4px 8px',
                                      fontFamily: 'Inconsolata',
                                      background: '#202533',
                                      color: 'rgba(255, 255, 255, 0.5)',
                                  }
                        }
                        onClick={() => {
                            orderType === 'postOnly' ? setOrderType('limit') : setOrderType('postOnly');
                        }}
                    >
                        POST ONLY
                    </Button>
                </Col>
            </Row>
            <Button
                type="default"
                className={`limit_order__buy_sell_button ${
                    buySell === 'sell' ? 'limit_order__buy_sell_button--sell' : 'limit_order__buy_sell_button--buy'
                }`}
                style={{
                    color: buySell === 'sell' ? '#FF5C5C' : '#45C493',
                    border: buySell === 'sell' ? '2px solid #FF5C5C' : '2px solid #45C493',
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
                Limit {buySell} {marketName.split('/')[0]}
            </Button>
        </div>
    );
}

export default LimitOrder;
