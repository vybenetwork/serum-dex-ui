import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';
import { titleStyle } from 'utils/styles';
import './SubHeader.less';
import Modal from 'components/atoms/Modal/Modal';
import Input from 'components/atoms/Input/Input';
import { Row, Col } from 'components/atoms/Grid/Grid';
import ScrollableList from 'components/molecules/ScrollableList/ScrollableList';
import ButtonGroup from 'components/molecules/ButtonGroup/ButtonGroup';
import { CaretDownOutlined } from '@ant-design/icons';
import VerticalDivider from 'components/atoms/VerticalDivider/VerticalDivider';
import { FaSearch } from 'react-icons/fa';
import { useQuery } from 'react-query';
import { gqlMarketVolumeData, gqlMarketStatsByAddress } from 'requests';
import { useState } from 'react';
import { sendMixPanelEvent, useWindowDimensions } from 'utils/index';
import { MIX_PANEL_EVENTS } from 'utils/mixPanelEvents';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';
import { useMarket } from 'utils/context';
import Switch from 'components/atoms/Switch/Switch';
import { FaInfoCircle } from 'react-icons/fa';
import Tooltip from 'components/atoms/Tooltip/Tooltip';

interface SubHeaderProps {
    marketName: any;
    marketAddress: string;
    setMarketName: any;
    setMarketAddress: any;
    price: string;
    baseVolume: any;
    quoteVolume: any;
}

function SubHeader({
    marketName,
    marketAddress,
    setMarketAddress,
    setMarketName,
    price,
    baseVolume,
    quoteVolume,
}: SubHeaderProps) {
    const [selected, setSelected] = useState<string>('ALL');
    const [marketSelectInput, setMarketSelectInput] = useState<string>('');
    const [visible, setVisible] = useState(false);
    const [marketFilterSwitch, setMarketFilterSwitch] = useState<boolean>(false);
    const { baseMintAddress } = useMarket();

    const { data } = useQuery(['market_volume_stats', marketAddress], async () => gqlMarketVolumeData(marketAddress));

    const marketStats = useQuery(['market_stats_by_address', marketAddress], async () =>
        gqlMarketStatsByAddress(marketAddress),
    );

    const { width } = useWindowDimensions();

    return (
        <div>
            {width >= 768 ? (
                <div className="vybe-subheader">
                    <div className="titles-subheader">
                        <Modal
                            buttonChildren={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                                    <div
                                        style={{
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            fontSize: '16px',
                                        }}
                                    >
                                        {marketName ? (
                                            <div className="subheader__asset_wrapper">
                                                <div className="subheader__asset_wrapper">
                                                    <div className="subheader__asset_icon_wrapper">
                                                        <TokenIcon
                                                            mint={baseMintAddress}
                                                            className="subheader__asset_icon"
                                                        />
                                                    </div>
                                                    <div className="subheader__asset_icon--text">{marketName}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            'Select Market'
                                        )}
                                    </div>
                                    <div className="subheader__down_icon_wrapper">
                                        <CaretDownOutlined className="subheader__down_icon" />
                                    </div>
                                </div>
                            }
                            buttonStyle={{ height: '7vh', borderRadius: '0px' }}
                            buttonType="default"
                            footer={null}
                            className="market-select-modal"
                            visible={visible}
                            setVisible={setVisible}
                            onModalOpen={() => {
                                sendMixPanelEvent(MIX_PANEL_EVENTS.MARKET_SELECTOR_CLICKED.name);
                            }}
                        >
                            <div className="subheader__modal_switch_container">
                                <Switch
                                    checked={marketFilterSwitch}
                                    className="subheader__modal_switch"
                                    onChange={() => setMarketFilterSwitch(!marketFilterSwitch)}
                                />
                                <div className="subheader__modal_switch_text">Show All</div>
                                <Tooltip
                                    placement="bottom"
                                    title={
                                        <div className="subheader__modal_tooltip_text">
                                            Markets with low volume are hidden by default
                                        </div>
                                    }
                                    color="rgba(32, 37, 51, 1)"
                                    className="subheader__market_display_tooltip"
                                >
                                    <FaInfoCircle className="subheader__modal_info_icon" />
                                </Tooltip>
                            </div>
                            <Input
                                placeholder="Search by token name"
                                style={{
                                    textAlign: 'left',
                                    height: '40px',
                                    borderRadius: '0px',
                                    border: '0.25px solid rgba(255, 255, 255, 0.3)',
                                    color: 'rgba(255, 255, 255, 1)',
                                    fontFamily: 'Open Sans',
                                    fontWeight: '400',
                                    background: 'transparent',
                                }}
                                value={marketSelectInput}
                                className="subheader__market_select_input"
                                suffix={<FaSearch style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
                                onChange={(e: any) => setMarketSelectInput(e.target.value)}
                            />
                            <Row style={{ width: '100%', justifyContent: 'space-between', margin: '2vh 0' }}>
                                <Col xs={24}>
                                    <ButtonGroup
                                        values={[
                                            { value: 'ALL', label: 'ALL' },
                                            { value: 'SOL', label: 'SOL' },
                                            { value: 'USDC', label: 'USDC' },
                                            { value: 'USDT', label: 'USDT' },
                                            { value: 'SRM', label: 'SRM' },
                                            { value: 'BTC', label: 'BTC' },
                                            { value: 'ETH', label: 'ETH' },
                                        ]}
                                        group="marketSelect"
                                        selected={selected}
                                        setSelected={setSelected}
                                    />
                                </Col>
                            </Row>
                            <ScrollableList
                                color="white"
                                setMarketAddress={setMarketAddress}
                                setMarketName={setMarketName}
                                selected={selected}
                                marketSelectInput={marketSelectInput}
                                visible={visible}
                                setVisible={setVisible}
                                allMarketsVisible={marketFilterSwitch}
                            />
                        </Modal>
                        <VerticalDivider />
                        <div>
                            <Title
                                level={5}
                                style={{
                                    color:
                                        marketStats?.data?.data?.data?.api_serum_dex_m &&
                                        marketStats?.data?.data?.data?.api_serum_dex_m?.marketStatsByMarketAddress
                                            ?.priceChange > 0
                                            ? '#45C493'
                                            : '#FF5C5C',
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    fontFamily: 'Inconsolata',
                                    textAlign: 'center',
                                    margin: '0.5vh 1rem 0vh',
                                }}
                            >
                                {price !== 'Loading...'
                                    ? Number(price).toFixed(2) + ` ${marketName.split('/')[1]}`
                                    : '-'}
                            </Title>
                        </div>
                        <VerticalDivider />
                        <div>
                            <Title level={5} style={titleStyle}>
                                24H Change
                            </Title>
                            <Title
                                level={5}
                                style={{
                                    color:
                                        marketStats?.data?.data?.data?.api_serum_dex_m &&
                                        marketStats?.data?.data.data.api_serum_dex_m?.marketStatsByMarketAddress
                                            ?.priceChange > 0
                                            ? '#45C493'
                                            : '#FF5C5C',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    fontFamily: 'Inconsolata',
                                    textAlign: 'left',
                                    margin: '0.5vh 1rem 0vh',
                                }}
                            >
                                {marketStats?.data?.data?.data?.api_serum_dex_m
                                    ? marketStats?.data.data.data.api_serum_dex_m?.marketStatsByMarketAddress?.priceChange?.toFixed(
                                          2,
                                      ) + `%`
                                    : '-'}
                            </Title>
                        </div>
                        <VerticalDivider />
                        <div>
                            <Title level={5} style={titleStyle}>
                                24H High
                            </Title>
                            <Title
                                level={5}
                                style={{
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    fontFamily: 'Inconsolata',
                                    textAlign: 'left',
                                    margin: '0.5vh 1rem 0vh',
                                }}
                            >
                                {data?.data?.data?.api_serum_dex_m?.ohlcvfValuesByMarketAddress?.h?.[0]
                                    ? data?.data.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.h[0].toFixed(2) +
                                      ` ${marketName.split('/')[1]}`
                                    : '-'}
                            </Title>
                        </div>
                        <VerticalDivider />
                        <div>
                            <Title level={5} style={titleStyle}>
                                24H Low
                            </Title>
                            <Title
                                level={5}
                                style={{
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    fontFamily: 'Inconsolata',
                                    textAlign: 'left',
                                    margin: '0.5vh 1rem 0vh',
                                }}
                            >
                                {data?.data?.data?.api_serum_dex_m?.ohlcvfValuesByMarketAddress?.l?.[0]
                                    ? data?.data.data.api_serum_dex_m.ohlcvfValuesByMarketAddress.l[0].toFixed(2) +
                                      ` ${marketName.split('/')[1]}`
                                    : '-'}
                            </Title>
                        </div>
                        <VerticalDivider />
                        <div>
                            <Title level={5} style={titleStyle}>
                                24H Volume Base
                            </Title>
                            <Title
                                level={5}
                                style={{
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    fontFamily: 'Inconsolata',
                                    textAlign: 'left',
                                    margin: '0.5vh 1rem 0vh',
                                }}
                            >
                                {baseVolume && baseVolume !== '-'
                                    ? baseVolume.toLocaleString('en-US') + ' ' + marketName.split('/')[0]
                                    : '-'}
                            </Title>
                        </div>
                        <VerticalDivider />
                        <div>
                            <Title level={5} style={titleStyle}>
                                24H Volume Quote
                            </Title>
                            <Title
                                level={5}
                                style={{
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    fontFamily: 'Inconsolata',
                                    textAlign: 'left',
                                    margin: '0.5vh 1rem 0vh',
                                }}
                            >
                                {quoteVolume && quoteVolume !== '-'
                                    ? quoteVolume.toLocaleString('en-US') + ' ' + marketName.split('/')[1]
                                    : '-'}
                            </Title>
                        </div>
                        <VerticalDivider />
                    </div>
                    {/* <div className="market-dropdown-subheader">
                        <Row style={{ width: '100%' }}>
                            <Col xs={8} style={{ placeSelf: 'center', textAlign: 'center' }}>
                                <FaDiscord style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </Col>
                            <Col xs={8} style={{ placeSelf: 'center', textAlign: 'center' }}>
                                <FaTwitter style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </Col>
                            <Col xs={8} style={{ placeSelf: 'center', textAlign: 'center' }}>
                                <FaGlobe style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </Col>
                        </Row>
                    </div> */}
                </div>
            ) : (
                <div>
                    <div className="vybe-subheader">
                        <div className="titles-subheader">
                            <Modal
                                buttonChildren={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
                                        <div
                                            style={{
                                                fontFamily: 'Inconsolata',
                                                color: 'rgba(255, 255, 255, 0.85)',
                                                fontSize: '16px',
                                            }}
                                        >
                                            {marketName ? (
                                                <div className="subheader__asset_wrapper">
                                                    <div className="subheader__asset_wrapper">
                                                        <div className="subheader__asset_icon_wrapper">
                                                            <TokenIcon
                                                                mint={baseMintAddress}
                                                                className="subheader__asset_icon"
                                                            />
                                                        </div>
                                                        <div className="subheader__asset_icon--text">{marketName}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                'Select Market'
                                            )}
                                        </div>
                                        <div className="subheader__down_icon_wrapper">
                                            <CaretDownOutlined className="subheader__down_icon" />
                                        </div>
                                    </div>
                                }
                                buttonStyle={{ height: '100%', borderRadius: '0px' }}
                                buttonType="default"
                                footer={null}
                                className="market-select-modal"
                                visible={visible}
                                setVisible={setVisible}
                            >
                                <div className="subheader__modal_switch_container">
                                    <Switch
                                        checked={marketFilterSwitch}
                                        className="subheader__modal_switch"
                                        onChange={() => setMarketFilterSwitch(!marketFilterSwitch)}
                                    />
                                    <div className="subheader__modal_switch_text">Show All</div>
                                    <Tooltip
                                        placement="bottom"
                                        title="Markets with low volume are hidden by default"
                                        color="rgba(32, 37, 51, 1)"
                                        className="subheader__market_display_tooltip"
                                    >
                                        <FaInfoCircle className="subheader__modal_info_icon" />
                                    </Tooltip>
                                </div>
                                <Input
                                    placeholder="Search by token name"
                                    style={{
                                        textAlign: 'left',
                                        height: '40px',
                                        borderRadius: '0px',
                                        border: '0.25px solid rgba(255, 255, 255, 0.3)',
                                        color: 'rgba(255, 255, 255, 1)',
                                        fontFamily: 'Open Sans',
                                        fontWeight: '400',
                                        background: 'transparent',
                                    }}
                                    value={marketSelectInput}
                                    className="subheader__market_select_input"
                                    suffix={<FaSearch style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
                                    onChange={(e: any) => setMarketSelectInput(e.target.value)}
                                />
                                <Row style={{ width: '100%', justifyContent: 'space-between', margin: '1rem 0' }}>
                                    <Col xs={24}>
                                        <ButtonGroup
                                            values={[
                                                { value: 'ALL', label: 'ALL' },
                                                { value: 'SOL', label: 'SOL' },
                                                { value: 'USDC', label: 'USDC' },
                                                { value: 'USDT', label: 'USDT' },
                                                { value: 'SRM', label: 'SRM' },
                                                { value: 'BTC', label: 'BTC' },
                                                { value: 'ETH', label: 'ETH' },
                                            ]}
                                            group="marketSelect"
                                            selected={selected}
                                            setSelected={setSelected}
                                        />
                                    </Col>
                                </Row>
                                <ScrollableList
                                    color="white"
                                    setMarketAddress={setMarketAddress}
                                    setMarketName={setMarketName}
                                    selected={selected}
                                    marketSelectInput={marketSelectInput}
                                    visible={visible}
                                    setVisible={setVisible}
                                    allMarketsVisible={marketFilterSwitch}
                                />
                            </Modal>
                            <VerticalDivider />
                            <div>
                                <Title
                                    level={5}
                                    style={{
                                        color:
                                            marketStats?.data?.data?.data?.api_serum_dex_m &&
                                            marketStats?.data?.data.data.api_serum_dex_m?.marketStatsByMarketAddress
                                                ?.priceChange > 0
                                                ? '#45C493'
                                                : '#FF5C5C',
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        fontFamily: 'Inconsolata',
                                        textAlign: 'center',
                                        margin: '0.5vh 1rem 0vh',
                                    }}
                                >
                                    {price !== 'Loading...'
                                        ? Number(price).toFixed(2) + ` ${marketName.split('/')[1]}`
                                        : '-'}
                                </Title>
                            </div>
                            <VerticalDivider />
                            <div>
                                <Title level={5} style={titleStyle}>
                                    24H Change
                                </Title>
                                <Title
                                    level={5}
                                    style={{
                                        color:
                                            marketStats?.data?.data?.data?.api_serum_dex_m &&
                                            marketStats?.data?.data.data.api_serum_dex_m?.marketStatsByMarketAddress
                                                ?.priceChange > 0
                                                ? '#45C493'
                                                : '#FF5C5C',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        fontFamily: 'Inconsolata',
                                        textAlign: 'left',
                                        margin: '0.5vh 1rem 0vh',
                                    }}
                                >
                                    {marketStats?.data?.data?.data?.api_serum_dex_m
                                        ? marketStats?.data.data.data.api_serum_dex_m.marketStatsByMarketAddress.priceChange.toFixed(
                                              2,
                                          ) + `%`
                                        : '-'}
                                </Title>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubHeader;
