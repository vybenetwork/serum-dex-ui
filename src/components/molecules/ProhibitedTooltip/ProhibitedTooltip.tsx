import Tooltip from 'components/atoms/Tooltip/Tooltip';
import { FaInfoCircle } from 'react-icons/fa';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';
import './ProhibitedTooltip.less';

interface ProhibitedTooltipProps {
    buttonType?: string;
}

const ProhibitedTooltip = ({ buttonType }: ProhibitedTooltipProps) => {
    return (
        <Tooltip
            overlayClassName='prohibited_tooltip__prohibited_region_tooltip'
            color="#202533"
            title={
                <div>
                    <div className='prohibited_tooltip__prohibited_region_tooltip--title_wrapper'>
                        <FaInfoCircle color='#F7E733' />
                        <Title className='prohibited_tooltip__prohibited_region_tooltip--title'>Prohibited Jurisdiction</Title>
                    </div>
                    <div className='prohibited_tooltip__prohibited_region_tooltip--subtitle'>
                        The following countries and regions are currently 
                        prohibited from trading on the Serum DEX:
                    </div>
                    <ul>
                        <li>United States of America (including territories)</li>
                        <li>Cuba</li>
                        <li>Crimea & Sevastopal</li>
                        <li>Luhansk People's Republic</li>
                        <li>Donetsk People's Republic</li>
                        <li>Iran</li>
                        <li>Afghanistan</li>
                        <li>Syria</li>
                        <li>North Korea</li>
                    </ul>
                </div>
            }
            placement='bottom'
        >
            <div className={buttonType && buttonType === 'full' ? "prohibited_tooltip__select_wallet_button--full" : "prohibited_tooltip__select_wallet_button"}>
                Select Wallet
            </div>
        </Tooltip>
    )
}

export default ProhibitedTooltip;