import { BaseContract, Contract, providers, Signer } from 'ethers'

import { AddressBook } from '../address-book'
import { loadArtifact } from '../artifacts'
import { getWrappedConnect, wrapCalls } from './tx-logging'

export const getContractAt = (
  name: string,
  address: string,
  signerOrProvider?: Signer | providers.Provider,
): Contract => {
  return new Contract(address, loadArtifact(name).abi, signerOrProvider)
}

export function loadContract(
  contractName: string,
  addressBook: AddressBook,
  signerOrProvider?: Signer | providers.Provider,
  enableTxLogging = true,
): BaseContract {
  const contractEntry = addressBook.getEntry(contractName)

  try {
    let contract = getContractAt(contractName, contractEntry.address)

    if (enableTxLogging) {
      contract.connect = getWrappedConnect(contract, contractName)
      contract = wrapCalls(contract, contractName)
    }

    if (signerOrProvider) {
      contract = contract.connect(signerOrProvider)
    }

    return contract
  } catch (err) {
    console.error(err.message)
    throw new Error(`Could not load contract ${contractName} - ${err.message}`)
  }
}

export const loadContracts = (
  addressBook: AddressBook,
  signerOrProvider?: Signer | providers.Provider,
  enableTXLogging = true,
): Record<string, BaseContract> => {
  const contracts = {}
  for (const contractName of addressBook.listEntries()) {
    const contract = loadContract(contractName, addressBook, signerOrProvider, enableTXLogging)
    contracts[contractName] = contract
  }
  return contracts
}
