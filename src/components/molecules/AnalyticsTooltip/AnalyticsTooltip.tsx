import { useWindowDimensions } from 'utils';
import './AnalyticsTooltip.less';

interface IProps {
    datum?: any;
    x?: number;
    y?: number;
    center?: any;
    title: string;
}

const AnalyticsTooltip = (props: IProps) => {
    const { datum, x, y, title } = props;

    const { width } = useWindowDimensions();
    let side;

    let posX, posY;
    if (x && x + 200 > width/2) {
        posX = x - 210;
        side = 'right';
    } else if (x) {
        posX = x + 10;
        side = 'left';
    }

    if (y && title !== 'TVL') {
        posY = y - 30;
    } else if (y) {
        posY = y - 30;
    }

    // TODO: Ensure tooltip remains within the borders of the container
    // Set X and Y dynamically to ensure that the tooltip stays within the container

    return (
        <g style={{ pointerEvents: "none" }}>
            <foreignObject
                x={posX}
                y={posY}
                width="10"
                height="10"
                style={{ overflow: "visible" }}
            >
                <div className={side === 'right' ? "analytics_tooltip_wrapper analytics_tooltip_wrapper--right" : "analytics_tooltip_wrapper analytics_tooltip_wrapper--left"}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="analytics_tooltip__title">{title}:</span>
                        <span className="analytics_tooltip__value">${datum.y.toLocaleString('en-US')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="analytics_tooltip__title">Date:</span>
                        <span className="analytics_tooltip__title">{datum.x}</span>
                    </div>
                </div>
            </foreignObject>
        </g>
    );
};

export default AnalyticsTooltip;