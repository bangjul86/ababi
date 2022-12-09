import { providers, Signer } from 'ethers'

import { GraphChainId, isGraphChainId, isGraphL1ChainId } from '../cross-chain'
import { assertObject } from '../deployment/utils'
import { loadContracts } from '../deployment/contract'
import { AddressBookJson, getAddressBook } from '../deployment/address-book'

// Get contract types from built artifacts
// TODO: this needs to be imported from published npm package once we make the sdk a standalone package
import { EpochManager } from '../../build/types/EpochManager'
import { DisputeManager } from '../../build/types/DisputeManager'
import { Staking } from '../../build/types/Staking'
import { ServiceRegistry } from '../../build/types/ServiceRegistry'
import { Curation } from '../../build/types/Curation'
import { RewardsManager } from '../../build/types/RewardsManager'
import { GNS } from '../../build/types/GNS'
import { GraphProxyAdmin } from '../../build/types/GraphProxyAdmin'
import { GraphToken } from '../../build/types/GraphToken'
import { Controller } from '../../build/types/Controller'
import { BancorFormula } from '../../build/types/BancorFormula'
import { IENS } from '../../build/types/IENS'
import { AllocationExchange } from '../../build/types/AllocationExchange'
import { SubgraphNFT } from '../../build/types/SubgraphNFT'
import { GraphCurationToken } from '../../build/types/GraphCurationToken'
import { SubgraphNFTDescriptor } from '../../build/types/SubgraphNFTDescriptor'
import { L1GraphTokenGateway } from '../../build/types/L1GraphTokenGateway'
import { L2GraphToken } from '../../build/types/L2GraphToken'
import { L2GraphTokenGateway } from '../../build/types/L2GraphTokenGateway'
import { BridgeEscrow } from '../../build/types/BridgeEscrow'

// Graph Network Contract types
export interface GraphNetworkContracts {
  EpochManager: EpochManager
  DisputeManager: DisputeManager
  Staking: Staking
  ServiceRegistry: ServiceRegistry
  Curation: Curation
  RewardsManager: RewardsManager
  GNS: GNS
  GraphProxyAdmin: GraphProxyAdmin
  GraphToken: GraphToken
  Controller: Controller
  BancorFormula: BancorFormula
  IENS?: IENS
  AllocationExchange: AllocationExchange
  SubgraphNFT: SubgraphNFT
  SubgraphNFTDescriptor: SubgraphNFTDescriptor
  GraphCurationToken: GraphCurationToken

  // Only L1
  L1GraphTokenGateway?: L1GraphTokenGateway
  BridgeEscrow?: BridgeEscrow

  // Only L2
  L2GraphToken?: L2GraphToken
  L2GraphTokenGateway?: L2GraphTokenGateway
}

// TODO: can we get rid of the duplicate list?
const GraphNetworkSharedContractNameList = [
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
const GraphNetworkOptionalContractNameList = ['IENS'] as const
const GraphNetworkL1ContractNameList = [
  'GraphToken',
  'BridgeEscrow',
  'L1GraphTokenGateway',
] as const
const GraphNetworkL2ContractNameList = ['L2GraphToken', 'L2GraphTokenGateway'] as const

const GraphNetworkContractNameList = [
  ...GraphNetworkSharedContractNameList,
  ...GraphNetworkOptionalContractNameList,
  ...GraphNetworkL1ContractNameList,
  ...GraphNetworkL2ContractNameList,
] as const

export type GraphNetworkContractName = typeof GraphNetworkContractNameList[number]

// GraphNetworkContractName type guard
function isGraphNetworkContractName(name: unknown): name is GraphNetworkContractName {
  return (
    typeof name === 'string' &&
    GraphNetworkContractNameList.includes(name as GraphNetworkContractName)
  )
}

// Asserts the provided object is a valid address book
// Logs warnings for unsupported chain ids or invalid contract names
function assertGraphAddressBook(json: unknown): asserts json is AddressBookJson {
  assertObject(json)

  for (const chainId of Object.keys(json)) {
    // Validate chain id
    if (!isGraphChainId(parseInt(chainId)))
      console.warn(`Chain id ${chainId} is not supported by the Graph Network`)

    // Validate contract names
    const contractList = json[chainId]
    assertObject(contractList)

    const contractNames = Object.keys(contractList)
    if (!contractNames.every((c) => isGraphNetworkContractName(c))) {
      console.error(
        `Detected invalid GraphNetworkContract in address book: ${contractNames.filter(
          (c) => !isGraphNetworkContractName(c),
        )}, for chainId ${chainId}`,
      )
    }
  }
}

function assertGraphNetworkContracts(
  contracts: unknown,
  chainId: GraphChainId,
): asserts contracts is GraphNetworkContracts {
  assertObject(contracts)

  // Allow contracts not defined in GraphNetworkContractNameList but raise a warning
  const contractNames = Object.keys(contracts)
  if (!contractNames.every((c) => isGraphNetworkContractName(c))) {
    console.warn(
      `Loaded invalid GraphNetworkContract: ${contractNames.filter(
        (c) => !isGraphNetworkContractName(c),
      )}`,
    )
  }

  // Assert that all shared GraphNetworkContracts were loaded
  for (const contractName of GraphNetworkSharedContractNameList) {
    if (!contracts[contractName]) {
      throw new Error(`Missing GraphNetworkContract ${contractName} for chainId ${chainId}`)
    }
  }

  // Assert that L1/L2 specific GraphNetworkContracts were loaded
  const layerSpecificContractNames = isGraphL1ChainId(chainId)
    ? GraphNetworkL1ContractNameList
    : GraphNetworkL2ContractNameList
  for (const contractName of layerSpecificContractNames) {
    if (!contracts[contractName]) {
      throw new Error(`Missing GraphNetworkContract ${contractName} for chainId ${chainId}`)
    }
  }
}

export function loadGraphNetworkContracts(
  addressBookPath: string,
  chainId: GraphChainId,
  signerOrProvider?: Signer | providers.Provider,
): GraphNetworkContracts {
  const addressBook = getAddressBook(addressBookPath, chainId)
  assertGraphAddressBook(addressBook.json)

  const contracts = loadContracts(addressBook, signerOrProvider, true)
  assertGraphNetworkContracts(contracts, chainId)

  return contracts
}
