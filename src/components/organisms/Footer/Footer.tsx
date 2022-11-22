import './Footer.less';
import { ReactComponent as VYBELOGO } from 'assets/images/vybe-logo-white.svg';

interface FooterProps {
    trades: any;
    volume: any;
    tvl: any;
    tps: any;
}

const Footer = ({ trades, volume, tvl, tps }: FooterProps) => {
    return (
        <div className='footer__row'>
            <div className='footer__item'>
                <div>Solana TPS:</div>
                <div className='footer__item_value'>{tps && tps.toLocaleString("en-US")}</div>
            </div>
            <div className='footer__item'>
                <div>Total VOL:</div>
                <div className='footer__item_value'>${volume && volume.toLocaleString("en-US")}</div>
            </div>
            <div className='footer__item'>
                <div>Total TVL:</div>
                <div className='footer__item_value'>${tvl && tvl.toLocaleString("en-US")}</div>
            </div>
            <div className='footer__item--last'>
                <div>Analytics powered by</div>
                <VYBELOGO style={{ height: '3vh' }}/>
                <div style={{ color: 'white', textTransform: 'uppercase' }}>Vybe Network</div>
            </div>
        </div>
    );
}

export default Footer;