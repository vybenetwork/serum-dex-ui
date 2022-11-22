import { gql } from '@apollo/client';
import { client } from './apollo/client';
import { convertChartIntervalToUnix, roundDownUnixTime } from 'utils/chartingFunctions';

const supportedResolutions: Array<'1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '1D'> = [
    '1',
    '3',
    '5',
    '15',
    '30',
    '60',
    '120',
    '240',
    '1D',
];

export const config = {
    supported_resolutions: supportedResolutions,
};

const GET_CHART_DATA = gql`
    query GetOhlcvfByMarketAddress($resolution: String!, $to: Float!, $from: Float!, $marketAddress: String!) {
        api_serum_dex_m {
            ohlcvfValuesByMarketAddress(resolution: $resolution, to: $to, from: $from, marketAddress: $marketAddress) {
                t
                o
                h
                l
                c
                v
                f
            }
        }
    }
`;

type Config = {
    supported_resolutions: Array<'1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '1D'>;
};

type Bar = {
    time: number;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
};

export default class DateFeed {
    intervalID: number | null;
    prevIntervalID: number | null;
    marketAddress: string;
    isRunning: boolean;
    constructor(marketAddress: string) {
        this.marketAddress = marketAddress;
        this.intervalID = null;
        this.prevIntervalID = this.intervalID;
        this.isRunning = false;
    }

    onReady(cb: (config: Config) => void) {
        // console.log('=====onReady running=====', new Date(), Date.now())
        setTimeout(() => cb(config), 0);
    }

    searchSymbols(
        userInput: string,
        exchange: string,
        symbolType: string,
        onResultReadyCallback: (result: []) => void,
    ) {
        // console.log('====Search Symbols running=====')
    }

    resolveSymbol(
        symbolName: string,
        onSymbolResolvedCallback: (symbolInfo: any) => void,
        onResolveErrorCallback: (reason: any) => void,
    ) {
        // expects a symbolInfo object in response
        // console.log('======resolveSymbol running=====')
        const split_data = symbolName.split(/[:/]/);

        const symbol_stub = {
            name: symbolName,
            description: '',
            type: 'crypto',
            session: '24x7',
            timezone: 'America/Los_Angeles',
            ticker: symbolName,
            exchange: split_data[0],
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240', '1D'],
            supported_resolution: supportedResolutions,
            volume_precision: 2,
            data_status: 'streaming',
        };

        setTimeout(() => {
            onSymbolResolvedCallback(symbol_stub);
            // console.log('Resolving that symbol....', symbol_stub)
        }, 0);
        // onResolveErrorCallback('Not feeling it today')
    }

    async getBars(
        symbolInfo: any,
        resolution: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '1D',
        periodParams: { from: number; to: number; countBack: number; firstDataRequest: boolean },
        onHistoryCallback: (bars: Bar[] | [], object: { noData: boolean }) => void,
        onErrorCallback: (error: any) => void,
    ) {
        client
            .query({
                query: GET_CHART_DATA,
                variables: {
                    resolution: resolution,
                    from: roundDownUnixTime(periodParams.from),
                    to: roundDownUnixTime(periodParams.to),
                    marketAddress: this.marketAddress,
                },
                // fetchPolicy: 'cache-first',
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => {
                if (data?.api_serum_dex_m) {
                    const chartData = data?.api_serum_dex_m?.ohlcvfValuesByMarketAddress;
                    const formatted = [];
                    for (let i = 0; i < chartData.t.length; i += 1) {
                        formatted.push({
                            time: chartData.t[i] * 1000, // TradingView requires bar time in ms
                            low: chartData.l[i],
                            high: chartData.h[i],
                            open: chartData.o[i],
                            close: chartData.c[i],
                            volume: chartData.v[i],
                        });
                    }
                    return formatted;
                } else {
                    return [];
                }
            })
            .then((bars) => {
                if (bars.length) {
                    onHistoryCallback(bars, { noData: false });
                } else {
                    onHistoryCallback(bars, { noData: true });
                }
            })
            .catch((error: any) => {
                onErrorCallback(error);
            });
    }

    subscribeBars(
        symbolInfo: any,
        resolution: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '1D',
        onRealtimeCallback: (bar: Bar) => void,
        subscribeUID: {},
        onResetCacheNeededCallback: () => void,
    ) {
        // console.log('=====subscribeBars runnning=====', resolution)
        const delay = convertChartIntervalToUnix(resolution);
        this.isRunning = true;
        // this.prevIntervalID = this.intervalID
        const newIntervalID = window.setInterval(() => {
            async function fetch(marketAddress: string) {
                try {
                    const { data } = await client.query({
                        query: GET_CHART_DATA,
                        variables: {
                            resolution: resolution,
                            to: roundDownUnixTime(Math.floor(Date.now() / 1000)),
                            from: roundDownUnixTime(Math.floor((Date.now() - 30 * 60 * 1000) / 1000)),
                            marketAddress: marketAddress,
                        },
                        fetchPolicy: 'network-only',
                    });
                    if (data?.api_serum_dex_m) {
                        const chartData = data?.api_serum_dex_m?.ohlcvfValuesByMarketAddress;
                        const lastIndex = chartData?.t ? chartData?.t?.length - 1 : 0;
                        onRealtimeCallback({
                            time: chartData.t[lastIndex] * 1000, // TradingView requires bar time in ms
                            low: chartData.l[lastIndex],
                            high: chartData.h[lastIndex],
                            open: chartData.o[lastIndex],
                            close: chartData.c[lastIndex],
                            volume: chartData.v[lastIndex],
                        });
                    }
                } catch (error) {
                    // console.log('error', error)
                }
            }
            fetch(this.marketAddress);
        }, 60000);

        setTimeout(() => {
            this.prevIntervalID = this.intervalID;
            this.intervalID = newIntervalID;
        }, 0);
    }

    unsubscribeBars(subscriberUID: any) {
        // console.log('=====unsubscribeBars running=====')
        if (this.isRunning) {
            if (this.prevIntervalID) {
                clearInterval(this.prevIntervalID);
            } else if (this.intervalID) {
                clearInterval(this.intervalID);
            }
            this.isRunning = false;
        }
    }
}
