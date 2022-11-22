import { useState, useEffect, useMemo } from 'react';
import { VictoryChart } from 'victory-chart';
import { VictoryArea } from 'victory-area';
import {
    createContainer,
    VictoryTooltip,
    VictoryVoronoiContainerProps,
    VictoryZoomContainerProps,
    VictoryLine,
} from 'victory';
import { useMarket } from 'utils/context';
import { Row } from 'components/atoms/Grid/Grid';
import { LoadingOutlined } from '@ant-design/icons';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';
import { VybeTheme } from 'components/organisms/NewDepthChart/theme';
import './NewDepthChart.less';
import { useWindowDimensions, countDecimals } from 'utils';
import DepthChartTooltip from 'components/molecules/DepthChartTooltip/DepthChartTooltip';

interface NewDepthChartProps {
    bidsData: any;
    asksData: any;
}

const VictoryZoomVoronoiContainer = createContainer<VictoryZoomContainerProps, VictoryVoronoiContainerProps>(
    'zoom',
    'voronoi',
);

function NewDepthChart({ bidsData, asksData }: NewDepthChartProps) {
    const [domains, setDomains] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [zoomState, setZoomState] = useState<number>(0);

    const { marketAddress, market } = useMarket();

    const { height, width } = useWindowDimensions();
    let chartHeight = Number((0.458 * height).toFixed(0));
    let chartWidth = Number((0.5416 * width).toFixed(0));

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

    const handleZoom = (domain: any) => {
        buildZoomDomains(bidsData, asksData);
        // Zoom into data more
        if (domain.x[1] - domain.x[0] > domains[zoomState].x[1] - domains[zoomState].x[0]) {
            if (zoomState !== domains.length - 1) {
                setZoomState(zoomState + 1);
            }
        }
        // Zoom out of data more
        if (domain.x[1] - domain.x[0] <= domains[zoomState].x[1] - domains[zoomState].x[0]) {
            if (zoomState !== 0) {
                setZoomState(zoomState - 1);
            }
        }
    };

    useEffect(() => {
        setZoomState(0);
        setLoading(true);
    }, [marketAddress]);

    const buildZoomDomains = (bids: any, asks: any) => {
        let domains = [];
        if (bids.length >= asks.length) {
            for (let i = 1; i < asks.length; i++) {
                if (bids[0].x - bids[i].x >= asks[i].x - asks[0].x) {
                    let difference = asks[i].x - asks[0].x;
                    let maxY;

                    if (bids[i].y >= asks[i].y) {
                        maxY = bids[i].y;
                    } else {
                        maxY = asks[i].y;
                    }

                    domains.push({
                        x: [bids[0].x - difference, asks[0].x + difference],
                        y: [0, maxY],
                    });
                } else {
                    let difference = bids[0].x - bids[i].x;
                    let maxY;

                    if (bids[i].y >= asks[i].y) {
                        maxY = bids[i].y;
                    } else {
                        maxY = asks[i].y;
                    }

                    domains.push({
                        x: [bids[0].x - difference, asks[0].x + difference],
                        y: [0, maxY],
                    });
                }
            }
        } else {
            for (let i = 1; i < bids.length; i++) {
                if (bids[0].x - bids[i].x >= asks[i].x - asks[0].x) {
                    let difference = asks[i].x - asks[0].x;
                    let maxY;

                    if (bids[i].y >= asks[i].y) {
                        maxY = bids[i].y;
                    } else {
                        maxY = asks[i].y;
                    }

                    domains.push({
                        x: [bids[0].x - difference, asks[0].x + difference],
                        y: [0, maxY],
                    });
                } else {
                    let difference = bids[0].x - bids[i].x;
                    let maxY;

                    if (bids[i].y >= asks[i].y) {
                        maxY = bids[i].y;
                    } else {
                        maxY = asks[i].y;
                    }

                    domains.push({
                        x: [bids[0].x - difference, asks[0].x + difference],
                        y: [0, maxY],
                    });
                }
            }
        }
        setDomains(domains);
    };

    useEffect(() => {
        // Building the Zoom Domains
        if (zoomState === 0) {
            setLoading(true);
            if (bidsData.length > asksData.length) {
                let newZoom = Number((asksData.length / 2).toFixed(0));
                setZoomState(newZoom);
            } else {
                let newZoom = Number((bidsData.length / 2).toFixed(0));
                setZoomState(newZoom);
            }
        }

        buildZoomDomains(bidsData, asksData);

        setLoading(false);
        // eslint-disable-next-line
    }, [bidsData, asksData]);

    const colorScale = ['#45C493', '#FF5C5C'];
    return !loading ? (
        <div>
            <VictoryChart
                width={chartWidth}
                height={chartHeight}
                theme={VybeTheme}
                containerComponent={
                    <VictoryZoomVoronoiContainer
                        labels={(label: any) => " "}
                        labelComponent={
                            <VictoryTooltip flyoutComponent={<DepthChartTooltip price={asksData[0].x}/>} constrainToVisibleArea/>
                        }
                        zoomDomain={domains[zoomState]}
                        minimumZoom={domains[0]}
                        onZoomDomainChange={handleZoom}
                        zoomDimension="x"
                        voronoiDimension="x"
                    />
                }
            >
                <VictoryArea
                    data={bidsData}
                    interpolation="step"
                    key={'area-0'}
                    name={'area-0'}
                    style={{ data: { fill: colorScale[0], fillOpacity: 0.5, stroke: colorScale[0], strokeWidth: 2 } }}
                    domain={
                        bidsData[0]?.x && {
                            x: [bidsData[0].x, bidsData[bidsData.length - 1].x],
                            y: [0, bidsData[bidsData.length - 1].y],
                        }
                    }
                />

                {bidsData.length === 0 || asksData.length === 0 ? (
                    <div></div>
                ) : (
                    <VictoryLine
                        labels={() => ''}
                        data={[
                            { x: bidsData[0].x, y: 0 },
                            {
                                x: bidsData[0].x,
                                y:
                                    asksData[asksData.length - 1].y >= bidsData[bidsData.length - 1].y
                                        ? asksData[asksData.length - 1].y > 50000
                                            ? asksData[asksData.length - 1].y
                                            : 50000
                                        : bidsData[bidsData.length - 1].y > 50000
                                        ? bidsData[bidsData.length - 1].y
                                        : 50000,
                            },
                        ]}
                    />
                )}
                <VictoryArea
                    data={asksData}
                    interpolation="step"
                    key={'area-1'}
                    name={'area-1'}
                    style={{ data: { fill: colorScale[1], fillOpacity: 0.5, stroke: colorScale[1], strokeWidth: 2 } }}
                    domain={
                        asksData[0]?.x && {
                            x: [asksData[0].x, asksData[asksData.length - 1].x],
                            y: [0, asksData[asksData.length - 1].y],
                        }
                    }
                />
            </VictoryChart>
        </div>
    ) : (
        <div className="depth_chart__loading_wrapper">
            <Row className="depth_chart__loading_row">
                <LoadingOutlined className="depth_chart__loading_icon" />
            </Row>
            <Row className="depth_chart__loading_row--title">
                <Title className="depth_chart__loading_title">Loading</Title>
            </Row>
        </div>
    );
}

export default NewDepthChart;
