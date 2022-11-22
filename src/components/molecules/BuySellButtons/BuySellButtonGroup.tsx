import { Radio } from 'antd';
import { selectedBuyButtonStyle, selectedSellButtonStyle, buyButtonStyle, sellButtonStyle } from 'utils/styles';
import './BuySellButtonGroup.css';

interface ButtonGroupProps {
    selected: string,
    setSelected?: any,
    defaultValue?: string
}

function BuySellButtonGroup({
    selected,
    setSelected,
    defaultValue
  }: ButtonGroupProps) {

    let buttonWidth = {
        width: '50%'
    }

    let selectedBuyStyle = {...selectedBuyButtonStyle, ...buttonWidth}
    let selectedSellStyle = {...selectedSellButtonStyle, ...buttonWidth}
    let buyStyle = {...buyButtonStyle, ...buttonWidth}
    let sellStyle = {...sellButtonStyle, ...buttonWidth}

    return (
        <Radio.Group 
            defaultValue={defaultValue && defaultValue} 
            onChange={ (e) => setSelected(e.target.value) }
            style={{ width: '100%' }}
        >
            <Radio.Button 
                style={ selected === "buy" ? selectedBuyStyle : buyStyle } 
                value="buy"
                checked={ selected === "buy" ? true : false }
            >
                BUY
            </Radio.Button>
            <Radio.Button 
                style={ selected === "sell" ? selectedSellStyle : sellStyle } 
                value="sell"
                checked={ selected === "sell" ? true : false }
            >
                SELL
            </Radio.Button>
        </Radio.Group>
    );
}
  
export default BuySellButtonGroup;