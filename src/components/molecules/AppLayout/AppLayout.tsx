import { Outlet } from 'react-router-dom';

import Layout from 'components/atoms/Layout/Layout';
import Header from 'components/organisms/Header/Header';
import { useGeoLocation } from 'utils/context';

const AppLayout = () => {
    const { isRestricted } = useGeoLocation();

    return (
        <Layout>
            <Header 
                isRestricted={isRestricted}
            />
            <Outlet />
        </Layout>
    );
};

export default AppLayout;
