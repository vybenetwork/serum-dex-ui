import { useContext, useState, createContext, Context, ReactNode, useMemo, useEffect } from 'react';
import { Market } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from 'react-query';
import { gqlTokenStats } from 'requests';
import axios from 'axios';

const MarketContext: Context<any> = createContext<any>(null);

export function useMarket() {
    const context = useContext(MarketContext);
    if (!context) {
        throw new Error('Missing market context');
    }
    return context;
}

export const MarketProvider = ({ children }: { children: ReactNode }) => {
    const [marketAddress, setMarketAddress] = useState('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT');
    const [marketName, setMarketName] = useState('SOL/USDC');
    const { connection } = useConnection();
    const programAddress = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');

    const marketData = useQuery(
        ['currentMarket', marketAddress],
        async () => await Market.load(connection, new PublicKey(marketAddress), {}, programAddress),
        { refetchOnWindowFocus: false, staleTime: 50000 },
    );

    const tokenStats = useQuery('tokenStats', gqlTokenStats, { refetchOnWindowFocus: false, staleTime: 50000 });

    const currencies = useMemo(() => {
        if (tokenStats.isLoading || marketData.isLoading) {
            return {
                baseCurrency: '',
                quoteCurrency: '',
            };
        }
        const baseCurrency =
            tokenStats?.data?.data?.data?.api_serum_dex_m?.tokenStats?.find(
                (t: any) => t.tokenMint === marketData?.data?.baseMintAddress?.toBase58(),
            )?.tokenName || 'UNKNOWN';
        const quoteCurrency =
            tokenStats?.data?.data?.data?.api_serum_dex_m?.tokenStats?.find(
                (t: any) => t.tokenMint === marketData?.data?.quoteMintAddress?.toBase58(),
            )?.tokenName || 'UNKNOWN';
        return {
            baseCurrency,
            quoteCurrency,
            baseMintAddress: marketData?.data?.baseMintAddress?.toBase58(),
            quoteMintAddress: marketData?.data?.quoteMintAddress?.toBase58(),
        };
    }, [tokenStats, marketData]);

    return (
        <MarketContext.Provider
            value={{
                market: marketData?.data,
                marketName,
                marketAddress,
                setMarketAddress,
                setMarketName,
                ...currencies,
            }}
        >
            {children}
        </MarketContext.Provider>
    );
};

const GeoLocationContext: Context<any> = createContext<any>(null);

export function useGeoLocation() {
    const context = useContext(GeoLocationContext);
    if (!context) {
        throw new Error('Missing geolocation context');
    }
    return context;
}

const RESTRICTED_COUNTRIES = ['US', 'CU', 'IR', 'AF', 'SY', 'KP'];
const RESTRICTED_REGIONS = ['43', '40', '09', '14'];

export const GeoLocationProvider = ({ children }: { children: ReactNode }) => {
    const [ip, setIp] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [regionCode, setRegionCode] = useState('');
    const [isRestricted, setIsRestricted] = useState(false);

    useEffect(() => {
        async function getUserLocation() {
            try {
                const res = await axios.get('');
                const { data } = res;
                const { country } = data;
                const rCode = data.regionCode;

                setCountryCode(country);
                setRegionCode(rCode);

                if (
                    RESTRICTED_COUNTRIES.some((code) => code === country) ||
                    (country === 'UA' && RESTRICTED_REGIONS.some((code) => code === rCode))
                ) {
                    setIsRestricted(true);
                }
            } catch (err: any) {
                console.error(err);
                if (err?.response?.status === 403 || err?.response?.status === 0) {
                    // For CORS errors
                    setIsRestricted(true);
                }
            }
        }
        getUserLocation();
    }, []);

    return (
        <GeoLocationContext.Provider
            value={{
                ip,
                countryCode,
                regionCode,
                isRestricted,
            }}
        >
            {children}
        </GeoLocationContext.Provider>
    );
};
