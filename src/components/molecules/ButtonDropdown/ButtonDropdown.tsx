import { Menu } from 'antd';
import Button from 'components/atoms/Button/Button';
import { Dropdown } from 'antd';
import { selectedButtonStyle } from 'utils/styles';
import { CaretDownOutlined } from '@ant-design/icons';
import './ButtonDropdown.css';

interface ButtonGroupValues {
    value: string;
    label: string;
}

interface ButtonGroupProps {
    values: Array<ButtonGroupValues>;
    buttonText?: string;
    selected: string;
    setSelected: any;
    display?: string;
}

function ButtonDropdown({ values, buttonText, selected, setSelected, display = 'flex' }: ButtonGroupProps) {
    let buttonWidth = {
        width: '50%',
    };

    let selectedStyle = { ...selectedButtonStyle, ...buttonWidth };

    let items = [];

    for (let i = 0; i < values.length; i++) {
        items.push({
            label: (
                <a onClick={() => setSelected(values[i].value)} className="button_dropdown__menu_item">
                    {values[i].label}
                </a>
            ),
            key: values[i].value,
        });
    }

    const menu = <Menu className="button_dropdown__menu" items={items} />;

    return (
        <div style={{ width: '100%', display: display }}>
            {buttonText && (
                <Button style={selectedStyle} className='button_dropdown__button' type="default">
                    {buttonText}
                </Button>
            )}
            <div
                className="button_dropdown__inner_wrapper"
                style={{
                    width: buttonText ? '50%' : 'auto',
                }}
            >
                <Dropdown overlay={menu} trigger={['click']}>
                    <a className="button_dropdown__a_tag" onClick={(e) => e.preventDefault()}>
                        {values.find(({ value }) => value === selected)!.label} <CaretDownOutlined />
                    </a>
                </Dropdown>
            </div>
        </div>
    );
}

export default ButtonDropdown;
