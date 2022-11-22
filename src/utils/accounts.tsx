import { useQuery } from 'react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { useMarket } from 'utils/context';

export const useMarketOpenOrdersAccounts = (refetchInterval = 6000) => {
    const { market, marketAddress } = useMarket();
    const { connected, wallet, publicKey } = useWallet();
    const { connection } = useConnection();

    const data = useQuery(
        ['marketOOA', publicKey?.toBase58() || '', marketAddress],
        async () => {
            if (market && connected && wallet && publicKey) {
                return await market.findOpenOrdersAccountsForOwner(connection, publicKey);
            }
        },
        { enabled: !!publicKey && !!market, refetchInterval, refetchOnWindowFocus: false },
    );

    if (!connected || !wallet || !market || !publicKey) {
        return null;
    }

    return data;
};
