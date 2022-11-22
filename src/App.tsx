// External imports
import { Spin } from 'antd';
import { useMemo, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
    ExodusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
// Installed Strike wallet on its own as the latest @solana/wallet-adapter-wallets have some issues with our react-scripts and Craco
import { StrikeWalletAdapter } from '@solana/wallet-adapter-strike';

// Local imports
import AppLayout from 'components/molecules/AppLayout/AppLayout';
import Trade from 'pages/Trade/Trade';
import Profile from 'pages/Profile/Profile';
import PrivacyPolicy from 'pages/Policy/Policy';
import Terms from 'pages/Terms/Terms';
import { GeoLocationProvider, MarketProvider } from 'utils/context';
import TokenProvider from 'utils/token';

// CSS Imports
import './App.css';
require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
    const queryClient = new QueryClient();

    const network = WalletAdapterNetwork.Mainnet;

    const endpoint = process.env.REACT_APP_DEV_RPC_ENDPOINT || '';

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new LedgerWalletAdapter(),
            new SolletExtensionWalletAdapter(),
            new SolletWalletAdapter(),
            new TorusWalletAdapter(),
            new StrikeWalletAdapter(),
            new ExodusWalletAdapter(),
        ],
        [network],
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <QueryClientProvider client={queryClient}>
                        <TokenProvider>
                            <MarketProvider>
                                <GeoLocationProvider>
                                    <Routes>
                                        <Route path="/" element={<AppLayout />}>
                                            <Route index element={<Trade />} />
                                            <Route path="trade" element={<Trade />} />
                                            <Route path="trade/:id" element={<Trade />} />
                                            <Route path="profile" element={<Profile />} />
                                            <Route path="privacy-policy" element={<PrivacyPolicy />} />
                                            <Route path="terms-of-use" element={<Terms />} />
                                            <Route path="*" element={<Trade />} />
                                        </Route>
                                    </Routes>
                                </GeoLocationProvider>
                            </MarketProvider>
                        </TokenProvider>
                        {process.env.REACT_APP_SHOW_QUERY_DEVTOOL === 'true' && <ReactQueryDevtools />}
                    </QueryClientProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
