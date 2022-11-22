import { Layout as ADLayout } from 'antd';
import './Layout.less';

interface LayoutProps {
    style?: object;
    children: React.ReactNode;
}

function Layout({ style, children }: LayoutProps) {
    return <ADLayout style={style && style}>{children}</ADLayout>;
}

export default Layout;
