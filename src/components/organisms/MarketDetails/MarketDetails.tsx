import './MarketDetails.less';
import HorizontalDivider from 'components/atoms/HorizontalDivider/VerticalDivider';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';
import { useMarket } from 'utils/context';
import { FaExternalLinkAlt } from 'react-icons/fa';
import TokenIcon from 'components/atoms/TokenIcon/TokenIcon';

interface MarketDetailsProps {
    name: string;
}

function MarketDetails({
    name
}: MarketDetailsProps) {

    const {
        market,
        marketName,
        marketAddress,
        baseMintAddress,
        quoteMintAddress
    } = useMarket();

    return (
        <div className="market_details__wrapper">
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Market ID
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + marketAddress} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {marketAddress?.slice(0, 4)}...{marketAddress?.slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Base Token Name
                </Title>
                <Title level={4} className="market_details__title_value--with_logo">
                    <TokenIcon mint={baseMintAddress} className="market_details__asset_icon" />
                    {name === undefined || name === '' ? marketName.split('/')[0] : name}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Base Mint
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + baseMintAddress} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {baseMintAddress?.slice(0, 4)}...{baseMintAddress?.slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Quote Token Name
                </Title>
                <Title level={4} className="market_details__title_value--with_logo">
                    <TokenIcon mint={quoteMintAddress} className="market_details__asset_icon" />
                    {marketName.split('/')[1]}
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Quote Mint
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + quoteMintAddress} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {quoteMintAddress?.slice(0, 4)}...{quoteMintAddress?.slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Bids Address
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + market?.bidsAddress.toBase58()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {market?.bidsAddress.toBase58().slice(0, 4)}...{market?.bidsAddress.toBase58().slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Asks Address
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + market?.asksAddress.toBase58()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {market?.asksAddress.toBase58().slice(0, 4)}...{market?.asksAddress.toBase58().slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Event Queue
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + market?._decoded.eventQueue.toBase58()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {market?._decoded.eventQueue.toBase58().slice(0, 4)}...{market?._decoded.eventQueue.toBase58().slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Base Vault
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + market?._decoded.baseVault.toBase58()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {market?._decoded.baseVault.toBase58().slice(0, 4)}...{market?._decoded.baseVault.toBase58().slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
            <div className="market_details__title_wrapper">
                <Title level={4} className="market_details__title">
                    Quote Vault
                </Title>
                <Title level={4} className="market_details__title_value">
                    <a 
                        href={'https://solscan.io/account/' + market?._decoded.quoteVault.toBase58()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='market_details__a_tag'
                    >
                        {market?._decoded.quoteVault.toBase58().slice(0, 4)}...{market?._decoded.quoteVault.toBase58().slice(-4)}
                    </a>
                    <FaExternalLinkAlt className='market_details__link_icon' />
                </Title>
            </div>
            <HorizontalDivider />
        </div>
    );
}

export default MarketDetails;
