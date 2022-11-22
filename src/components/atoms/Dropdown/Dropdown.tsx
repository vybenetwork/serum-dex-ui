import { Menu } from 'antd';
import { Dropdown as ADDropdown } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import './Dropdown.css';

interface ButtonGroupValues {
    value: string,
    label: string
}

interface ButtonGroupProps {
    values: Array<ButtonGroupValues>,
    selected: string,
    setSelected: any
}

function Dropdown({
    values,
    selected,
    setSelected
  }: ButtonGroupProps) {

    let items = [];

    for (let i = 0; i < values.length; i++) {
        items.push({
            label: (
                <a onClick={() => setSelected(values[i].value)} className="button_dropdown__menu_item">
                    {values[i].label}
                </a>
            ),
            key: values[i].value
        })
    }

    const menu = (
        <Menu className="button_dropdown__menu" items={items}/>
    );

    return (
        <div style={{ width: '100%', display: 'flex' }}>
            <div className="button_dropdown__inner_wrapper" style={{ border: '0.25px solid rgba(255, 255, 255, 0.1)', width: '100%', textAlign: 'center' }}>
                <ADDropdown overlay={menu} trigger={['click']}>
                    <a className="button_dropdown__a_tag" onClick={e => e.preventDefault()}>
                        {selected} <CaretDownOutlined />
                    </a>
                </ADDropdown>
            </div>
        </div>
    );
}
  
export default Dropdown;