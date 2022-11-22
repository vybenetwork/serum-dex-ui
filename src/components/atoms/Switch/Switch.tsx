import { Switch as ADSwitch } from 'antd';
import './Switch.less';

interface SwitchProps {
    checked: boolean;
    className?: string;
    disabled?: boolean;
    size?: 'default' | 'small';
    onChange?: any;
    onClick?: any;
}

function Switch({
    checked,
    className,
    disabled,
    size,
    onChange,
    onClick,
    ...props
}: SwitchProps) {
    return (
        <ADSwitch
            className={className && className}
            checked={checked}
            size={size && size}
            onClick={onClick && onClick}
            onChange={onChange && onChange}
            {...props}
        />
    );
}

export default Switch;
