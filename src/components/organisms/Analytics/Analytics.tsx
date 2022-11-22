import Button from 'components/atoms/Button/Button';
import { useState, useMemo } from 'react';
import './Analytics.less';
import { VybeThemeAnalytics, VybeThemeTVL } from 'components/organisms/NewDepthChart/theme';
import {
    VictoryChart,
    VictoryBar,
    VictoryArea,
    VictoryTooltip,
    createContainer,
    VictoryZoomContainerProps,
    VictoryVoronoiContainerProps,
    VictoryAxis,
} from 'victory';
import { useWindowDimensions } from 'utils';
import MarketLiquidity from 'components/organisms/MarketLiquidity/MarketLiquidity';
import AnalyticsTooltip from 'components/molecules/AnalyticsTooltip/AnalyticsTooltip';

interface AnalyticsProps {
    marketChartData: any;
    tvlChartData: any;
    bidsData: any;
    asksData: any;
    baseCurrency: any;
    quoteCurrency: any;
    liquidity: number;
}

const VictoryZoomVoronoiContainer = createContainer<VictoryZoomContainerProps, VictoryVoronoiContainerProps>(
    'zoom',
    'voronoi',
);
const Analytics = ({
    marketChartData,
    tvlChartData,
    bidsData,
    asksData,
    baseCurrency,
    quoteCurrency,
    liquidity,
}: AnalyticsProps) => {
    const [analyticsType, setAnalyticsType] = useState<'volume' | 'fees' | 'tvl' | 'liquidity'>('volume');

    const { height, width } = useWindowDimensions();
    let chartHeight = Number((0.418 * height).toFixed(0));
    let chartWidth = Number((0.5416 * width).toFixed(0));

    // Formatting Volume Data
    const newFormattedVolumeData = useMemo(() => {
        if (marketChartData?.data?.data?.data?.api_serum_dex_m?.ohlcvfValuesByMarketAddress) {
            const formatted = [];
            for (
                let i = 0;
                i < marketChartData.data.data.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.t.length;
                i += 1
            ) {
                let t = new Date(
                    marketChartData?.data?.data?.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.t[i] * 1000,
                );
                if (t.toString() !== 'Invalid Date') {
                    formatted.push({
                        x: t.toLocaleString(),
                        y: marketChartData.data.data.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.v[i],
                    });
                }
            }
            return formatted;
        } else {
            return [];
        }
    }, [marketChartData]);

    // Formatting TVL Data
    const newFormattedTvlData = useMemo(() => {
        if (tvlChartData?.data?.data?.data?.api_serum_dex_m?.marketTVLByMarketAddress.t) {
            const formatted = [];
            for (
                let i = 0;
                i < tvlChartData?.data?.data?.data.api_serum_dex_m.marketTVLByMarketAddress.t.length;
                i += 1
            ) {
                let t = new Date(tvlChartData?.data?.data?.data.api_serum_dex_m.marketTVLByMarketAddress.t[i] * 1000);
                formatted.push({
                    x: t.toLocaleDateString(),
                    y: tvlChartData?.data?.data?.data.api_serum_dex_m.marketTVLByMarketAddress.tvl[i],
                });
            }
            return formatted;
        } else {
            return [];
        }
    }, [tvlChartData]);

    // Formatting Fees Data
    const newFormattedFees = useMemo(() => {
        if (marketChartData?.data?.data?.data?.api_serum_dex_m?.ohlcvfValuesByMarketAddress) {
            const formatted = [];
            for (
                let i = 0;
                i < marketChartData.data.data.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.t.length;
                i += 1
            ) {
                let t = new Date(
                    marketChartData?.data?.data?.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.t[i] * 1000,
                );
                if (t.toString() !== 'Invalid Date') {
                    formatted.push({
                        x: t.toLocaleString(),
                        y: marketChartData.data.data.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.f[i],
                    });
                }
            }
            return formatted;
        } else {
            return [];
        }
    }, [marketChartData]);

    const colorScale = ['#6DC6C1', '#FF5C5C'];
    return (
        <div className="analytics__container">
            <div className="analytics__btn-container">
                <Button
                    type="default"
                    onClick={() => setAnalyticsType('volume')}
                    className={analyticsType === 'volume' ? 'analytics__btn--selected' : 'analytics__btn'}
                >
                    Volume
                </Button>
                <Button
                    type="default"
                    onClick={() => setAnalyticsType('tvl')}
                    className={analyticsType === 'tvl' ? 'analytics__btn--selected' : 'analytics__btn'}
                >
                    TVL
                </Button>
                <Button
                    type="default"
                    onClick={() => setAnalyticsType('fees')}
                    className={analyticsType === 'fees' ? 'analytics__btn--selected' : 'analytics__btn'}
                >
                    Fees
                </Button>
                <Button
                    type="default"
                    onClick={() => setAnalyticsType('liquidity')}
                    className={analyticsType === 'liquidity' ? 'analytics__btn--selected' : 'analytics__btn'}
                >
                    Liquidity
                </Button>
            </div>
            {analyticsType === 'volume' && (
                <VictoryChart
                    theme={VybeThemeAnalytics}
                    scale={{ x: 'time' }}
                    width={chartWidth}
                    height={chartHeight}
                    containerComponent={
                        <VictoryZoomVoronoiContainer
                            voronoiDimension="x"
                            zoomDimension="x"
                            labels={(label: any) => " "}
                            labelComponent={
                                <VictoryTooltip 
                                    flyoutComponent={<AnalyticsTooltip title='Volume'/>} 
                                    constrainToVisibleArea
                                    pointerLength={10}
                                />
                            }
                        />
                    }
                >
                    <VictoryBar
                        barRatio={0.9}
                        style={{
                            data: { fill: '#6DC6C1' },
                        }}
                        data={newFormattedVolumeData}
                    />
                    <VictoryAxis dependentAxis />
                    <VictoryAxis
                        style={{
                            axis: { stroke: 'transparent' },
                            ticks: { stroke: 'transparent' },
                            tickLabels: { fill: 'transparent' },
                        }}
                    />
                </VictoryChart>
            )}
            {analyticsType === 'tvl' && (
                <div className="analytics__tvl-chart-container">
                    <svg style={{ height: 0 }}>
                        <defs>
                            <linearGradient id="myGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#6DC6C188" />
                                <stop offset="100%" stopColor="#6DC6C122" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <VictoryChart
                        theme={VybeThemeTVL}
                        scale={{ x: 'time' }}
                        width={chartWidth}
                        height={chartHeight}
                        containerComponent={
                            <VictoryZoomVoronoiContainer
                                voronoiDimension="x"
                                zoomDimension="x"
                                labels={(label: any) => " "}
                                labelComponent={
                                    <VictoryTooltip flyoutComponent={<AnalyticsTooltip title='TVL'/>} constrainToVisibleArea/>
                                }
                                mouseFollowTooltips
                            />
                        }
                    >
                        <VictoryArea
                            style={{ data: { fill: 'url(#myGradient)', stroke: colorScale[0], strokeWidth: 2 } }}
                            data={newFormattedTvlData}
                        />
                        <VictoryAxis dependentAxis />
                        <VictoryAxis
                            style={{
                                axis: { stroke: 'transparent' },
                                ticks: { stroke: 'transparent' },
                                tickLabels: { fill: 'transparent' },
                            }}
                        />
                    </VictoryChart>
                </div>
            )}
            {analyticsType === 'fees' && (
                <VictoryChart
                    theme={VybeThemeAnalytics}
                    scale={{ x: 'time' }}
                    width={chartWidth}
                    height={chartHeight}
                    containerComponent={
                        <VictoryZoomVoronoiContainer
                            voronoiDimension="x"
                            zoomDimension="x"
                            labels={(label: any) => " "}
                            labelComponent={
                                <VictoryTooltip flyoutComponent={<AnalyticsTooltip title='Fees'/>} constrainToVisibleArea/>
                            }
                        />
                    }
                >
                    <VictoryBar
                        barRatio={0.9}
                        style={{
                            data: { fill: '#6DC6C1' },
                        }}
                        data={newFormattedFees}
                    />
                    <VictoryAxis dependentAxis />
                    <VictoryAxis
                        style={{
                            axis: { stroke: 'transparent' },
                            ticks: { stroke: 'transparent' },
                            tickLabels: { fill: 'transparent' },
                        }}
                    />
                </VictoryChart>
            )}
            {analyticsType === 'liquidity' && (
                <MarketLiquidity
                    bids={bidsData}
                    asks={asksData}
                    baseCurrency={baseCurrency}
                    quoteCurrency={quoteCurrency}
                    totalLiquidity={liquidity}
                />
            )}
        </div>
    );
};

export default Analytics;
