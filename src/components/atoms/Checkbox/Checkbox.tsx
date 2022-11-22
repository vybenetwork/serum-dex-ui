import { ReactNode } from 'react';
import { Checkbox as ADCheckbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import './Checkbox.less';

const Checkbox = ({
    children,
    onChange,
    checked = false,
    disabled = false,
    value,
    ...props
}: {
    children?: ReactNode;
    onChange: (e: CheckboxChangeEvent) => void;
    checked: boolean;
    disabled?: boolean;
    value: any;
}) => {
    return (
        <ADCheckbox onChange={onChange} checked={checked} disabled={disabled} value={value} {...props}>
            {children && children}
        </ADCheckbox>
    );
};

export default Checkbox;
