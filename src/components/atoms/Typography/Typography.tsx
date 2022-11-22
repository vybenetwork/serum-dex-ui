import { Typography as ADTypography } from 'antd';
import './Typography.css';

interface TitleProps {
    level?: 2 | 3 | 4 | 5,
    style?: object,
    className?: string,
    children: React.ReactNode,
}

interface TextProps {
    type?: 'secondary' | 'success' | 'warning' | 'danger',
    style?: object,
    children: React.ReactNode,
}

const { Title, Text } = ADTypography;

function TypographyTitle({
    level,
    style,
    className,
    children
  }: TitleProps) {
    return (
      <Title style={style && style} level={level && level} className={className && className}>{children}</Title>
    );
}

function TypographyText({
    type,
    children
  }: TextProps) {
    return (
      <Text type={type && type}>{children}</Text>
    );
}
  
export { TypographyTitle, TypographyText };