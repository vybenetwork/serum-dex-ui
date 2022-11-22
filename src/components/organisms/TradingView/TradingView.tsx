import React, { useRef, useEffect } from 'react';

import './TradingView.less';
import {
    widget,
    ChartingLibraryWidgetOptions,
    IChartingLibraryWidget,
    ResolutionString,
} from '../../../charting_library';
import Datafeed from './datafeed';

export interface ChartContainerProps {
    symbol: ChartingLibraryWidgetOptions['symbol'];
    interval: ChartingLibraryWidgetOptions['interval'];
    auto_save_delay: ChartingLibraryWidgetOptions['auto_save_delay'];
    datafeed: any;
    datafeedUrl: string;
    libraryPath: ChartingLibraryWidgetOptions['library_path'];
    chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
    chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
    clientId: ChartingLibraryWidgetOptions['client_id'];
    userId: ChartingLibraryWidgetOptions['user_id'];
    fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
    autosize: ChartingLibraryWidgetOptions['autosize'];
    studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
    theme: string;
    container: ChartingLibraryWidgetOptions['container'];
}

// Replace Apollo requests with react-query
export default function TradingView({ marketAddress, marketName }: { marketAddress: string; marketName: string }) {
    const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);

    // Props for the Chart Container
    const defaultProps = {
        symbol: 'SOL/USDC',
        // @ts-ignore
        interval: '60' as ResolutionString,
        auto_save_delay: 5,
        theme: 'Dark',
        // containerId: 'tv_chart_container', resolution: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '1D',
        time_frames: [
            { text: "1m", resolution: "1D", description: "1 Month" },
            { text: "1m", resolution: "240", description: "1 Month" },
            { text: "1m", resolution: "120", description: "1 Month" },
            { text: "2m", resolution: "60", description: "2 Months" },
            { text: "14d", resolution: "30", description: "14 Days" },
            { text: "7d", resolution: "15", description: "7 Days" },
            { text: "1d", resolution: "5", description: "1 Day" },
            { text: "1d", resolution: "3", description: "1 Day" },
            { text: "1d", resolution: "1", description: "1 Day" },
        ],
        libraryPath: '/charting_library/',
        chartsStorageApiVersion: '1.1',
        clientId: 'tradingview.com',
        userId: 'public_user_id',
        fullscreen: false,
        autosize: true,
        studiesOverrides: {},
        datafeedUrl: '',
        chartsStorageUrl: undefined,
        container: 'tv_chart_container',
    };

    useEffect(() => {
        if (tvWidgetRef.current) {
            tvWidgetRef.current.remove();
        }

        const widgetOptions: ChartingLibraryWidgetOptions = {
            symbol: marketName,
            // tslint:disable-next-line:no-any
            // @ts-ignore
            datafeed: new Datafeed(marketAddress),
            interval: defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
            // container_id: defaultProps.containerId as ChartingLibraryWidgetOptions['container_id'],
            library_path: defaultProps.libraryPath as string,
            auto_save_delay: 5,
            locale: 'en',
            disabled_features: ['use_localstorage_for_settings', 'header_compare', 'header_symbol_search'],
            enabled_features: ['header_widget'],
            load_last_chart: true,
            client_id: defaultProps.clientId,
            user_id: defaultProps.userId,
            fullscreen: defaultProps.fullscreen,
            autosize: defaultProps.autosize,
            studies_overrides: defaultProps.studiesOverrides,
            theme: defaultProps.theme === 'Dark' ? 'Dark' : 'Light',
            header_widget_buttons_mode: 'compact',
            overrides: {
                'mainSeriesProperties.candleStyle.upColor': '#45C493',
                'mainSeriesProperties.candleStyle.downColor': '#FF5C5C',
                'mainSeriesProperties.candleStyle.borderUpColor': '#45C493',
                'mainSeriesProperties.candleStyle.borderDownColor': '#FF5C5C',
                'mainSeriesProperties.candleStyle.wickUpColor': '#45C493',
                'mainSeriesProperties.candleStyle.wickDownColor': '#FF5C5C',
                'paneProperties.vertGridProperties.color': 'transparent',
                'paneProperties.horzGridProperties.color': 'transparent',
                'paneProperties.backgroundGradientStartColor': '#13161E',
                'paneProperties.backgroundGradientEndColor': '#13161E',
            },
            custom_css_url: './TradingView.less',
            toolbar_bg: 'transparent',
            loading_screen: {
                backgroundColor: 'transparent',
            },
            container: defaultProps.container,
        };

        const tvWidget = new widget(widgetOptions);
        tvWidget.onChartReady(() => {
            tvWidgetRef.current = tvWidget;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketAddress]);

    return (
        <div style={{ borderRadius: '8px', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' }}>
            <div id={defaultProps.container} className="TVChartContainer" />
        </div>
    );
}
