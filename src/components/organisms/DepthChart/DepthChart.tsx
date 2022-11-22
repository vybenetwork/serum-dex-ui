import { useEffect, useState } from 'react';
import { Row } from 'components/atoms/Grid/Grid';
import { LoadingOutlined } from '@ant-design/icons';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useWindowDimensions } from 'utils';
import './DepthChart.less';

interface DepthChartProps {
    bidsData: any,
    asksData: any,
    marketAddress: string,
}

const DepthChart = ({
    bidsData,
    asksData,
    marketAddress
  }: DepthChartProps) => {

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
    }, [marketAddress]);

    useEffect(() => {
        setLoading(false);
    }, [bidsData, asksData]);

    let plotValue = 1;

    if (asksData.length > 0) {
        plotValue = asksData[0][0];
    }

    const { height } = useWindowDimensions();
    let chartHeight = (0.458 * height) + 'px';

    // Event to add zooming
    // Highcharts.addEvent(
    //     chart.container,
    //     document.onmousewheel === undefined ? 'DOMMouseScroll' : 'mousewheel',
    //     function(event) {
    //       const axis = chart.xAxis[0],
    //         extremes = axis.getExtremes(),
    //         min = extremes.min,
    //         max = extremes.max,
    //         range = max - min,
    //         precision = range / 150,
    //         e = chart.pointer.normalize(event);
  
    //       let delta = e.deltaY,
    //         prevent = true;
  
    //       if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
    //         const proportion = (e.chartX - chart.plotLeft) / chart.plotWidth;
    //         axis.setExtremes(min + proportion * delta * precision, max)
  
    //         // Crosshair handling logic
    //         chart.yAxis.forEach(axis => {
    //           if (!(axis.pos < e.chartY && axis.pos + axis.len > e.chartY) && chart.hoverPoint && axis.cross) {
    //             delete axis.cross.e
    //           }
    //         })
  
    //         if (prevent) {
    //           if (e) {
    //             if (e.preventDefault) {
    //               e.preventDefault();
    //             }
    //             if (e.stopPropagation) {
    //               e.stopPropagation();
    //             }
    //             e.cancelBubble = true;
    //           }
    //         }
    //       }
    //     }
    //   );

    const options = {
        chart: {
            type: 'area',
            zoomType: 'x',
            height: chartHeight,
            backgroundColor: {
                linearGradient: [500, 500, 500, 0],
                stops: [
                    [0, '#13161E'],
                    [1, '#13161E']
                ]
            },
        },
        xAxis: {
            minPadding: 0,
            maxPadding: 0,
            lineColor: 'rgba(255, 255, 255, 0.2)',
            plotLines: [{
                color: 'rgba(255, 255, 255, 0.2)',
                value: plotValue,
                width: 1,
                label: {
                    text: 'Actual price',
                    rotation: 90,
                    style: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontWeight: 'bold',
                        fontFamily: 'Inconsolata'
                    }
                }
            }],
            title: {
                text: 'Price',
                style: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: 'bold',
                    fontFamily: 'Inconsolata'
                }
            },
            tickColor: 'rgba(255, 255, 255, 0.2)'
        },
        yAxis: [{
            lineWidth: 1,
            lineColor: 'rgba(255, 255, 255, 0.2)',
            gridLineWidth: 1,
            gridLineColor: 'rgba(255, 255, 255, 0.2)',
            title: null,
            tickWidth: 1,
            tickLength: 5,
            tickColor: 'rgba(255, 255, 255, 0.2)',
            tickPosition: 'inside',
            labels: {
                align: 'left',
                x: 8
            }
        }, {
            opposite: true,
            linkedTo: 0,
            lineWidth: 1,
            gridLineWidth: 0,
            lineColor: 'rgba(255, 255, 255, 0.2)',
            title: null,
            tickWidth: 1,
            tickLength: 5,
            tickColor: 'rgba(255, 255, 255, 0.2)',
            tickPosition: 'inside',
            labels: {
                align: 'right',
                x: -8
            }
        }],
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillOpacity: 0.4,
                lineWidth: 1,
                step: 'center'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size=10px;">Price: {point.key}</span><br/>',
            valueDecimals: 2
        },
        series: [{
            name: 'Bids',
            data: typeof(bidsData) !== "undefined" ? bidsData : [],
            color: '#45C493'
        }, {
            name: 'Asks',
            data: typeof(asksData) !== "undefined" ? asksData : [],
            color: '#FF5C5C',
        }]
    }

    return !loading ? (
        <div style={{ height: '47.5vh' }}>
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                
            />
        </div>
    )
    :
    (
        <div className="depth_chart__loading_wrapper">
            <Row className='depth_chart__loading_row'>
                <LoadingOutlined className='depth_chart__loading_icon'/> 
            </Row>
            <Row className='depth_chart__loading_row--title'>
                <Title className='depth_chart__loading_title'>Loading</Title>
            </Row>
        </div>
    );
}

export default DepthChart;