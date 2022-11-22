import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
  uri: '',
})

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  // return the headers to the context so httpLink can read them
  return {
    headers
  }
})

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      // fetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'no-cache',
      // fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
})
