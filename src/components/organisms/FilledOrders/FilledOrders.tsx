import { useQuery } from 'react-query';
import { gqlMarketTradesByOOA } from 'requests/index';
import { Row, Col } from 'components/atoms/Grid/Grid';
import './FilledOrders.less';
import { useSelectedOpenOrdersAccount } from 'utils/market';
import { countDecimals } from 'utils/index';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FaInfoCircle, FaWallet } from 'react-icons/fa';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';
import { useMarket } from 'utils/context';
import ProhibitedTooltip from 'components/molecules/ProhibitedTooltip/ProhibitedTooltip';

interface TradeHistoryProps {
    marketName: string;
    isRestricted: boolean;
}

function FilledOrders({ marketName, isRestricted }: TradeHistoryProps) {
    const wallet = useWallet();
    const openOrdersAccount = useSelectedOpenOrdersAccount(true);
    const { baseMintAddress } = useMarket();

    const marketTrades = useQuery(
        ['fillsByOOA', openOrdersAccount?.address.toBase58()],
        async () => gqlMarketTradesByOOA(openOrdersAccount?.address.toBase58()!),
        { refetchInterval: 3000, enabled: !!wallet && !!openOrdersAccount?.address.toBase58() },
    );

    return (
        <div>
            {wallet.connected ? (
                <div>
                    <div style={{ height: '5vh', padding: '0 1rem' }}>
                        <Row style={{ width: '100%', height: '100%' }}>
                            <Col
                                xs={4}
                                style={{
                                    textAlign: 'left',
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    lineHeight: '5vh',
                                    fontWeight: 'bold',
                                }}
                            >
                                Market
                            </Col>
                            <Col
                                xs={3}
                                style={{
                                    textAlign: 'center',
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    lineHeight: '5vh',
                                    fontWeight: 'bold',
                                }}
                            >
                                Side
                            </Col>
                            <Col
                                xs={3}
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
                                xs={3}
                                style={{
                                    textAlign: 'center',
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    lineHeight: '5vh',
                                    fontWeight: 'bold',
                                }}
                            >
                                Price
                            </Col>
                            <Col
                                xs={3}
                                style={{
                                    textAlign: 'center',
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    lineHeight: '5vh',
                                    fontWeight: 'bold',
                                }}
                            >
                                Value
                            </Col>
                            <Col
                                xs={3}
                                style={{
                                    textAlign: 'center',
                                    fontFamily: 'Inconsolata',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    lineHeight: '5vh',
                                    fontWeight: 'bold',
                                }}
                            >
                                Fee
                            </Col>
                            <Col
                                xs={5}
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
                    <div className="trade_history__data_wrapper">
                        {marketTrades?.data?.data?.data.api_serum_dex_m?.marketTradesByOOA?.map(
                            (x: any, index: number) => (
                                <Row style={{ width: '100%' }} key={index}>
                                    <Col
                                        xs={4}
                                        style={{
                                            textAlign: 'left',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '5vh',
                                        }}
                                    >
                                        <div className="filled_orders__asset_wrapper">
                                            <div className="filled_orders__asset_icon_wrapper">
                                                <TokenIcon
                                                    mint={baseMintAddress}
                                                    className="filled_orders__asset_icon"
                                                />
                                            </div>
                                            <div className="filled_orders__asset_icon--text">{marketName}</div>
                                        </div>
                                    </Col>
                                    <Col
                                        xs={3}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: x.side === 'buy' ? '#45C493' : '#FF5C5C',
                                            lineHeight: '5vh',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {x.side}
                                    </Col>
                                    <Col
                                        xs={3}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '5vh',
                                        }}
                                    >
                                        {x.size}
                                    </Col>
                                    <Col
                                        xs={3}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '5vh',
                                        }}
                                    >
                                        {Number(countDecimals(x.price)) >= 6 ? x.price.toFixed(6) : x.price}
                                    </Col>
                                    <Col
                                        xs={3}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '5vh',
                                        }}
                                    >
                                        {(x.price * x.size).toFixed(4)}
                                    </Col>
                                    <Col
                                        xs={3}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '5vh',
                                        }}
                                    >
                                        {x.feeCost}
                                    </Col>
                                    <Col
                                        xs={5}
                                        style={{
                                            textAlign: 'right',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            lineHeight: '5vh',
                                        }}
                                    >
                                        {new Date(x.time).toLocaleDateString()}
                                    </Col>
                                </Row>
                            ),
                        )}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        height: '30vh',
                        placeContent: 'center',
                    }}
                >
                    <div
                        style={{
                            marginBottom: '1rem',
                            fontFamily: 'Inconsolata',
                            fontStyle: 'normal',
                            fontWeight: '700',
                            fontSize: '14px',
                            lineHeight: '15px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}
                    >
                        <FaInfoCircle style={{ color: 'white', fontSize: '12px' }} /> Connect your wallet to start
                        trading
                    </div>
                    {
                        isRestricted
                        ?
                        <ProhibitedTooltip />
                        :
                        <WalletMultiButton 
                            className="filled_orders__select_wallet_button" 
                            children={
                                wallet.connected ? 
                                    wallet.publicKey?.toBase58()?.slice(0, 5) + '...' + wallet.publicKey?.toBase58()?.slice(-5)
                                :
                                wallet.connecting ? 
                                    "Connecting..."
                                : 
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaWallet style={{ marginRight: '0.5rem', fontSize: '12px' }}/>
                                    Select Wallet
                                </div>
                            }
                        />
                    }
                </div>
            )}
        </div>
    );
}

export default FilledOrders;
