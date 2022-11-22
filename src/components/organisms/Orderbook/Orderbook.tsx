import { useEffect, useMemo, useState } from 'react';
import { Row, Col } from 'components/atoms/Grid/Grid';
import { io } from 'socket.io-client';
// @ts-ignore
import { useMarket } from 'utils/context';

import './Orderbook.less';
import { countDecimals } from 'utils';
import { LoadingOutlined } from '@ant-design/icons';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';

interface OrderbookProps {
    selected: string;
    price: number;
    mobileView: boolean;
    bidsData: any;
    asksData: any;
    bidsAmounts: any;
    asksAmounts: any;
    marketAddress: string;
}

function Orderbook({
    selected,
    price,
    mobileView,
    bidsData,
    bidsAmounts,
    asksData,
    asksAmounts,
    marketAddress,
}: OrderbookProps) {
    const { market } = useMarket();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
    }, [marketAddress]);

    useEffect(() => {
        setLoading(false);
    }, [bidsData, asksData]);

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

    const spread = useMemo(() => {
        let currentSpread = 0;
        if (asksData.length > 0 && bidsData.length > 0) {
            currentSpread = Number((asksData[0].price - bidsData[0].price).toFixed(quoteDecimalDigits));
        }
        return currentSpread;
    }, [asksData, bidsData, quoteDecimalDigits]);

    return !loading ? (
        <div className="orderbook__wrapper">
            <div style={{ height: '5vh', padding: '0 1rem' }}>
                <Row style={{ width: '100%', height: '100%' }}>
                    <Col
                        xs={8}
                        style={{
                            textAlign: 'left',
                            fontFamily: 'Inconsolata',
                            color: 'rgba(255, 255, 255, 0.5)',
                            lineHeight: '5vh',
                            fontWeight: 'bold',
                        }}
                    >
                        Price
                    </Col>
                    <Col
                        xs={8}
                        style={{
                            textAlign: 'center',
                            fontFamily: 'Inconsolata',
                            color: 'rgba(255, 255, 255, 0.5)',
                            lineHeight: '5vh',
                            fontWeight: 'bold',
                        }}
                    >
                        Size
                    </Col>
                    <Col
                        xs={8}
                        style={{
                            textAlign: 'right',
                            fontFamily: 'Inconsolata',
                            color: 'rgba(255, 255, 255, 0.5)',
                            lineHeight: '5vh',
                            fontWeight: 'bold',
                        }}
                    >
                        Total
                    </Col>
                </Row>
            </div>
            <div className="orderbook__data_wrapper">
                <div>
                    {bidsData &&
                        selected === 'BIDS' &&
                        bidsData?.map((bid: any, index: number) => (
                            <Row
                                className="orderbook__bid_row"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(to left, #45C49344 ${
                                        (bidsAmounts[index] / bidsAmounts[bidsAmounts.length - 1]) * 100
                                    }%, transparent 0)`,
                                    padding: '0 1rem',
                                    margin: '0.125rem 0px',
                                }}
                                key={index}
                            >
                                <Col
                                    xs={8}
                                    style={{
                                        textAlign: 'left',
                                        color: '#45C493',
                                        fontFamily: 'Inconsolata',
                                        lineHeight: '3.2vh',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {bid.price.toFixed(quoteDecimalDigits)}
                                </Col>
                                <Col
                                    xs={8}
                                    style={{
                                        textAlign: 'center',
                                        fontFamily: 'Inconsolata',
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        lineHeight: '3.2vh',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {bid.size.toFixed(baseDecimalDigits)}
                                </Col>
                                <Col
                                    xs={8}
                                    style={{
                                        textAlign: 'right',
                                        fontFamily: 'Inconsolata',
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        lineHeight: '3.2vh',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {bid.total.toFixed(baseDecimalDigits)}
                                </Col>
                            </Row>
                        ))}

                    {asksData &&
                        selected === 'ASKS' &&
                        asksData?.map((ask: any, index: number) => (
                            <Row
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(to left, #FF5C5C44 ${
                                        (asksAmounts[index] / asksAmounts[asksAmounts.length - 1]) * 100
                                    }%, transparent 0)`,
                                    padding: '0 1rem',
                                    margin: '0.125rem 0px',
                                }}
                                key={index}
                            >
                                <Col
                                    xs={8}
                                    style={{
                                        textAlign: 'left',
                                        fontFamily: 'Inconsolata',
                                        color: '#FF5C5C',
                                        lineHeight: '3.2vh',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {ask.price.toFixed(quoteDecimalDigits)}
                                </Col>
                                <Col
                                    xs={8}
                                    style={{
                                        textAlign: 'center',
                                        fontFamily: 'Inconsolata',
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        lineHeight: '3.2vh',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {ask.size.toFixed(baseDecimalDigits)}
                                </Col>
                                <Col
                                    xs={8}
                                    style={{
                                        textAlign: 'right',
                                        fontFamily: 'Inconsolata',
                                        color: 'rgba(255, 255, 255, 0.85)',
                                        lineHeight: '3.2vh',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {ask.total.toFixed(baseDecimalDigits)}
                                </Col>
                            </Row>
                        ))}

                    {asksData && bidsData && selected === 'ALL' && (
                        <div>
                            <div className="orderbook__data_wrapper--all_asks">
                                {asksData?.map((ask: any, index: number) => (
                                    <Row
                                        style={{
                                            width: '100%',
                                            background: `linear-gradient(to left, #FF5C5C44 ${
                                                (asksAmounts[index] / asksAmounts[asksAmounts.length - 1]) * 100
                                            }%, transparent 0)`,
                                            padding: '0 1rem',
                                            marginTop: '0.125rem',
                                        }}
                                        key={index}
                                    >
                                        <Col
                                            xs={8}
                                            style={{
                                                textAlign: 'left',
                                                fontFamily: 'Inconsolata',
                                                color: '#FF5C5C',
                                                lineHeight: '3.2vh',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {ask.price.toFixed(quoteDecimalDigits)}
                                        </Col>
                                        <Col
                                            xs={8}
                                            style={{
                                                textAlign: 'center',
                                                fontFamily: 'Inconsolata',
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                lineHeight: '3.2vh',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {ask.size.toFixed(baseDecimalDigits)}
                                        </Col>
                                        <Col
                                            xs={8}
                                            style={{
                                                textAlign: 'right',
                                                fontFamily: 'Inconsolata',
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                lineHeight: '3.2vh',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {ask.total.toFixed(baseDecimalDigits)}
                                        </Col>
                                    </Row>
                                ))}
                            </div>
                            <div className="orderbook__data_wrapper--all_slippage">
                                <Row style={{ width: '100%', padding: '0 1rem' }}>
                                    <Col
                                        xs={8}
                                        style={{
                                            textAlign: 'left',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            lineHeight: '3.8vh',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                        }}
                                    >
                                        Spread
                                    </Col>
                                    <Col
                                        xs={8}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '3.8vh',
                                            fontWeight: 'bold',
                                            fontSize: '16px',
                                        }}
                                    >
                                        {spread !== 0 && spread.toFixed(quoteDecimalDigits)}
                                    </Col>
                                    <Col
                                        xs={8}
                                        style={{
                                            textAlign: 'right',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            lineHeight: '3.8vh',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {price && spread !== 0 && ((spread * 100) / price).toFixed(4)}%
                                    </Col>
                                </Row>
                            </div>
                            <div className="orderbook__data_wrapper--all_bids">
                                {bidsData?.map((bid: any, index: number) => (
                                    <Row
                                        style={{
                                            width: '100%',
                                            background: `linear-gradient(to left, #45C49344 ${
                                                (bidsAmounts[index] / bidsAmounts[bidsAmounts.length - 1]) * 100
                                            }%, transparent 0)`,
                                            padding: '0 1rem',
                                            marginBottom: '0.125rem',
                                        }}
                                        key={index}
                                    >
                                        <Col
                                            xs={8}
                                            style={{
                                                textAlign: 'left',
                                                fontFamily: 'Inconsolata',
                                                color: '#45C493',
                                                lineHeight: '3.2vh',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {bid.price.toFixed(quoteDecimalDigits)}
                                        </Col>
                                        <Col
                                            xs={8}
                                            style={{
                                                textAlign: 'center',
                                                fontFamily: 'Inconsolata',
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                lineHeight: '3.2vh',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {bid.size.toFixed(baseDecimalDigits)}
                                        </Col>
                                        <Col
                                            xs={8}
                                            style={{
                                                textAlign: 'right',
                                                fontFamily: 'Inconsolata',
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                lineHeight: '3.2vh',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {bid.total.toFixed(baseDecimalDigits)}
                                        </Col>
                                    </Row>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="orderbook__loading_wrapper">
            <Row className="orderbook__loading_row">
                <LoadingOutlined className="orderbook__loading_icon" />
            </Row>
            <Row className="orderbook__loading_row--title">
                <Title className="orderbook__loading_title">Loading</Title>
            </Row>
        </div>
    );
}

export default Orderbook;
