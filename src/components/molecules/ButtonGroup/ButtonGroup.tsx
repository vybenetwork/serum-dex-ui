import { Radio } from 'antd';
import { selectedButtonStyle, selectedMarketSelectButtonGroupStyle, marketSelectButtonGroupStyle, buttonStyle } from 'utils/styles';
import './ButtonGroup.css';

interface ButtonGroupValues {
    value: string,
    label: string
}

interface ButtonGroupProps {
    values: Array<ButtonGroupValues>,
    selected: string,
    setSelected?: any,
    defaultValue?: string
    sx?: any,
    group?: string
    className?: any,
}

function ButtonGroup({
    values,
    selected,
    setSelected,
    defaultValue,
    sx,
    group,
    className
  }: ButtonGroupProps) {

    let buttons = [];
    let width = String(92 / values.length) + '%'
    let margin = 4 / (values.length - 1);
    let buttonWidth = {
        width: width,
    }

    let buttonMargin = {
        margin: `0px ${margin.toFixed(4)}%`
    }

    let selectedStyle;
    let style;
    if (group === 'marketSelect') {
        selectedStyle = {...selectedMarketSelectButtonGroupStyle, ...buttonWidth, ...sx, ...buttonMargin}
        style = {...marketSelectButtonGroupStyle, ...buttonWidth, ...sx, ...buttonMargin}
    } else {
        let width = String(100 / values.length) + '%'
        let buttonWidth = {
            width: width,
        }
        selectedStyle = {...selectedButtonStyle, ...buttonWidth, ...sx}
        style = {...buttonStyle, ...buttonWidth, ...sx}
    }

    for (let value in values) {
        buttons.push(
            <Radio.Button 
                key={values[value].label}
                style={ values[value].value === selected ? selectedStyle : style } 
                value={ values[value].value }
                checked={ values[value].value === selected ?  true : false  }
                className={group === "marketSelect" ? `button_group__button--market_select ${className && className}` : `button_group__button ${className && className}`}
            >
                { values[value].label }
            </Radio.Button>
        )
    }

    return (
        <Radio.Group 
            defaultValue={defaultValue && defaultValue} 
            value={selected}
            onChange={ (e) => setSelected(e.target.value) }
            style={{ width: '100%' }}
        >
            {buttons}
        </Radio.Group>
    );
}
  
export default ButtonGroup;