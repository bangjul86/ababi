import { providers, Signer } from 'ethers/lib/ethers'

import { GraphChainId } from '../../lib/cross-chain'
import { getAddressBook } from '../../lib/deployment/address-book'
import { loadContracts } from '../../lib/deployment/contract'

import { assertGraphNetworkAddressBook } from './address-book'
import { GraphNetworkContractName } from './contract-list'
import { assertGraphNetworkContracts, GraphNetworkContracts } from './contracts'

export function loadGraphNetworkContracts(
  addressBookPath: string,
  chainId: GraphChainId,
  signerOrProvider?: Signer | providers.Provider,
): GraphNetworkContracts {
  const addressBook = getAddressBook(addressBookPath, chainId)
  assertGraphNetworkAddressBook(addressBook.json)

  const contracts = loadContracts<GraphNetworkContractName>(addressBook, signerOrProvider, true)
  assertGraphNetworkContracts(contracts, chainId)

  return contracts
}
