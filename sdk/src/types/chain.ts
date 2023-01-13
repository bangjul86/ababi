/**
 * Master chain list for all the chain pairs supported by the Graph Protocol
 * See {@link GraphChainPair} for details on the structure of a chain pair
 * @enum
 */
export const ChainList = [
  {
    l1: {
      id: 1,
      name: 'mainnet',
    },
    l2: {
      id: 42161,
      name: 'arbitrum-one',
    },
  },
  {
    l1: {
      id: 4,
      name: 'rinkeby',
    },
    l2: {
      id: 421611,
      name: 'arbitrum-rinkeby',
    },
  },
  {
    l1: {
      id: 5,
      name: 'goerli',
    },
    l2: {
      id: 421613,
      name: 'arbitrum-goerli',
    },
  },
  {
    l1: {
      id: 1337,
      name: 'localnitrol1',
    },
    l2: {
      id: 412346,
      name: 'localnitrol2',
    },
  },
] as const

/**
 * A chain pair is an object containing a valid L1 and L2 chain pairing
 *
 * @example
 * {
 *   l1: {
 *     id: 1,
 *     name: 'mainnet',
 *   },
 *   l2: {
 *     id: 42161,
 *     name: 'arbitrum-one',
 *   },
 * }
 */
export type GraphChainPair = typeof ChainList[number]

/** L1 chain ids supported by the protocol */
export type GraphL1ChainId = GraphChainPair['l1']['id']
/** L2 chain ids supported by the protocol */
export type GraphL2ChainId = GraphChainPair['l2']['id']
/** L1 and L2 chain ids supported by the protocol */
export type GraphChainId = GraphL1ChainId | GraphL2ChainId

/** L1 chain names supported by the protocol */
export type GraphL1ChainName = GraphChainPair['l1']['name']
/** L2 chain names supported by the protocol */
export type GraphL2ChainName = GraphChainPair['l2']['name']
/** L1 and L2 chain names supported by the protocol */
export type GraphChainName = GraphL1ChainName | GraphL2ChainName
