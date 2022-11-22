import { useQueryClient } from 'react-query';
import { Row, Col } from 'components/atoms/Grid/Grid';
import './OpenOrders.less';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { cancelOrder } from 'utils/index';
import { useMarket } from 'utils/context';
import Button from 'components/atoms/Button/Button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FaInfoCircle, FaWallet } from 'react-icons/fa';
import { useSelectedOpenOrdersAccount } from 'utils/market';
import ProhibitedTooltip from 'components/molecules/ProhibitedTooltip/ProhibitedTooltip';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';

interface OpenOrdersProps {
    marketName: any;
    onCancelSuccess?: () => void;
    setAlertTitle: any;
    setAlertDescription: any;
    setAlertVisible: any;
    setAlertType: any;
    bidsData: any;
    asksData: any;
    isRestricted: boolean;
}

function OpenOrders({
    marketName,
    setAlertTitle,
    setAlertDescription,
    setAlertVisible,
    setAlertType,
    onCancelSuccess,
    bidsData,
    asksData,
    isRestricted
}: OpenOrdersProps) {
    const wallet = useWallet();
    const { market, baseMintAddress, marketName: marketNameFromCtx, marketAddress } = useMarket();
    const { connection } = useConnection();
    const reactQueryClient = useQueryClient();

    const openOrdersAccount = useSelectedOpenOrdersAccount(true);

    const openOrdersFinal = useMemo(() => {
        if (!!market && !!openOrdersAccount && !!bidsData['data'] && !!asksData['data']) {
            return market?.filterForOpenOrders(bidsData['data'], asksData['data'], [openOrdersAccount]);
        } else {
            return null;
        }
    }, [market, openOrdersAccount, bidsData, asksData]);

    async function cancel(order: any) {
        try {
            if (wallet) {
                await cancelOrder({
                    order,
                    market: order.market,
                    connection,
                    wallet,
                    setAlertTitle,
                    setAlertDescription,
                    setAlertVisible,
                    setAlertType,
                    currentMarketDetails: {
                        name: marketNameFromCtx,
                        addr: marketAddress,
                    },
                });

                reactQueryClient.refetchQueries(['marketOOA', wallet?.publicKey?.toBase58() || '', marketAddress]);
            } else {
                throw Error('Error cancelling order');
            }
        } catch (e) {
            console.log('Error canceling order');
            console.log(e);
            return;
        } finally {
            console.log('done');
        }
        onCancelSuccess && onCancelSuccess();
    }

    const dataSource = (openOrdersFinal || []).map((order: any) => ({
        ...order,
        key: order.orderId,
        marketName,
        market,
    }));

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
                                xs={4}
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
                                xs={4}
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
                                xs={4}
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
                                xs={4}
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
                            <Col xs={4} style={{ textAlign: 'center', lineHeight: '5vh', fontWeight: 'bold' }}>
                                {' '}
                            </Col>
                        </Row>
                    </div>
                    <div style={{ padding: '0 1rem' }} className="open_orders__data_wrapper">
                        {dataSource.map(
                            (
                                {
                                    marketName,
                                    side,
                                    size,
                                    price,
                                    orderId,
                                }: { marketName: string; side: string; size: any; price: any; orderId: any },
                                i: number,
                            ) => (
                                <Row
                                    key={i}
                                    style={{
                                        fontSize: 14,
                                        color: 'rgba(241, 241, 242, 1)',
                                        paddingBottom: 16,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Col
                                        span={4}
                                        style={{
                                            textAlign: 'left',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                        }}
                                    >
                                        <div className="open_orders__asset_wrapper">
                                            <TokenIcon mint={baseMintAddress} className="open_orders__asset_icon" />
                                            {marketName}
                                        </div>
                                    </Col>
                                    <Col
                                        span={4}
                                        style={{
                                            textAlign: 'center',
                                            color: side === 'buy' ? '#45C493' : '#FF5C5C',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            fontFamily: 'Inconsolata',
                                        }}
                                    >
                                        {side}
                                    </Col>
                                    <Col
                                        span={4}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                        }}
                                    >
                                        {size}
                                    </Col>
                                    <Col
                                        span={4}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                        }}
                                    >
                                        {price}
                                    </Col>
                                    <Col
                                        span={4}
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inconsolata',
                                            color: 'rgba(255, 255, 255, 0.85)',
                                        }}
                                    >
                                        {(Number(price) * Number(size)).toFixed(2)}
                                    </Col>
                                    <Col span={4} style={{ textAlign: 'center', fontFamily: 'Inconsolata' }}>
                                        <Button
                                            onClick={() => cancel(dataSource[i])}
                                            type="default"
                                            style={{ color: '#FF5C5C' }}
                                        >
                                            Cancel
                                        </Button>
                                    </Col>
                                </Row>
                            ),
                        )}
                    </div>
                </div>
            ) : !wallet.connected ? (
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
                            className="open_orders__select_wallet_button"
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
            ) : (
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
                            xs={4}
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
                            xs={4}
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
                            xs={4}
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
                            xs={4}
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
                        <Col xs={4} style={{ textAlign: 'center', lineHeight: '5vh', fontWeight: 'bold' }}>
                            {' '}
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}

export default OpenOrders;
