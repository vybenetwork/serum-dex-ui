import { Row as ADRow, Col as ADCol } from 'antd';
import './Grid.css';

interface RowProps {
    align?: 'top' | 'middle' | 'bottom',
    gutter?: number | object,
    justify?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly",
    style?: object,
    className?: string,
    onClick?: any,
    children: React.ReactNode,
}

interface ColProps {
  offset?: number,
  order?: number,
  span?: number,
  xs?: number | object,
  sm?: number | object,
  md?: number | object,
  lg?: number | object,
  xl?: number | object,
  xxl?: number | object,
  style?: object,
  className?: string,
  onClick?: any,
  children: React.ReactNode
}

function Row({
    align,
    gutter,
    justify,
    style,
    className,
    onClick,
    children
  }: RowProps) {
    return (
      <ADRow 
        align={align && align} 
        gutter={gutter && gutter} 
        justify={justify && justify}
        style={style && style}
        className={className && className}
        onClick={onClick && onClick}
      >
        {children}
      </ADRow>
    );
}

function Col({
  offset,
  order,
  span,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  style,
  onClick,
  children
}: ColProps) {
  return (
    <ADCol 
      offset={offset && offset} 
      order={order && order} 
      span={span && span}
      xs={xs && xs}
      sm={sm && sm}
      md={md && md}
      lg={lg && lg}
      xl={xl && xl}
      xxl={xxl && xxl}
      style={style && style}
      onClick={onClick && onClick}
    >
      {children}
    </ADCol>
  );
}
  
export { Row, Col };