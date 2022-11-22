import { Button as ADButton } from 'antd';
import './Button.less';

interface ButtonProps {
    type: 'primary' | 'default' | 'dashed' | 'text' | 'link';
    children: React.ReactNode;
    style?: object;
    size?: 'large' | 'small';
    onClick?: any;
    className?: string;
    disabled?: boolean;
    ghost?: boolean;
    danger?: boolean;
    [x: string]: any;
}

function Button({
    type,
    children,
    style,
    size,
    onClick,
    className,
    disabled = false,
    ghost = false,
    danger = false,
    ...props
}: ButtonProps) {
    return (
        <ADButton
            className={className && className}
            type={type}
            style={style && style}
            size={size && size}
            onClick={onClick && onClick}
            disabled={disabled}
            ghost={ghost}
            danger={danger}
            {...props}
        >
            {children}
        </ADButton>
    );
}

export default Button;
