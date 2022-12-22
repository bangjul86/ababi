import { Contract, Overrides, Signer, providers } from 'ethers'
import { ContractParam, DeployResult } from '.'
import { AddressBook } from '../address-book'
import { loadArtifact } from '../artifacts'
import { getContractFactory } from '../contract'
import { hashHexString } from '../../utils'

// Simple sanity checks to make sure contracts from our address book have been deployed
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

export const deployContract = async (
  name: string,
  args: Array<ContractParam>,
  sender: Signer,
  autolink = true,
  overrides?: Overrides,
): Promise<DeployResult> => {
  if (!sender.provider) {
    throw Error('Sender must be connected to a provider')
  }

  // This function will autolink, that means it will automatically deploy external libraries
  // and link them to the contract
  const libraries = {}
  if (autolink) {
    const artifact = loadArtifact(name)
    if (artifact.linkReferences && Object.keys(artifact.linkReferences).length > 0) {
      for (const fileReferences of Object.values(artifact.linkReferences)) {
        for (const libName of Object.keys(fileReferences)) {
          const deployResult = await deployContract(libName, [], sender, false, overrides)
          libraries[libName] = deployResult.contract.address
        }
      }
    }
  }

  // Deploy
  const factory = getContractFactory(name, libraries)
  const contract = await factory.connect(sender).deploy(...args)
  const txHash = contract.deployTransaction.hash
  console.info(`> Deploy ${name}, txHash: ${txHash}`)
  await sender.provider.waitForTransaction(txHash)

  // Receipt
  const creationCodeHash = hashHexString(factory.bytecode)
  const runtimeCodeHash = hashHexString(await sender.provider.getCode(contract.address))
  console.info(`= CreationCodeHash: ${creationCodeHash}`)
  console.info(`= RuntimeCodeHash: ${runtimeCodeHash}`)
  console.info(`${name} has been deployed to address: ${contract.address}`)

  return { contract, creationCodeHash, runtimeCodeHash, txHash, libraries }
}

export const deployContractAndSave = async (
  name: string,
  args: Array<ContractParam>,
  sender: Signer,
  addressBook: AddressBook,
): Promise<Contract> => {
  // Deploy the contract
  const deployResult = await deployContract(name, args, sender)

  // Save address entry
  addressBook.setEntry(name, {
    address: deployResult.contract.address,
    constructorArgs: args.length === 0 ? undefined : args.map((e) => e.toString()),
    creationCodeHash: deployResult.creationCodeHash,
    runtimeCodeHash: deployResult.runtimeCodeHash,
    txHash: deployResult.txHash,
    libraries:
      deployResult.libraries && Object.keys(deployResult.libraries).length > 0
        ? deployResult.libraries
        : undefined,
  })
  console.info('> Contract saved to address book')

  return deployResult.contract
}
