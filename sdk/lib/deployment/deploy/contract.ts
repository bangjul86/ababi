import { Contract, Overrides, Signer } from 'ethers'
import { ContractParam, DeployResult } from '.'
import { AddressBook } from '../address-book'
import { loadArtifact } from '../artifacts'
import { getContractFactory } from '../contract'
import { hashHexString } from '../utils'

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
