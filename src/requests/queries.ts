import { gql } from "graphql-request";

export const MARKET_STATS = gql`
        query GetMarketStats {
            api_serum_dex_m {
            marketStats {
              marketName
              price
              priceChange
              v1d
              baseMint
              lastPrice
              marketAddress
              v7d
            }
        }
    }
  `

export const MARKET_VOLUME_STATS = gql`
    query GetOhlcvfByMarketAddress($resolution: String!, $to: Float!, $from: Float!, $marketAddress: String!) {
      api_serum_dex_m {
        ohlcvfValuesByMarketAddress(resolution: $resolution, to: $to, from: $from, marketAddress: $marketAddress) {
          t
          o
          h
          l
          c
          v
          f
        }
      }
    }
  `

export const MARKET_TVL_BY_MARKET_ADDRESS = gql`
  query GetMarketTvlByMarketAddress($marketAddress: String!) {
      api_serum_dex_m {
      marketTVLByMarketAddress(marketAddress: $marketAddress) {
          t
          tvl
      }
      }
  }
`

export const MARKET_STATS_BY_MARKET_ADDRESS = gql`
    query GetMarketStatsByMarketAddress($marketAddress: String!) {
      api_serum_dex_m {
        marketStatsByMarketAddress(marketAddress: $marketAddress) {
          marketName
          marketAddress
          baseMint
          baseVault
          quoteMint
          quoteVault
          price
          lastPrice
          priceChange
          v1db
          v1dq
          tvl
        }
      }
    }
  `

export const MARKET_TRADES_BY_MARKET_ADDRESS = gql`
    query GetMarketTradesByMarketAddress($marketAddress: String!) {
        api_serum_dex_m {
            marketTradesByMarketAddress(marketAddress: $marketAddress) {
                price
                size
                side
                time
            }
        }
    }`

export const GET_CHART_DATA = gql`
    query GetOhlcvfByMarketAddress($resolution: String!, $to: Float!, $from: Float!, $marketAddress: String!) {
      api_serum_dex_m {
        ohlcvfValuesByMarketAddress(resolution: $resolution, to: $to, from: $from, marketAddress: $marketAddress) {
          t
          o
          h
          l
          c
          v
          f
        }
      }
    }
  `

export const TOKEN_STATS = gql`
  query GetTokenStats {
    api_serum_dex_m {
      tokenStats {
        tokenName
        tokenMint
        usdcMarket
        lastPrice
        price
        v1d
        v2d
        v7d
        f1d
        f2d
        f7d
        tvl
      }
    }
  }
`

export const TOKEN_STATS_BY_ID = gql`
  query GetTokenStatsByTokenMint($tokenMint: String!) {
    api_serum_dex_m {
      tokenStatsByTokenMint(tokenMint: $tokenMint) {
        tokenName
        tokenMint
        usdcMarket
        lastPrice
        price
        v1d
        v2d
        v7d
        f1d
        f2d
        f7d
        tvl
      }
    }
  }
`

export const MARKET_TRADES_BY_OOA = gql`
  query GetMarketTradesByOOA($openOrdersAccount: String!) {
    api_serum_dex_m {
      marketTradesByOOA(openOrdersAccount: $openOrdersAccount) {
        feeCost
        price
        side
        size
        time
        type
      }
    }
  }
`

export const GLOBAL_TVL_STATS = gql`
  query GetGlobalTvlStats {
    api_serum_dex_m {
      globalTVLStats {
        t
        tvl
      }
    }
  }
`

export const GLOBAL_VOLUME_STATS = gql`
  query GetGlobalVolumeStats {
    api_serum_dex_m {
      globalVolumeStats {
        t
        v
      }
    }
  }
`

export const GLOBAL_TRADES = gql`
  query GetGlobalTrades {
    api_serum_dex_m {
      globalTrades {
        marketAddress
        baseMint
        quoteMint
        price
        size
        side
        time
        feeCost
      }
    }
  }
`