import { ReactNode } from 'react';
import { Empty as ADEmpty } from 'antd';
import './Empty.less';

export default function Empty({ children, ...props }: { children?: ReactNode; [x: string]: any }) {
    return (
        <ADEmpty image={ADEmpty.PRESENTED_IMAGE_SIMPLE} {...props}>
            {children && children}
        </ADEmpty>
    );
}
