import { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

import { useTokenMap } from 'utils/token';

import './TokenIcon.less';

const TokenIcon = ({ mint, logoUrl, ...props }: { mint: string; logoUrl?: string; [x: string]: any }) => {
    const [urlErr, setUrlErr] = useState(false);
    const tokenMap = useTokenMap();

    const token = tokenMap.get(mint);

    if (!urlErr && (logoUrl || (token && token.logoURI))) {
        return (
            <img
                src={logoUrl ?? token.logoURI}
                onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    setUrlErr(true);
                    // currentTarget.src = vybelogo;
                }}
                alt={mint}
                className="token-icon"
                {...props}
            />
        );
    }

    return <FaQuestionCircle className="token-icon" {...props} />;
};

export default TokenIcon;
