import { useState, useEffect, useMemo } from 'react';
import { Row, Col } from 'components/atoms/Grid/Grid';
import { useQuery } from 'react-query';
import { gqlMarketTradesByAddress } from 'requests/index';
import './TradeBook.less';
// @ts-ignore
import { useMarket } from 'utils/context';
import { countDecimals } from 'utils';

interface TradebookProps {
    marketAddress: string;
    selected: 'ALL' | 'BUY' | 'SELL';
    mobileView: boolean;
}

function TradeBook({ marketAddress, selected, mobileView }: TradebookProps) {
    const marketStats = useQuery(['market_stats', marketAddress], async () => gqlMarketTradesByAddress(marketAddress), {
        refetchInterval: 3000,
        enabled: !!marketAddress,
        keepPreviousData: true,
    });

    const { market } = useMarket();

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

    return (
        <div>
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
                        Time
                    </Col>
                </Row>
            </div>
            <div className="tradebook__data_wrapper" style={{ height: mobileView ? '43vh' : '24vh' }}>
                <div style={{ padding: '0 1rem' }}>
                    {marketStats.data?.data?.data?.api_serum_dex_m?.marketTradesByMarketAddress &&
                        marketStats.data?.data.data.api_serum_dex_m.marketTradesByMarketAddress.map(
                            (x: any, index: number) => {
                                if (selected === 'BUY' && x.side === 'buy') {
                                    return (
                                        <Row style={{ width: '100%', height: '100%' }} key={index}>
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
                                                {parseFloat(x.price).toFixed(quoteDecimalDigits)}
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
                                                {x.size.toFixed(baseDecimalDigits)}
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
                                                {new Date(x.time).toLocaleTimeString()}
                                            </Col>
                                        </Row>
                                    );
                                }

                                if (selected === 'SELL' && x.side === 'sell') {
                                    return (
                                        <Row style={{ width: '100%', height: '100%' }} key={index}>
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
                                                {x.price.toFixed(quoteDecimalDigits)}
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
                                                {x.size.toFixed(baseDecimalDigits)}
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
                                                {new Date(x.time).toLocaleTimeString()}
                                            </Col>
                                        </Row>
                                    );
                                }

                                if (selected === 'ALL') {
                                    return (
                                        <Row style={{ width: '100%', height: '100%' }} key={index}>
                                            <Col
                                                xs={8}
                                                style={{
                                                    textAlign: 'left',
                                                    fontFamily: 'Inconsolata',
                                                    color: x.side === 'buy' ? '#45C493' : '#FF5C5C',
                                                    lineHeight: '3.2vh',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {x.price.toFixed(quoteDecimalDigits)}
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
                                                {x.size.toFixed(baseDecimalDigits)}
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
                                                {new Date(x.time).toLocaleTimeString()}
                                            </Col>
                                        </Row>
                                    );
                                }
                            },
                        )}
                </div>
            </div>
        </div>
    );
}

export default TradeBook;
