import { useQuery } from 'react-query';

export const ooaOwners = [
    { name: 'Alameda', owner: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq' },
    { name: 'Alameda', owner: 'HtJAWMsSRXbyBvXm1F4PDnGFzhgfBAPciyHWMZgugejX' },
    { name: 'Alameda', owner: '5Xm6nU1Bi6UewCrhJQFk1CAV97ZJaRiFw4tFNhUbXy3u' },
    { name: 'Mango', owner: '9BVcYqEQxyccuwznvxXqDkSJFavvTyheiTYk231T1A8S' },
    { name: 'Atrix', owner: '3uTzTX5GBSfbW7eM9R9k95H7Txe32Qw3Z25MtyD2dzwC' },
    { name: 'Raydium', owner: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' },
    { name: 'Raydium', owner: '3uaZBfHPfmpAHW7dsimC1SnyR61X4bJqQZKWmRSCXJxv' },
    { name: 'Jump', owner: '5xoBq7f7CDgZwqHrDBdRWM84ExRetg4gZq93dyJtoSwp' },
    { name: 'Wintermute', owner: 'CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf' },
];

export const useOoaOwners = (ooas: string[]) => {
    const ooaOwners = useQuery(
        ['ooaOwners', ooas],
        async () => {
            return [];
        },
        {
            enabled: ooas.length > 0,
        },
    );

    return ooaOwners;
};
