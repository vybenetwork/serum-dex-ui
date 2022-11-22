import { Row, Col } from 'components/atoms/Grid/Grid';
import { List } from 'antd';
import './ScrollableList.less';
import { useQuery } from 'react-query';
import { gqlMarketStats } from 'requests/index';
import { useEffect, useState } from 'react';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';
import { Link } from 'react-router-dom';
import { useMarket } from 'utils/context';
import { sendMixPanelEvent } from 'utils';
import { MIX_PANEL_EVENTS } from 'utils/mixPanelEvents';

interface ScrollableListProps {
    color?: string;
    setMarketName: any;
    setMarketAddress: any;
    selected: string;
    marketSelectInput: string;
    visible: any;
    setVisible: any;
    allMarketsVisible: boolean;
}

function ScrollableList({
    color,
    setMarketName,
    setMarketAddress,
    selected,
    marketSelectInput,
    visible,
    setVisible,
    allMarketsVisible,
}: ScrollableListProps) {
    const marketData = useQuery('market_stats', gqlMarketStats);
    const [listData, setListData] = useState<any>([]);
    const [sortedListData, setSortedListData] = useState<any>([]);
    const [sortSelected, setSortSelected] = useState(false);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('');

    // Depending on what is selected, we need to push different marketData to listData
    useEffect(() => {
        const generateListData = () => {
            // TODO:
            // - Initially render only markets with at least a price greater than 0.005
            // - Add stateful radio button that toggles between all markets and high volume markets
            if (selected === 'ALL' && marketData?.data?.data?.data?.api_serum_dex_m && !sortSelected) {
                let listData = [];

                // Looping through the marketData object to build our listData array
                for (let i = 0; i < marketData?.data?.data?.data?.api_serum_dex_m?.marketStats?.length; i++) {
                    // If statement that filters based on the search input
                    if (
                        marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName
                            .toLowerCase()
                            .includes(marketSelectInput.toLowerCase())
                    ) {
                        // If statement to limit the amount of items in the list
                        if (listData.length > 200) {
                            break;
                        } else {
                            // TODO: Check visibility for all markets, if true display all else do what we norm do
                            if (!allMarketsVisible) {
                                if (marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].price > 0.005) {
                                    // Pushing required list data to the listData array
                                    listData.push({
                                        baseMint: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].baseMint,
                                        name: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName,
                                        lastPrice: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].price,
                                        change: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i]
                                            .priceChange,
                                        address:
                                            marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketAddress,
                                    });
                                }
                            } else {
                                // Pushing required list data to the listData array
                                listData.push({
                                    baseMint: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].baseMint,
                                    name: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName,
                                    lastPrice: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].price,
                                    change: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].priceChange,
                                    address: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketAddress,
                                });
                            }
                        }
                    }
                }
                // Setting the listData array statefully
                setListData(listData);
            } else if (selected !== 'ALL' && marketData?.data?.data?.data?.api_serum_dex_m && !sortSelected) {
                let listData = [];

                // Looping through the marketData object to build our listData array
                for (let i = 0; i < marketData?.data?.data?.data?.api_serum_dex_m?.marketStats?.length; i++) {
                    if (
                        // If statement that filters based on the selected button from the button group
                        (marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName.startsWith(
                            `${selected}/`,
                        ) ||
                            marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName.endsWith(
                                `/${selected}`,
                            )) &&
                        // If statement that filters based on the search input
                        marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName
                            .toLowerCase()
                            .includes(marketSelectInput.toLowerCase())
                    ) {
                        // If statement to limit the amount of items in the list
                        if (listData.length > 200) {
                            break;
                        } else {
                            if (!allMarketsVisible) {
                                if (marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].price > 0.005) {
                                    // Pushing required list data to the listData array
                                    listData.push({
                                        baseMint: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].baseMint,
                                        name: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName,
                                        lastPrice: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].price,
                                        change: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i]
                                            .priceChange,
                                        address:
                                            marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketAddress,
                                    });
                                }
                            } else {
                                // Pushing required list data to the listData array
                                listData.push({
                                    baseMint: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].baseMint,
                                    name: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketName,
                                    lastPrice: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].price,
                                    change: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].priceChange,
                                    address: marketData?.data?.data?.data?.api_serum_dex_m.marketStats[i].marketAddress,
                                });
                            }
                        }
                    }
                }
                // Setting the listData array statefully
                setListData(listData);
            }
        };
        generateListData();
    }, [selected, marketSelectInput, marketData?.data?.data?.data?.api_serum_dex_m, allMarketsVisible, sortSelected]);

    const sortListData = (direction: string, column: string) => {
        if (column === 'market') {
            setSortColumn('market');
            let sortedData = listData.sort(function (a: any, b: any) {
                let textA = a.name.toUpperCase();
                let textB = b.name.toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
            if (direction === 'up') {
                setSortedListData(sortedData);
                setSortSelected(true);
            } else if (direction === 'down') {
                let reverseSortedData = [...sortedData].reverse();
                setSortedListData(reverseSortedData);
                setSortSelected(true);
            } else {
                setSortedListData([]);
                setSortSelected(false);
            }
        }

        if (column === 'change') {
            setSortColumn('change');
            let sortedData = listData.sort((a: any, b: any) => a.change - b.change);
            if (direction === 'up') {
                let reverseSortedData = [...sortedData].reverse();
                setSortedListData(reverseSortedData);
                setSortSelected(true);
            } else {
                setSortedListData(sortedData);
                setSortSelected(true);
            }
        }

        if (column === 'price') {
            setSortColumn('price');
            let sortedData = listData.sort((a: any, b: any) => a.lastPrice - b.lastPrice);
            if (direction === 'up') {
                let reverseSortedData = [...sortedData].reverse();
                setSortedListData(reverseSortedData);
                setSortSelected(true);
            } else {
                setSortedListData(sortedData);
                setSortSelected(true);
            }
        }
    };

    return (
        <div>
            <div style={{ padding: '0px 0px 0.5rem' }}>
                <Row style={{ width: '100%' }}>
                    <Col
                        xs={8}
                        style={{
                            fontFamily: 'Inconsolata',
                            fontSize: '14px',
                            textAlign: 'left',
                            display: 'flex',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 'bold',
                        }}
                    >
                        <div
                            style={{ cursor: 'pointer', display: 'flex' }}
                            onClick={() => {
                                if (sortColumn !== 'market') {
                                    sortListData('down', 'market');
                                    setSortDirection('down');
                                } else if (sortColumn === 'market' && sortDirection === 'none') {
                                    sortListData('down', 'market');
                                    setSortDirection('down');
                                } else if (sortColumn === 'market' && sortDirection === 'down') {
                                    sortListData('up', 'market');
                                    setSortDirection('up');
                                } else if (sortColumn === 'market' && sortDirection === 'up') {
                                    setSortSelected(false);
                                    setSortColumn('');
                                    setSortDirection('');
                                }
                            }}
                        >
                            Market
                            {sortDirection === '' || sortColumn !== 'market' ? (
                                <div className="scrollable_list__sort_icons_wrapper">
                                    <CaretUpOutlined
                                        style={{
                                            fontSize: '12px',
                                            paddingTop: '2px',
                                            verticalAlign: 'bottom',
                                            height: '10px',
                                        }}
                                    />
                                    <CaretDownOutlined
                                        style={{ fontSize: '12px', verticalAlign: 'top', height: '12px' }}
                                    />
                                </div>
                            ) : sortColumn === 'market' && sortDirection === 'up' ? (
                                <div className="scrollable_list__sort_icons_wrapper">
                                    <CaretUpOutlined
                                        style={{
                                            fontSize: '12px',
                                            paddingTop: '6px',
                                            verticalAlign: 'bottom',
                                            height: '10px',
                                        }}
                                    />
                                </div>
                            ) : (
                                sortColumn === 'market' &&
                                sortDirection === 'down' && (
                                    <div className="scrollable_list__sort_icons_wrapper">
                                        <CaretDownOutlined
                                            style={{
                                                fontSize: '12px',
                                                verticalAlign: 'top',
                                                height: '10px',
                                                paddingTop: '6px',
                                            }}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    </Col>
                    <Col
                        xs={8}
                        style={{
                            fontFamily: 'Inconsolata',
                            fontSize: '14px',
                            textAlign: 'center',
                            display: 'flex',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: 'bold',
                            placeContent: 'center',
                        }}
                    >
                        <div
                            style={{ cursor: 'pointer', display: 'flex' }}
                            onClick={() => {
                                if (sortColumn !== 'price') {
                                    sortListData('down', 'price');
                                    setSortDirection('down');
                                } else if (sortColumn === 'price' && sortDirection === 'none') {
                                    sortListData('down', 'price');
                                    setSortDirection('down');
                                } else if (sortColumn === 'price' && sortDirection === 'down') {
                                    sortListData('up', 'price');
                                    setSortDirection('up');
                                } else if (sortColumn === 'price' && sortDirection === 'up') {
                                    setSortSelected(false);
                                    setSortColumn('');
                                    setSortDirection('');
                                }
                            }}
                        >
                            Last Price
                            {sortDirection === '' || sortColumn !== 'price' ? (
                                <div className="scrollable_list__sort_icons_wrapper">
                                    <CaretUpOutlined
                                        style={{
                                            fontSize: '12px',
                                            paddingTop: '2px',
                                            verticalAlign: 'bottom',
                                            height: '10px',
                                        }}
                                    />
                                    <CaretDownOutlined
                                        style={{ fontSize: '12px', verticalAlign: 'top', height: '12px' }}
                                    />
                                </div>
                            ) : sortColumn === 'price' && sortDirection === 'up' ? (
                                <div className="scrollable_list__sort_icons_wrapper">
                                    <CaretUpOutlined
                                        style={{
                                            fontSize: '12px',
                                            paddingTop: '6px',
                                            verticalAlign: 'bottom',
                                            height: '10px',
                                        }}
                                    />
                                </div>
                            ) : (
                                sortColumn === 'price' &&
                                sortDirection === 'down' && (
                                    <div className="scrollable_list__sort_icons_wrapper">
                                        <CaretDownOutlined
                                            style={{
                                                fontSize: '12px',
                                                verticalAlign: 'top',
                                                height: '10px',
                                                paddingTop: '6px',
                                            }}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    </Col>
                    <Col
                        xs={8}
                        style={{
                            fontFamily: 'Inconsolata',
                            fontSize: '14px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.5)',
                            display: 'flex',
                            fontWeight: 'bold',
                            placeContent: 'end',
                        }}
                    >
                        <div
                            style={{ cursor: 'pointer', display: 'flex' }}
                            onClick={() => {
                                if (sortColumn !== 'change') {
                                    sortListData('down', 'change');
                                    setSortDirection('down');
                                } else if (sortColumn === 'change' && sortDirection === 'none') {
                                    sortListData('down', 'change');
                                    setSortDirection('down');
                                } else if (sortColumn === 'change' && sortDirection === 'down') {
                                    sortListData('up', 'change');
                                    setSortDirection('up');
                                } else if (sortColumn === 'change' && sortDirection === 'up') {
                                    setSortSelected(false);
                                    setSortColumn('');
                                    setSortDirection('');
                                }
                            }}
                        >
                            24H Change
                            {sortDirection === '' || sortColumn !== 'change' ? (
                                <div className="scrollable_list__sort_icons_wrapper">
                                    <CaretUpOutlined
                                        style={{
                                            fontSize: '12px',
                                            paddingTop: '2px',
                                            verticalAlign: 'bottom',
                                            height: '10px',
                                        }}
                                    />
                                    <CaretDownOutlined
                                        style={{ fontSize: '12px', verticalAlign: 'top', height: '12px' }}
                                    />
                                </div>
                            ) : sortColumn === 'change' && sortDirection === 'up' ? (
                                <div className="scrollable_list__sort_icons_wrapper">
                                    <CaretUpOutlined
                                        style={{
                                            fontSize: '12px',
                                            paddingTop: '6px',
                                            verticalAlign: 'bottom',
                                            height: '10px',
                                        }}
                                    />
                                </div>
                            ) : (
                                sortColumn === 'change' &&
                                sortDirection === 'down' && (
                                    <div className="scrollable_list__sort_icons_wrapper">
                                        <CaretDownOutlined
                                            style={{
                                                fontSize: '12px',
                                                verticalAlign: 'top',
                                                height: '10px',
                                                paddingTop: '6px',
                                            }}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    </Col>
                </Row>
            </div>
            <div className="scrollable_list__list_wrapper">
                <List
                    dataSource={sortSelected ? sortedListData : listData}
                    renderItem={(item: any, index: number) => (
                        <List.Item key={index}>
                            <Link to={`/trade/${item.address}`} style={{ width: '100%' }}>
                                <Row
                                    className="vybe-market-select-row"
                                    style={{ width: '100%', background: '#202533', padding: '8px' }}
                                    onClick={() => {
                                        setMarketAddress(item.address);
                                        setMarketName(item.name);
                                        sendMixPanelEvent(MIX_PANEL_EVENTS.MARKET_CHANGED.name, {
                                            address: item.address,
                                            name: item.name,
                                        });
                                        setVisible(false);
                                    }}
                                >
                                    <Col
                                        xs={8}
                                        style={{
                                            textAlign: 'left',
                                            color: color ? color : 'white',
                                            fontFamily: 'Inconsolata',
                                            fontSize: '16px',
                                            letterSpacing: '0.1rem',
                                        }}
                                    >
                                        <div className="scrollable_list__asset_wrapper">
                                            <TokenIcon mint={item.baseMint} className="scrollable_list__asset_icon" />
                                            <div>{item.name}</div>
                                        </div>
                                    </Col>
                                    <Col
                                        xs={8}
                                        style={{
                                            textAlign: 'center',
                                            color: String(item.change).indexOf('-') === -1 ? '#45C493' : '#FF5C5C',
                                            fontFamily: 'Inconsolata',
                                            fontSize: '16px',
                                            letterSpacing: '0.1rem',
                                        }}
                                    >
                                        {item.lastPrice.toFixed(2)}
                                    </Col>
                                    <Col
                                        xs={8}
                                        style={{
                                            textAlign: 'right',
                                            color: String(item.change).indexOf('-') === -1 ? '#45C493' : '#FF5C5C',
                                            fontFamily: 'Inconsolata',
                                            fontSize: '16px',
                                            letterSpacing: '0.1rem',
                                        }}
                                    >
                                        {item.change.toFixed(2) + '%'}
                                    </Col>
                                </Row>
                            </Link>
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
}

export default ScrollableList;
