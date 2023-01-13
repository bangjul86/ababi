import { Contract, providers, Signer } from 'ethers'
import { AddressBook } from '../address-book'
import { loadArtifact } from '../deploy/artifacts'
import { getWrappedConnect, wrapCalls } from './tx-log'

import type { ContractList } from '../types'
import { hashHexString } from '../../utils/byte'

/**
 * Loads a contract instance for a given contract name and address
 *
 * @param name Name of the contract
 * @param address Address of the contract
 * @param signerOrProvider Signer or provider to use
 * @returns the loaded contract
 */
export const loadContractAt = (
  name: string,
  address: string,
  signerOrProvider?: Signer | providers.Provider,
): Contract => {
  return new Contract(address, loadArtifact(name).abi, signerOrProvider)
}

/**
 * Loads a contract from an address book
 *
 * @param name Name of the contract
 * @param addressBook Address book to use
 * @param signerOrProvider Signer or provider to use
 * @param enableTxLogging Enable transaction logging to console and output file. Defaults to `true`
 * @returns the loaded contract
 *
 * @throws Error if the contract could not be loaded
 */
export function loadContract(
  name: string,
  addressBook: AddressBook,
  signerOrProvider?: Signer | providers.Provider,
  enableTxLogging = true,
): Contract {
  const contractEntry = addressBook.getEntry(name)

  try {
    let contract = loadContractAt(name, contractEntry.address)

    if (enableTxLogging) {
      contract.connect = getWrappedConnect(contract, name)
      contract = wrapCalls(contract, name)
    }

    if (signerOrProvider) {
      contract = contract.connect(signerOrProvider)
    }

    return contract
  } catch (err) {
    console.error(err.message)
    throw new Error(`Could not load contract ${name} - ${err.message}`)
  }
}

/**
 * Loads all contracts from an address book
 *
 * @param addressBook Address book to use
 * @param signerOrProvider Signer or provider to use
 * @param enableTxLogging Enable transaction logging to console and output file. Defaults to `true`
 * @returns the loaded contracts
 */
export const loadContracts = <T extends string = string>(
  addressBook: AddressBook,
  signerOrProvider?: Signer | providers.Provider,
  enableTXLogging = true,
): ContractList<T> => {
  const contracts = {} as ContractList<T>
  for (const contractName of addressBook.listEntries()) {
    const contract = loadContract(contractName, addressBook, signerOrProvider, enableTXLogging)
    contracts[contractName] = contract
  }
  return contracts
}

/**
 * Checks wether a contract is deployed or not
 *
 * @param name Name of the contract to check
 * @param proxyName Name of the contract proxy if there is one
 * @param address Address of the contract
 * @param addressBook Address book to use
 * @param provider Provider to use
 * @param checkCreationCode Check the creation code of the contract. Defaults to `true`
 * @returns `true` if the contract is deployed, `false` otherwise.
 */
export const isContractDeployed = async (
  name: string,
  proxyName: string,
  address: string | undefined,
  addressBook: AddressBook,
  provider: providers.Provider,
  checkCreationCode = true,
): Promise<boolean> => {
  console.info(`Checking for valid ${name} contract...`)
  if (!address || address === '') {
    console.warn('This contract is not in our address book.')
    return false
  }

  const addressEntry = addressBook.getEntry(name)

  // If the contract is behind a proxy we check the Proxy artifact instead
  const artifact = addressEntry.proxy === true ? loadArtifact(proxyName) : loadArtifact(name)

  if (checkCreationCode) {
    const savedCreationCodeHash = addressEntry.creationCodeHash
    const creationCodeHash = hashHexString(artifact.bytecode)
    if (!savedCreationCodeHash || savedCreationCodeHash !== creationCodeHash) {
      console.warn(`creationCodeHash in our address book doesn't match ${name} artifacts`)
      console.info(`${savedCreationCodeHash} !== ${creationCodeHash}`)
      return false
    }
  }

  const savedRuntimeCodeHash = addressEntry.runtimeCodeHash
  const runtimeCodeHash = hashHexString(await provider.getCode(address))
  if (runtimeCodeHash === hashHexString('0x00') || runtimeCodeHash === hashHexString('0x')) {
    console.warn('No runtimeCode exists at the address in our address book')
    return false
  }
  if (savedRuntimeCodeHash !== runtimeCodeHash) {
    console.warn(`runtimeCodeHash for ${address} does not match what's in our address book`)
    console.info(`${savedRuntimeCodeHash} !== ${runtimeCodeHash}`)
    return false
  }
  return true
}
