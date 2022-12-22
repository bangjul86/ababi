// Master chain list
// These are the chain pairs supported by the Graph Protocol
const ChainList = [
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

// Types
export type GraphChainPair = typeof ChainList[number]

export type GraphL1ChainId = GraphChainPair['l1']['id']
export type GraphL2ChainId = GraphChainPair['l2']['id']
export type GraphChainId = GraphL1ChainId | GraphL2ChainId

export type GraphL1ChainName = GraphChainPair['l1']['name']
export type GraphL2ChainName = GraphChainPair['l2']['name']
export type GraphChainName = GraphL1ChainName | GraphL2ChainName

// Type guards
export function isGraphL1ChainId(chainId: unknown): chainId is GraphL1ChainId {
  return typeof chainId === 'number' && l1Chains.includes(chainId as GraphL1ChainId)
}
export function isGraphL2ChainId(chainId: unknown): chainId is GraphL2ChainId {
  return typeof chainId === 'number' && l2Chains.includes(chainId as GraphL2ChainId)
}
export function isGraphChainId(chainId: unknown): chainId is GraphChainId {
  return typeof chainId === 'number' && (isGraphL1ChainId(chainId) || isGraphL2ChainId(chainId))
}

export function isGraphL1ChainName(chainName: unknown): chainName is GraphL1ChainName {
  return typeof chainName === 'string' && l1ChainNames.includes(chainName as GraphL1ChainName)
}
export function isGraphL2ChainName(chainName: unknown): chainName is GraphL2ChainName {
  return typeof chainName === 'string' && l2ChainNames.includes(chainName as GraphL2ChainName)
}
export function isGraphChainName(chainName: unknown): chainName is GraphChainName {
  return (
    typeof chainName === 'string' &&
    (isGraphL1ChainName(chainName) || isGraphL2ChainName(chainName))
  )
}

// Chain id
export const l1Chains: GraphL1ChainId[] = ChainList.map((c) => c.l1.id)
export const l2Chains: GraphL2ChainId[] = ChainList.map((c) => c.l2.id)
export const chains: GraphChainId[] = [...l1Chains, ...l2Chains]

// Chain name
export const l1ChainNames: GraphL1ChainName[] = ChainList.map((c) => c.l1.name)
export const l2ChainNames: GraphL2ChainName[] = ChainList.map((c) => c.l2.name)
export const chainNames: GraphChainName[] = [...l1ChainNames, ...l2ChainNames]

// L1 <> L2
export const l1ToL2 = (chainId: number): GraphChainId | undefined => {
  if (!isGraphChainId(chainId)) return
  const pair: GraphChainPair | undefined = ChainList.find((cp) => cp.l1.id === chainId)
  return pair ? pair.l2.id : undefined
}
export const l2ToL1 = (chainId: number): GraphChainId | undefined => {
  if (!isGraphChainId(chainId)) return
  const pair: GraphChainPair | undefined = ChainList.find((cp) => cp.l2.id === chainId)
  return pair ? pair.l1.id : undefined
}
export const counterpart = (chainId: number): GraphChainId | undefined => {
  if (!isGraphChainId(chainId)) return
  return isGraphL1ChainId(chainId) ? l1ToL2(chainId) : l2ToL1(chainId)
}

export const l1ToL2Name = (name: string): GraphChainName | undefined => {
  if (!isGraphChainName(name)) return
  const pair: GraphChainPair | undefined = ChainList.find((cp) => cp.l1.name === name)
  return pair ? pair.l2.name : undefined
}
export const l2ToL1Name = (name: string): GraphChainName | undefined => {
  if (!isGraphChainName(name)) return
  const pair: GraphChainPair | undefined = ChainList.find((cp) => cp.l2.name === name)
  return pair ? pair.l1.name : undefined
}
export const counterpartName = (name: string): GraphChainName | undefined => {
  if (!isGraphChainName(name)) return
  return isGraphL1ChainName(name) ? l1ToL2Name(name) : l2ToL1Name(name)
}
