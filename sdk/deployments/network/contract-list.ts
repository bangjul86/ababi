// List of contract names for the Graph Network

export const GraphNetworkSharedContractNameList = [
  'EpochManager',
  'DisputeManager',
  'Staking',
  'ServiceRegistry',
  'Curation',
  'RewardsManager',
  'GNS',
  'GraphProxyAdmin',
  'Controller',
  'BancorFormula',
  // 'GraphGovernance',
  'AllocationExchange',
  'SubgraphNFT',
  'SubgraphNFTDescriptor',
  'GraphCurationToken',
] as const
export const GraphNetworkOptionalContractNameList = ['IENS'] as const
export const GraphNetworkL1ContractNameList = [
  'GraphToken',
  'BridgeEscrow',
  'L1GraphTokenGateway',
] as const
export const GraphNetworkL2ContractNameList = ['L2GraphToken', 'L2GraphTokenGateway'] as const

export const GraphNetworkContractNameList = [
  ...GraphNetworkSharedContractNameList,
  ...GraphNetworkOptionalContractNameList,
  ...GraphNetworkL1ContractNameList,
  ...GraphNetworkL2ContractNameList,
] as const

export type GraphNetworkContractName = typeof GraphNetworkContractNameList[number]

export function isGraphNetworkContractName(name: unknown): name is GraphNetworkContractName {
  return (
    typeof name === 'string' &&
    GraphNetworkContractNameList.includes(name as GraphNetworkContractName)
  )
}
