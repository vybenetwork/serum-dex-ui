import './TokenDetails.less';
import HorizontalDivider from 'components/atoms/HorizontalDivider/VerticalDivider';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';

interface TokenDetailsProps {
    price: string;
    baseTokenAddress: string;
    marketAddress: string;
    marketName: string;
    marketCap: any;
    marketCapRank: any;
    marketCount: any;
    name: string;
    tvl: any;
    holders: any;
    circulatingSupply: any;
    v1d: any;
    v7d: any;
    priceChange?: number;
}

function TokenDetails({
    price,
    baseTokenAddress,
    marketAddress,
    marketName,
    marketCap,
    marketCount,
    marketCapRank,
    holders,
    name,
    tvl,
    circulatingSupply,
    v1d,
    v7d,
    priceChange,
}: TokenDetailsProps) {
    return (
        <div className="token_details__wrapper">
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    Name
                </Title>
                <Title level={4} className="token_details__title_value">
                    {name || 'N/A'}
                </Title>
            </div>
            {/* <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className='market_details__title'>Mint Address</Title>
                <Title level={4} className='market_details__title_value'>{baseTokenAddress}</Title>
            </div> */}
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    Price
                </Title>
                <Title
                    level={4}
                    className="token_details__title_value--price"
                    style={{
                        color: priceChange && priceChange > 0 ? '#45C493' : '#FF5C5C',
                    }}
                >
                    {Number(price).toFixed(2) + ' ' + marketName.split('/')[1]}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    TVL
                </Title>
                <Title level={4} className="token_details__title_value">
                    {tvl ? `$${tvl?.toLocaleString('en-US')}` : 'N/A'}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    24H Trading Volume
                </Title>
                <Title level={4} className="token_details__title_value">
                    {v1d ? `$${v1d?.toLocaleString('en-US')}` : 'N/A'}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    7D Trading Volume
                </Title>
                <Title level={4} className="token_details__title_value">
                    {v7d ? `$${v7d?.toLocaleString('en-US')}` : 'N/A'}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    Circulating Supply
                </Title>
                <Title level={4} className="token_details__title_value">
                    {circulatingSupply?.toLocaleString('en-US') || 'N/A'}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    FDV
                </Title>
                <Title level={4} className="token_details__title_value">
                    {marketCap ? `$${marketCap?.toLocaleString('en-US')}` : 'N/A'}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    Unique Holders / Wallets
                </Title>
                <Title level={4} className="token_details__title_value">
                    {holders?.toLocaleString('en-US') || 'N/A'}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="token_details__title_wrapper">
                <Title level={4} className="token_details__title">
                    Number of Markets
                </Title>
                <Title level={4} className="token_details__title_value">
                    {marketCount}
                </Title>
            </div>
        </div>
    );
}

export default TokenDetails;
