import { useMemo, Fragment } from 'react';
import { Orderbook } from '@project-serum/serum';
import { css } from '@emotion/react';
import { Progress } from 'antd';

import { Row, Col } from 'components/atoms/Grid/Grid';
import { useOoaOwners } from 'utils/ooaOwners';

import './MarketLiquidity.less';

interface MarketLiquidityProps {
    bids: Orderbook;
    asks: Orderbook;
    baseCurrency: string;
    quoteCurrency: string;
    totalLiquidity: number;
}

const LiquidityTable = ({
    data,
    total,
    side,
    currency,
    ooaOwners,
}: {
    data: { ooa: string; size: number; total: number }[];
    total: number;
    side: 'bid' | 'ask';
    currency: string;
    ooaOwners?: { address: string; img?: string; market: string; name: string; owner: string }[];
}) => {
    return (
        <div className="market_liquidity__table">
            <Row className="market_liquidity__table__header">
                <Col span={8}>OOA & Owner</Col>
                <Col span={5}>Size</Col>
                <Col span={11}>Allocation</Col>
            </Row>
            <div
                css={css`
                    max-height: 230px;
                    overflow: scroll;
                `}
            >
                {data.map((datum) => {
                    const ownerData = ooaOwners?.find((o) => o?.address === datum.ooa);

                    return (
                        <Row key={datum.ooa}>
                            <Col span={8}>
                                <a href={`https://solscan.io/account/${datum.ooa}`} target="_blank" rel="noreferrer">
                                    {datum.ooa.slice(0, 4)}...
                                </a>{' '}
                                {ownerData ? (
                                    <a
                                        href={`https://solscan.io/account/${ownerData?.owner}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Fragment>
                                            {ownerData?.img && ownerData?.img !== '' && (
                                                <img
                                                    src={ownerData.img}
                                                    alt={ownerData.address}
                                                    className="market_liquidity__table__row__icon"
                                                />
                                            )}
                                            {ownerData?.name && ownerData?.name !== ''
                                                ? `${ownerData.name}`
                                                : `${ownerData.owner.slice(0, 4)}...`}
                                        </Fragment>
                                    </a>
                                ) : null}
                            </Col>
                            <Col span={5}>
                                {side === 'ask' ? datum.size.toFixed(2) : datum.total.toFixed(2)} {currency}
                            </Col>
                            <Col span={11}>
                                <Progress
                                    percent={Number(
                                        ((side === 'ask' ? datum.size / total : datum.total / total) * 100).toFixed(2),
                                    )}
                                    strokeColor={side === 'ask' ? '#9945FF' : '#6dc6c1'}
                                    trailColor="rgba(255, 255, 255, 0.1)"
                                    css={css`
                                        width: 88%;
                                        .ant-progress-text {
                                            color: ${side === 'ask' ? '#9945FF' : '#6dc6c1'};
                                        }
                                    `}
                                />
                            </Col>
                        </Row>
                    );
                })}
            </div>
        </div>
    );
};

const getUniqueLP = (data: Orderbook, sort: 'size' | 'total') => {
    let lps: Record<string, any>[] = [];
    for (let x of data) {
        lps.push({ ooa: x.openOrdersAddress.toBase58(), size: x.size, price: x.price, total: x.price * x.size });
    }

    let result: { ooa: string; size: number; price: number; total: number }[] = [];
    lps.reduce((res, value) => {
        if (!res[value.ooa]) {
            res[value.ooa] = { ooa: value.ooa, size: 0, total: 0 };
            result.push(res[value.ooa]);
        }
        res[value.ooa].size += value.size;
        res[value.ooa].total += value.total;
        return res;
    }, {});
    const sorted = result.sort((a: any, b: any) => (sort === 'size' ? b.size - a.size : b.total - a.total));
    return sorted;
};

const MarketLiquidity = ({ bids, asks, baseCurrency, quoteCurrency, totalLiquidity }: MarketLiquidityProps) => {
    const { totalBidAmount, totalAskSize, uniqueBidLP, uniqueAskLP, topUniqueOOABids, topUniqueOOAAsks } =
        useMemo(() => {
            const bidsData = bids;
            const asksData = asks;

            const uniqueBids = bidsData ? getUniqueLP(bidsData, 'total') : [];
            const uniqueAsks = asksData ? getUniqueLP(asksData, 'size') : [];

            const totalBidAmount = uniqueBids.reduce((total, bid) => total + bid?.total, 0);
            const totalAskSize = uniqueAsks.reduce((total, ask) => total + ask?.size, 0);

            const uniqueBidLP = uniqueBids.length;
            const uniqueAskLP = uniqueAsks.length;

            return {
                uniqueBids,
                uniqueAsks,
                totalBidAmount,
                totalAskSize,
                uniqueBidLP,
                uniqueAskLP,
                topUniqueOOABids: uniqueBids?.slice(0, 5) ?? [],
                topUniqueOOAAsks: uniqueAsks?.slice(0, 5) ?? [],
            };
        }, [bids, asks]);

    const ooas = useMemo(() => {
        return [...new Set([...topUniqueOOAAsks.map((a) => a.ooa), ...topUniqueOOABids.map((a) => a.ooa)])];
    }, [topUniqueOOAAsks, topUniqueOOABids]);

    const ooaOwners = useOoaOwners(ooas);

    return (
        <div className="market_liquidity__wrapper">
            <span className="market_liquidity__stats">
                TOTAL LIQ: <span className="market_liquidity__stats__value">~${totalLiquidity?.toFixed(2)}</span>
            </span>
            <span className="market_liquidity__stats">
                ASK LIQ:{' '}
                <span className="market_liquidity__stats__value">
                    {totalAskSize.toFixed(2)} {baseCurrency}
                </span>
            </span>
            <span className="market_liquidity__stats">
                BID LIQ:
                <span className="market_liquidity__stats__value">
                    {totalBidAmount.toFixed(2)} {quoteCurrency}
                </span>
            </span>
            <br />
            <span className="market_liquidity__stats">
                TOTAL LPS: <span className="market_liquidity__stats__value">{uniqueBidLP + uniqueAskLP}</span>
            </span>
            <span className="market_liquidity__stats">
                UNIQUE BID LPS: <span className="market_liquidity__stats__value">{uniqueBidLP}</span>
            </span>
            <span className="market_liquidity__stats">
                UNIQUE ASK LPS: <span className="market_liquidity__stats__value">{uniqueAskLP}</span>
            </span>
            {topUniqueOOAAsks.length > 0 && (
                <Fragment>
                    <div className="market_liquidity__title">Top 5 Ask Liquidity - {baseCurrency}</div>
                    <LiquidityTable
                        data={topUniqueOOAAsks}
                        total={totalAskSize}
                        side="ask"
                        currency={baseCurrency}
                        ooaOwners={ooaOwners?.data || []}
                    />
                </Fragment>
            )}
            {topUniqueOOABids.length > 0 && (
                <Fragment>
                    <div className="market_liquidity__title">Top 5 Bid Liquidity - {quoteCurrency}</div>
                    <LiquidityTable
                        data={topUniqueOOABids}
                        total={totalBidAmount}
                        side="bid"
                        currency={quoteCurrency}
                        ooaOwners={ooaOwners?.data || []}
                    />
                </Fragment>
            )}
        </div>
    );
};

export default MarketLiquidity;
