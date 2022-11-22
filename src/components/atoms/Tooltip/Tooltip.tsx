import { Tooltip as ADTooltip } from 'antd';
import './Tooltip.less';

interface TooltipProps {
    title: any;
    placement: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
    className?: string;
    overlayClassName?: string;
    color?: string;
    children: any;
}

function Tooltip({
    title,
    placement,
    color,
    children,
    className,
    overlayClassName
}: TooltipProps) {
    return (
        <ADTooltip
            className={className && className}
            title={title}
            placement={placement}
            color={color && color}
            overlayClassName={overlayClassName && overlayClassName}
        >
            {children}
        </ADTooltip>
    );
}

export default Tooltip;
