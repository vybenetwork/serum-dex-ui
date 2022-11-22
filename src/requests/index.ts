import axios from 'axios';
import {
    GET_CHART_DATA,
    MARKET_STATS, 
    TOKEN_STATS,
    MARKET_STATS_BY_MARKET_ADDRESS,
    MARKET_TRADES_BY_MARKET_ADDRESS,
    MARKET_TRADES_BY_OOA,
    MARKET_VOLUME_STATS,
    MARKET_TVL_BY_MARKET_ADDRESS,
    TOKEN_STATS_BY_ID,
    GLOBAL_TVL_STATS,
    GLOBAL_VOLUME_STATS,
    GLOBAL_TRADES
} from 'requests/queries';
import { roundDownUnixTimeMs } from 'utils';

const graphqlApiUrl = process.env.REACT_APP_VYBE_GRAPHQL_API || 'https://api.vybenetwork.com/v1/graphql';

const headers = {
    headers: {
        Authorization: 'f6323c2b-6efb-4bab-98c4-957392a6366f'
    },
}

export const gqlMarketStats = async () => {
    return axios.post(graphqlApiUrl, { query: MARKET_STATS }, headers);
}

export const gqlTokenStats = async () => {
    return axios.post(graphqlApiUrl, { query: TOKEN_STATS }, headers);
}

export const gqlGlobalTVLStats = async () => {
    return axios.post(graphqlApiUrl, { query: GLOBAL_TVL_STATS }, headers);
}

export const gqlGlobalVolumeStats = async () => {
    return axios.post(graphqlApiUrl, { query: GLOBAL_VOLUME_STATS }, headers);
}

export const gqlGlobalTrades = async () => {
    return axios.post(graphqlApiUrl, { query: GLOBAL_TRADES }, headers);
}

export const gqlTokenStatsByID = async (tokenMint: string) => {
    let variables = {
        tokenMint: tokenMint
    }

    return axios.post(graphqlApiUrl, { query: TOKEN_STATS_BY_ID, variables: variables }, headers);
}

export const gqlMarketTradesByOOA = async (openOrdersAccount: string) => {
    let variables = {
        openOrdersAccount: openOrdersAccount
    }

    return axios.post(graphqlApiUrl, { query: MARKET_TRADES_BY_OOA, variables: variables }, headers);
}

export const gqlMarketStatsByAddress = async (marketAddress: string) => {
    let variables = {
        marketAddress: marketAddress
    }

    return axios.post(graphqlApiUrl, { query: MARKET_STATS_BY_MARKET_ADDRESS, variables: variables }, headers);
}

export const gqlMarketTradesByAddress = async (marketAddress: string) => {
    let variables = {
        marketAddress: marketAddress
    }

    return axios.post(graphqlApiUrl, { query: MARKET_TRADES_BY_MARKET_ADDRESS, variables: variables }, headers);
}

export const gqlMarketTVLByAddress = async (marketAddress: string) => {
    let variables = {
        marketAddress: marketAddress
    }

    return axios.post(graphqlApiUrl, { query: MARKET_TVL_BY_MARKET_ADDRESS, variables: variables }, headers);
}

export const gqlMarketVolumeData = async (marketAddress: string) => {
    let now = Date.now();
    
    let variables = {
        resolution: '1D',
        from: roundDownUnixTimeMs(now),
        to: roundDownUnixTimeMs(now - 24 * 60 * 60),
        marketAddress
    }

    return axios.post(graphqlApiUrl, { query: MARKET_VOLUME_STATS, variables: variables }, headers);
}

export const gqlChartData = async (marketAddress: string) => {
        
    let variables = {
        resolution: '180',
        to: Math.floor(Date.now() / 60000) * 60,
        from: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 60000) * 60,
        marketAddress
    }

    return axios.post(graphqlApiUrl, { query: GET_CHART_DATA, variables: variables }, headers);
}
