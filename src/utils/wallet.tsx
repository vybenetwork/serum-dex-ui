import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from 'react';
  import { PublicKey, Transaction } from '@solana/web3.js';
  import Wallet from '@project-serum/sol-wallet-adapter';
  import { useConnectionConfig } from 'utils/connection';
  import { useLocalStorageState } from 'utils';
  import { Button, Modal } from 'antd';
  import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter
  } from '@solana/wallet-adapter-wallets'

  import {
    StrikeWalletAdapter
  } from './wallet-adapters';

  export interface WalletAdapter {
    publicKey: PublicKey;
    autoApprove: boolean;
    connected: boolean;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
    connect: () => any;
    disconnect: () => any;
    on<T>(event: string, fn: () => void): this;
  }

  export interface WalletContextValues {
    wallet: WalletAdapter;
    connected: boolean;
    providerUrl: string;
    setProviderUrl: (newProviderUrl: string) => void;
    providerName: string;
    select: () => void;
  }
  
  const ASSET_URL =
    'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets';
  export const WALLET_PROVIDERS = [
    {
      name: 'sollet.io',
      url: 'https://www.sollet.io',
      icon: `${ASSET_URL}/sollet.svg`,
      adapter: SolletWalletAdapter
    },
    {
      name: 'Sollet Extension',
      url: 'https://www.sollet.io/extension',
      icon: `${ASSET_URL}/sollet.svg`,
      adapter: SolletExtensionWalletAdapter as any,
    },
    {
      name: 'Ledger',
      url: 'https://www.ledger.com',
      icon: `${ASSET_URL}/ledger.svg`,
      adapter: LedgerWalletAdapter,
    },
    {
      name: 'Solflare',
      url: 'https://solflare.com/access-wallet',
      icon: `${ASSET_URL}/solflare.svg`,
      adapter: SolflareWalletAdapter
    },
    {
      name: 'Phantom',
      url: 'https://www.phantom.app',
      icon: `https://www.phantom.app/img/logo.png`,
      adapter: PhantomWalletAdapter,
    },
    {
      name: 'Strike',
      url: 'https://wallet.strikeprotocols.com',
      icon: `${ASSET_URL}/strike.svg`,
      adapter: StrikeWalletAdapter,
    },
  ];
  
  const WalletContext = React.createContext<null | WalletContextValues>(null);
  
  export function WalletProvider({ children }: { children: any }) {
    const { endpoint } = useConnectionConfig();
  
    const [autoConnect, setAutoConnect] = useState(false);
    const [providerUrl, setProviderUrl] = useLocalStorageState('walletProvider');
  
    const provider = useMemo(
      () => WALLET_PROVIDERS.find(({ url }) => url === providerUrl),
      [providerUrl],
    );
  
    let [wallet, setWallet] = useState<WalletAdapter | undefined>(undefined);
  
    useEffect(() => {
      if (provider) {
        const updateWallet = () => {
          // hack to also update wallet synchronously in case it disconnects
          // eslint-disable-next-line react-hooks/exhaustive-deps
          wallet = new (provider.adapter || Wallet)(
            providerUrl,
            endpoint,
          ) as WalletAdapter;
          setWallet(wallet);
        };
  
        if (document.readyState !== 'complete') {
          // wait to ensure that browser extensions are loaded
          const listener = () => {
            updateWallet();
            window.removeEventListener('load', listener);
          };
          window.addEventListener('load', listener);
          return () => window.removeEventListener('load', listener);
        } else {
          updateWallet();
        }
      }
    }, [provider, providerUrl, endpoint]);
  
    const [connected, setConnected] = useState(false);
  
    useEffect(() => {
      if (wallet) {
        wallet.on('connect', () => {
          if (wallet?.publicKey) {
            console.log('connected');
            localStorage.removeItem('feeDiscountKey');
            setConnected(true);
            const walletPublicKey = wallet.publicKey.toBase58();
            const keyToDisplay =
              walletPublicKey.length > 20
                ? `${walletPublicKey.substring(
                    0,
                    7,
                  )}.....${walletPublicKey.substring(
                    walletPublicKey.length - 7,
                    walletPublicKey.length,
                  )}`
                : walletPublicKey;
  
            }
        });
  
        wallet.on('disconnect', () => {
          setConnected(false);
        //   notify({
        //     message: 'Wallet update',
        //     description: 'Disconnected from wallet',
        //   });
          localStorage.removeItem('feeDiscountKey');
        });
      }
  
      return () => {
        setConnected(false);
        if (wallet && wallet.connected) {
          wallet.disconnect();
          setConnected(false);
        }
      };
    }, [wallet]);
  
    useEffect(() => {
      if (wallet && autoConnect) {
        wallet.connect();
        setAutoConnect(false);
      }
  
      return () => {};
    }, [wallet, autoConnect]);
  
    const [isModalVisible, setIsModalVisible] = useState(false);
  
    const select = useCallback(() => setIsModalVisible(true), []);
    const close = useCallback(() => setIsModalVisible(false), []);

    if (wallet === undefined) {
        console.log("wallet is undefined");
        return null;
    }
  
    return (
      <WalletContext.Provider
        value={{
          wallet,
          connected,
          select,
          providerUrl,
          setProviderUrl,
          providerName:
            WALLET_PROVIDERS.find(({ url }) => url === providerUrl)?.name ??
            providerUrl,
        }}
      >
        {children}
        <Modal
          title="Select Wallet"
          okText="Connect"
          visible={isModalVisible}
          okButtonProps={{ style: { display: 'none' } }}
          onCancel={close}
          width={400}
        >
          {WALLET_PROVIDERS.map((provider) => {
            const onClick = function () {
              setProviderUrl(provider.url);
              setAutoConnect(true);
              close();
            };
  
            return (
              <Button
                key={provider.name}
                size="large"
                type={providerUrl === provider.url ? 'primary' : 'ghost'}
                onClick={onClick}
                icon={
                  <img
                    alt={`${provider.name}`}
                    width={20}
                    height={20}
                    src={provider.icon}
                    style={{ marginRight: 8 }}
                  />
                }
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 8,
                }}
              >
                {provider.name}
              </Button>
            );
          })}
        </Modal>
      </WalletContext.Provider>
    );
  }
  
  export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
      throw new Error('Missing wallet context');
    }
  
    const wallet = context.wallet;
    return {
      connected: context.connected,
      wallet: wallet,
      providerUrl: context.providerUrl,
      setProvider: context.setProviderUrl,
      providerName: context.providerName,
      select: context.select,
      connect() {
        wallet ? wallet.connect() : context.select();
      },
      disconnect() {
        wallet?.disconnect();
      },
    };
  }