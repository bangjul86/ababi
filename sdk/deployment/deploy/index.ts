import { BigNumber, Contract, providers } from 'ethers'
import { AddressBook } from '../address-book'
import { loadArtifact } from '../artifacts'
import { hashHexString } from '../utils'

export type DeployResult = {
  contract: Contract
  creationCodeHash: string
  runtimeCodeHash: string
  txHash: string
  libraries?: { [libraryName: string]: string }
}

export type ContractParam = string | BigNumber | number

// Simple sanity checks to make sure contracts from our address book have been deployed
export const isContractDeployed = async (
  name: string,
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
  const artifact = addressEntry.proxy === true ? loadArtifact('GraphProxy') : loadArtifact(name)

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

export * from './contract'
export * from './proxy'
