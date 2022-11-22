import './Header.less';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, Dropdown } from 'antd';
import { ReactComponent as SERUMDEXLOGO } from 'assets/images/serum-dex-logo.svg';
import { TypographyTitle as Title } from 'components/atoms/Typography/Typography';
import mixpanel from 'mixpanel-browser';
import { useEffect, useState, useMemo, Fragment } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';
import { FaEllipsisV, FaTwitter, FaBookOpen, FaFileCode, FaFileAlt, FaWallet } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { css } from '@emotion/react';
import { jsonFriendlyErrorReplacer, sendMixPanelEvent } from 'utils';
import { useWindowDimensions } from 'utils';
import ProhibitedTooltip from 'components/molecules/ProhibitedTooltip/ProhibitedTooltip';
import Button from 'components/atoms/Button/Button';

import type { MenuProps } from 'antd';
import { MIX_PANEL_EVENTS } from 'utils/mixPanelEvents';

import vybeLogoSolid from 'assets/images/vybe-logo-solid.svg';
import serumLogoWhite from 'assets/images/serum-logo-white.png';
import kadoLogo from 'assets/images/kado-logo.svg';

const RESOURCE_LINKS = {
    serumAbout: {
        name: 'ABOUT',
        url: 'https://www.projectserum.com/',
        logo: <img src={serumLogoWhite} alt="serum-logo" />,
    },
    vybe: {
        name: 'VYBE NETWORK',
        url: 'https://vybenetwork.com/',
        logo: <img src={vybeLogoSolid} alt="vybe-logo" />,
    },
    twitter: { name: 'TWITTER', url: 'https://twitter.com/Vybe_Network', logo: <FaTwitter /> },
    docs: { name: 'DOCS', url: 'https://docs.projectserum.com/', logo: <FaBookOpen /> },
    privacyPolicy: { name: 'PRIVACY POLICY', url: '/privacy-policy', logo: <FaFileAlt /> },
    terms: { name: 'TERMS OF USE', url: '/terms-of-use', logo: <FaFileCode /> },
};

interface HeaderProps {
    isRestricted: boolean;
}

const selectedTitle = {
    fontFamily: 'Inconsolata',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: '14px',
    letterSpacing: '0.2em',
    textAlign: 'left',
    color: 'rgba(255, 255, 255, 1)',
    textTransform: 'uppercase',
    margin: '0.5vh 0px 0px 0px',
    padding: '0px 1rem',
};

const title = {
    fontFamily: 'Inconsolata',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: '14px',
    letterSpacing: '0.2em',
    textAlign: 'left',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    margin: '0.5vh 0px 0px 0px',
    padding: '0px 1rem',
};

const vybeLogoWrapperStyle = {
    fontFamily: 'Inconsolata',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '12px',
    letterSpacing: '0.2em',
    textAlign: 'left',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    margin: '0.8vh 0px 0px 0px',
    padding: '0px 1rem',
};

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    className?: string,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group',
): MenuItem {
    return {
        key,
        icon,
        className,
        children,
        label,
        type,
    } as MenuItem;
}

function Header({ isRestricted }: HeaderProps) {
    const [lastSelectedWalletKey, setLastSelectedWalletKey] = useState<string | undefined>(undefined);
    const [lastSelectedWalletType, setLastSelectedWalletType] = useState<string | undefined>(undefined);
    const [collapsed, setCollapsed] = useState(true);

    const wallet = useWallet();

    useEffect(() => {
        if (wallet.connected && wallet.publicKey && !lastSelectedWalletKey) {
            const base58Addr = wallet.publicKey.toBase58();

            if (process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN) {
                try {
                    mixpanel.identify(base58Addr);
                } catch (e) {
                    if (process.env.REACT_APP_ENV === 'development') {
                        console.error(
                            'Failed to send event to mixpanel. Error: ' + JSON.stringify(e, jsonFriendlyErrorReplacer),
                        );
                    }
                }
            }

            sendMixPanelEvent(MIX_PANEL_EVENTS.WALLET_CONNECTED.name, {
                pubkey: base58Addr,
                walletType: wallet.wallet?.adapter.name,
            });
            setLastSelectedWalletKey(base58Addr);
            setLastSelectedWalletType(wallet.wallet?.adapter.name ?? 'UNKNOWN');
        } else if (!wallet.connected && lastSelectedWalletKey) {
            sendMixPanelEvent(MIX_PANEL_EVENTS.WALLET_DISCONNECTED.name, {
                pubkey: lastSelectedWalletKey,
                walletType: lastSelectedWalletType,
            });
            setLastSelectedWalletKey(undefined);
            setLastSelectedWalletType(undefined);
        }
    }, [
        wallet.connected,
        wallet.publicKey,
        lastSelectedWalletKey,
        lastSelectedWalletType,
        wallet.wallet?.adapter.name,
    ]);

    const { width } = useWindowDimensions();

    const resourceItems = useMemo(
        () =>
            Object.entries(RESOURCE_LINKS).map(([k, value]) =>
                getItem(
                    value.url.startsWith('http') ? (
                        <a href={value.url} target="_blank" rel="noreferrer">
                            {value.name}
                        </a>
                    ) : (
                        <NavLink to={value.url}>{value.name}</NavLink>
                    ),
                    k,
                    '',
                    value.logo,
                ),
            ),
        [],
    );

    const mobileResourceItems = useMemo(
        () =>
            Object.entries(RESOURCE_LINKS).map(([k, value]) =>
                getItem(
                    value.url.startsWith('http') ? (
                        <a href={value.url} target="_blank" rel="noreferrer" onClick={() => setCollapsed((c) => !c)}>
                            {value.name}
                        </a>
                    ) : (
                        <NavLink to={value.url} onClick={() => setCollapsed((c) => !c)}>
                            {value.name}
                        </NavLink>
                    ),
                    k,
                ),
            ),
        [],
    );

    const items: MenuItem[] = useMemo(
        () => [
            getItem(
                <div className="header__titles_header_menu">
                    <AiOutlineMenu
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ margin: '6px 24px 0px', fontSize: '20px' }}
                    />
                    <Title level={5} style={vybeLogoWrapperStyle}>
                        <SERUMDEXLOGO />
                    </Title>
                    <div className="wallet-dropdown-header">
                        <WalletMultiButton
                            className={
                                wallet.connected
                                    ? 'header__wallet_multi_button--mobile'
                                    : 'header__select_wallet_button'
                            }
                            children={
                                wallet.connected || wallet.connecting ? '' : <FaWallet style={{ fontSize: '12px' }} />
                            }
                            style={{ fontSize: '0px', paddingTop: !collapsed ? '2px' : '0px' }}
                        />
                    </div>
                </div>,
                '1',
                'header__mobile_header_collapsed_open',
            ),
            getItem(
                <NavLink to="/trade" onClick={() => setCollapsed(!collapsed)}>
                    Trade
                </NavLink>,
                '2',
                '',
            ),
            getItem(
                <NavLink to="/profile" onClick={() => setCollapsed(!collapsed)}>
                    Profile
                </NavLink>,
                '3',
            ),
            getItem(<div>Resources</div>, 'resourceSub', '', null, mobileResourceItems),
        ],
        [collapsed, mobileResourceItems, wallet.connected, wallet.connecting],
    );

    return (
        <div>
            {width >= 768 ? (
                <div className="vybe-header">
                    <div className="titles-header">
                        <NavLink to="/trade">
                            <Title level={5} style={vybeLogoWrapperStyle}>
                                <SERUMDEXLOGO />
                            </Title>
                        </NavLink>
                        <NavLink to="/trade">
                            {({ isActive }) => (
                                <Title level={5} style={isActive ? selectedTitle : title}>
                                    Trade
                                </Title>
                            )}
                        </NavLink>
                        <NavLink to="/profile">
                            {({ isActive }) => (
                                <Title level={5} style={isActive ? selectedTitle : title}>
                                    Profile
                                </Title>
                            )}
                        </NavLink>
                    </div>
                    <div className="wallet-dropdown-header">
                        {isRestricted ? (
                            <ProhibitedTooltip buttonType="full" />
                        ) : (
                            <Fragment>
                                {wallet.connected && (
                                    <Button
                                        ghost
                                        type="default"
                                        href={`https://app.kado.money/?apiKey=d9c7d396-1be1-4988-8767-6916060629ad&onToAddress=${wallet.publicKey?.toBase58()}&product=BUY&onPayCurrency=USD&onRevCurrency=USDC&offPayCurrency=USDC&offRevCurrency=USD&onPayAmount=25&offPayAmount=25&network=SOLANA&cryptoList=SOL,USDC`}
                                        target="_blank"
                                        css={css`
                                            color: #6dc6c1 !important;
                                            border: 2px solid #6dc6c1 !important;
                                            margin-right: 0.5rem;
                                            display: inline-flex;
                                            align-items: center;
                                            letter-spacing: 0.2em;
                                            background: linear-gradient(
                                                    0deg,
                                                    rgba(255, 255, 255, 0.05),
                                                    rgba(255, 255, 255, 0.05)
                                                ),
                                                rgba(11, 21, 30, 0.1) !important;
                                            padding-bottom: 0;
                                            border-radius: 4px;
                                            font-weight: 700px;

                                            .logo {
                                                width: 1rem;
                                                margin-right: 0.5rem;
                                            }

                                            &:hover {
                                                background: rgba(109, 198, 193, 0.2) !important;
                                            }
                                        `}
                                    >
                                        <img src={kadoLogo} alt="kado" className="logo" />
                                        DEPOSIT
                                    </Button>
                                )}
                                <WalletMultiButton
                                    className={
                                        wallet.connected
                                            ? 'header__wallet_multi_button'
                                            : 'header__select_wallet_button'
                                    }
                                    children={
                                        wallet.connected ? (
                                            wallet.publicKey?.toBase58()?.slice(0, 5) +
                                            '...' +
                                            wallet.publicKey?.toBase58()?.slice(-5)
                                        ) : wallet.connecting ? (
                                            'Connecting...'
                                        ) : (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <FaWallet style={{ marginRight: '0.5rem', fontSize: '12px' }} />
                                                Select Wallet
                                            </div>
                                        )
                                    }
                                />
                            </Fragment>
                        )}
                        <Dropdown
                            className="header__dropdown"
                            trigger={['click']}
                            overlay={
                                <Menu
                                    mode="vertical"
                                    theme="dark"
                                    items={resourceItems}
                                    className="header__dropdown_menu"
                                    expandIcon={<span></span>}
                                />
                            }
                        >
                            <span className="header__dropdown_icon">
                                <FaEllipsisV />
                            </span>
                        </Dropdown>
                    </div>
                </div>
            ) : (
                <div className="vybe-header">
                    <div>
                        <AiOutlineMenu
                            onClick={(e) => {
                                setCollapsed(!collapsed);
                            }}
                            style={{ margin: '8px 24px 0px', fontSize: '20px', cursor: 'pointer' }}
                        />
                        <div>
                            {!collapsed && (
                                <Menu
                                    mode="inline"
                                    theme="dark"
                                    inlineCollapsed={collapsed}
                                    items={items}
                                    className="header__mobile_menu"
                                    subMenuCloseDelay={0}
                                    expandIcon={<span></span>}
                                    triggerSubMenuAction="click"
                                    {...(collapsed ? { openKeys: undefined } : {})}
                                />
                            )}
                        </div>
                    </div>
                    <div className="titles-header">
                        <NavLink to="/">
                            <Title level={5} style={vybeLogoWrapperStyle}>
                                <SERUMDEXLOGO />
                            </Title>
                        </NavLink>
                    </div>
                    <div className="wallet-dropdown-header">
                        {isRestricted ? (
                            <ProhibitedTooltip buttonType="full" />
                        ) : (
                            <WalletMultiButton
                                className={
                                    wallet.connected ? 'header__wallet_multi_button' : 'header__select_wallet_button'
                                }
                                style={{ fontSize: '0px' }}
                                children={
                                    wallet.connected ? (
                                        ''
                                    ) : wallet.connecting ? (
                                        'Connecting...'
                                    ) : (
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <FaWallet style={{ fontSize: '12px' }} />
                                        </div>
                                    )
                                }
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Header;
