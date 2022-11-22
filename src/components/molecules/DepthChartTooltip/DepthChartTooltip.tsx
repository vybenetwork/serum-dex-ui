import './DepthChartTooltip.less';
import { useWindowDimensions } from 'utils';

interface IProps {
    datum?: any;
    x?: number;
    y?: number;
    center?: any;
    price: number;
}

const DepthChartTooltip = (props: IProps) => {
    const { datum, x, y, price } = props;
    const { height } = useWindowDimensions();
    let side = 'bid';
    let arrow = 'down';
    let priceImpact = 0;

    if (props.datum.x > price) {
        side = 'ask';
        priceImpact = Number((1 - Number((price/props.datum.x).toFixed(4))).toFixed(4)) * 100;
    } else {
        side = 'bid';
        priceImpact = Number((Number((price/props.datum.x).toFixed(4)) - 1).toFixed(4)) * 100;
    }

    let posX, posY;
    if (y && x && y + 200 > height/2) {
        posY = y - 115;
        posX = x - 100;
        arrow = 'down';
    } else if (y && x) {
        posY = y - 50;
        arrow = 'side';
        if (props.datum.x > price) {
            posX = x - 200;
        } else {
            posX = x + 10;
        }
    }

    return (
        <g style={{ pointerEvents: "none" }}>
            <foreignObject
                x={posX}
                y={posY}
                width="10"
                height="10"
                style={{ overflow: "visible" }}
            >
                <div className={
                    side === 'bid' && arrow === 'down'
                    ? 
                    "depth_tooltip_wrapper--bid" 
                    : 
                    side === 'bid' && arrow === 'side'
                    ?
                    "depth_tooltip_wrapper--bid depth_tooltip_wrapper--bid_side"
                    : 
                    side === 'ask' && arrow === 'down'
                    ?
                    "depth_tooltip_wrapper--ask"
                    :
                    "depth_tooltip_wrapper--ask depth_tooltip_wrapper--ask_side"
                }>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="depth_tooltip__title">Price</span>
                        <span className="depth_tooltip__value">${datum.x}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="depth_tooltip__title">Total Size</span>
                        <span className="depth_tooltip__value">{datum.y.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="depth_tooltip__title">USD Value:</span>
                        <span className="depth_tooltip__value">${(datum.y * datum.x).toLocaleString('en-US')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="depth_tooltip__title">Price Impact</span>
                        <span className="depth_tooltip__value">{priceImpact.toFixed(2)}%</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

export default DepthChartTooltip;