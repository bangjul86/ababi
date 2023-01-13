import { AddressBook } from '../address-book'
import { loadArtifact } from './artifacts'
import { getContractFactory } from './factory'
import { hashHexString } from '../../utils/byte'

import type { Signer } from 'ethers'
import type { ContractParam, DeployResult } from '../types'

/**
 * Deploys a contract
 *
 * @remarks This function will autolink, that means it will automatically deploy external libraries
 * and link them to the contract if needed
 *
 * @param sender Signer to deploy the contract with, must be already connected to a provider
 * @param name Name of the contract to deploy
 * @param args Contract constructor arguments
 * @param autolink Wether or not to autolink. Defaults to true.
 * @returns the deployed contract and deployment metadata associated to it
 *
 * @throws Error if the sender is not connected to a provider
 */
export const deployContract = async (
  sender: Signer,
  name: string,
  args: Array<ContractParam>,
  autolink = true,
): Promise<DeployResult> => {
  if (!sender.provider) {
    throw Error('Sender must be connected to a provider')
  }

  // Autolink
  const libraries = {}
  if (autolink) {
    const artifact = loadArtifact(name)
    if (artifact.linkReferences && Object.keys(artifact.linkReferences).length > 0) {
      for (const fileReferences of Object.values(artifact.linkReferences)) {
        for (const libName of Object.keys(fileReferences)) {
          const deployResult = await deployContract(sender, libName, [], false)
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

/**
 * Deploys a contract and saves the deployment result to the address book
 *
 * @remarks Same as {@link deployContract} but this variant will also save the deployment result to the address book.
 *
 * @param sender Signer to deploy the contract with, must be already connected to a provider
 * @param name Name of the contract to deploy
 * @param args Contract constructor arguments
 * @param addressBook Address book to save the deployment result to
 * @returns the deployed contract and deployment metadata associated to it
 *
 * @throws Error if the sender is not connected to a provider
 */
export const deployContractAndSave = async (
  sender: Signer,
  name: string,
  args: Array<ContractParam>,
  addressBook: AddressBook,
): Promise<DeployResult> => {
  // Deploy the contract
  const deployResult = await deployContract(sender, name, args)

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

  return deployResult
}
