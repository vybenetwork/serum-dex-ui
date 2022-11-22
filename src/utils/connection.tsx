import React, { useContext, useEffect, useRef, useMemo } from 'react';
import { Connection, PublicKey, AccountInfo, Account } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
// @ts-ignore
import tuple from 'immutable-tuple';

import { useAsyncData, setCache } from 'utils/fetch';
import { useLocalStorageState } from 'utils';

/* 
 * Type declarations used for connection util functions
 */
interface EndpointInfo {
    name: string;
    endpoint: string;
    custom: boolean;
}

interface ConnectionContextValues {
    endpoint: string;
    setEndpoint: (newEndpoint: string) => void;
    connection: Connection;
    sendConnection: Connection;
    availableEndpoints: EndpointInfo[];
    setCustomEndpoints: (newCustomEndpoints: EndpointInfo[]) => void;
}

/* 
 * Utility functions used for connection operations
 */
export function ConnectionProvider({ children }: { children: any }) {
    const [endpoint, setEndpoint] = useLocalStorageState<string>(
      'connectionEndpts',
      ENDPOINTS[0].endpoint,
    );
    const [customEndpoints, setCustomEndpoints] = useLocalStorageState<
      EndpointInfo[]
    >('customConnectionEndpoints', []);
    const availableEndpoints = ENDPOINTS.concat(customEndpoints);
  
    const connection = useMemo(() => new Connection(endpoint, 'recent'), [
      endpoint,
    ]);
    const sendConnection = useMemo(() => new Connection(endpoint, 'recent'), [
      endpoint,
    ]);
  
    // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
    // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
    // This is a hack to prevent the list from every getting empty
    useEffect(() => {
      const id = connection.onAccountChange(new Account().publicKey, () => {});
      return () => {
        connection.removeAccountChangeListener(id);
      };
    }, [connection]);
  
    useEffect(() => {
      const id = connection.onSlotChange(() => null);
      return () => {
        connection.removeSlotChangeListener(id);
      };
    }, [connection]);
  
    useEffect(() => {
      const id = sendConnection.onAccountChange(
        new Account().publicKey,
        () => {},
      );
      return () => {
        sendConnection.removeAccountChangeListener(id);
      };
    }, [sendConnection]);
  
    useEffect(() => {
      const id = sendConnection.onSlotChange(() => null);
      return () => {
        sendConnection.removeSlotChangeListener(id);
      };
    }, [sendConnection]);
  
    return (
      <ConnectionContext.Provider
        value={{
          endpoint,
          setEndpoint,
          connection,
          sendConnection,
          availableEndpoints,
          setCustomEndpoints,
        }}
      >
        {children}
      </ConnectionContext.Provider>
    );
}

export const ENDPOINTS: EndpointInfo[] = [
    {
      name: 'mainnet-beta',
      endpoint: "https://vybe.genesysgo.net/",
      custom: false,
    },
];

export const ConnectionContext: React.Context<null | ConnectionContextValues> = React.createContext<null | ConnectionContextValues>(
    null,
);

export function useSendConnection() {
    const context = useContext(ConnectionContext);
    if (!context) {
      throw new Error('Missing connection context');
    }
    return context.sendConnection;
}

const accountListenerCount = new Map();

export function useAccountInfo(
    publicKey: PublicKey | undefined | null,
  ): [AccountInfo<Buffer> | null | undefined, boolean] {
    const { connection } = useConnection();
    const cacheKey = tuple(connection, publicKey?.toBase58());
    const [accountInfo, loaded] = useAsyncData<AccountInfo<Buffer> | null>(
      async () => (publicKey ? connection.getAccountInfo(publicKey) : null),
      cacheKey,
      { refreshInterval: 6000 },
    );
    useEffect(() => {
      if (!publicKey) {
        return;
      }
      if (accountListenerCount.has(cacheKey)) {
        let currentItem = accountListenerCount.get(cacheKey);
        ++currentItem.count;
      } else {
        let previousInfo: AccountInfo<Buffer> | null = null;
        const subscriptionId = connection.onAccountChange(publicKey, (info) => {
          if (
            !previousInfo ||
            !previousInfo.data.equals(info.data) ||
            previousInfo.lamports !== info.lamports
          ) {
            previousInfo = info;
            setCache(cacheKey, info);
          }
        });
        accountListenerCount.set(cacheKey, { count: 1, subscriptionId });
      }
      return () => {
        let currentItem = accountListenerCount.get(cacheKey);
        let nextCount = currentItem.count - 1;
        if (nextCount <= 0) {
          connection.removeAccountChangeListener(currentItem.subscriptionId);
          accountListenerCount.delete(cacheKey);
        } else {
          --currentItem.count;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);
    const previousInfoRef = useRef<AccountInfo<Buffer> | null | undefined>(null);
    if (
      !accountInfo ||
      !previousInfoRef.current ||
      !previousInfoRef.current.data.equals(accountInfo.data) ||
      previousInfoRef.current.lamports !== accountInfo.lamports
    ) {
      previousInfoRef.current = accountInfo;
    }
    return [previousInfoRef.current, loaded];
}

export function useConnectionConfig() {
    const context = useContext(ConnectionContext);
    if (!context) {
      throw new Error('Missing connection context');
    }
    return {
      endpoint: context.endpoint,
      endpointInfo: context.availableEndpoints.find(
        (info) => info.endpoint === context.endpoint,
      ),
      setEndpoint: context.setEndpoint,
      availableEndpoints: context.availableEndpoints,
      setCustomEndpoints: context.setCustomEndpoints,
    };
}

