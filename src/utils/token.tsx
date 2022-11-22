import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { TokenListProvider } from '@solana/spl-token-registry';

export const TokenContext = createContext(new Map());
const TokenProvider = ({ children }: { children: ReactNode }) => {
    const [tokenMap, setTokenMap] = useState(new Map());

    useEffect(() => {
        new TokenListProvider().resolve().then((tokens) => {
            const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();

            setTokenMap(
                tokenList.reduce((map, item) => {
                    map.set(item.address, item);
                    return map;
                }, new Map()),
            );
        });
    }, [setTokenMap]);

    return <TokenContext.Provider value={tokenMap}>{children}</TokenContext.Provider>;
};

export default TokenProvider;

export const useTokenMap = () => {
    const tokenMap = useContext(TokenContext);

    return tokenMap;
};
