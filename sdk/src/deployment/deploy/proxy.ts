import { loadArtifact } from './artifacts'
import { AddressBook } from '../address-book'
import { deployContract, deployContractAndSave } from './contract'

import type { Contract, Signer } from 'ethers'
import type { ContractParam, DeployResult } from '../types'
import { hashHexString } from '../../utils/byte'

/**
 * Deploys a proxy contract
 *
 * @remarks
 * This function won't deploy the implementation for the proxy, this must be done beforehand via {@link deployContract} or alltogether via {@link deployContractWithProxy}
 * If needed, the proxy admin must accept the implementation on the proxy contract.
 * This function can deploy any proxy contract as long as the constructor has the following signature:
 * `constructor(address implementation, address admin)`
 *
 * @privateRemarks This might not be worth it and instead we could just limit to `GraphProxy` contract
 *
 * @param sender Signer to deploy the contract with, must be already connected to a provider
 * @param name Name of the proxy contract to deploy
 * @param implementationAddress Address of the initial implementation contract
 * @param adminAddress Address of the proxy admin
 * @returns
 *
 * @throws Error if the sender is not connected to a provider
 */
export const deployProxy = async (
  sender: Signer,
  name: string,
  implementationAddress: string,
  adminAddress: string,
): Promise<DeployResult> => {
  return deployContract(sender, name, [implementationAddress, adminAddress], false)
}

/**
 * Deploys a contract with a proxy
 *
 * @remarks Sets a contract as the proxy admin
 * @remarks The proxy admin needs to
 * @remarks This function can deploy any proxy contract as long as the constructor has the following signature:
 * `constructor(address implementation, address admin)`
 *
 * @param sender Signer to deploy the contract with, must be already connected to a provider
 * @param name Name of the contract to deploy
 * @param args Contract constructor arguments
 * @param proxyName Name of the proxy contract to deploy
 * @param proxyAdmin Contract to be used as the proxy admin
 * @param buildAcceptTx If set to true it will build the accept tx and print it to the console. Defaults to `false`
 * @returns the deployed contract with the proxy address
 *
 * @throws Error if the sender is not connected to a provider
 */
export const deployContractWithProxy = async (
  sender: Signer,
  name: string,
  args: Array<ContractParam>,
  proxyName: string,
  proxyAdmin: Contract,
  buildAcceptTx = false,
): Promise<Contract> => {
  // Deploy implementation
  const { contract } = await deployContract(sender, name, [])

  // Deploy proxy
  const { contract: proxy } = await deployContract(
    sender,
    proxyName,
    [contract.address, proxyAdmin.address],
    false,
  )

  // Accept implementation upgrade
  await proxyAdminAcceptUpgrade(sender, contract, args, proxyAdmin, proxy.address, buildAcceptTx)

  // Use interface of contract but with the proxy address
  return contract.attach(proxy.address)
}

/**
 * Deploys a contract with a proxy and saves the deployment result to the address book
 *
 * @remarks Same as {@link deployContractWithProxy} but this variant will also save the deployment result to the address book.
 *
 * @param proxyName Name of the proxy contract to deploy
 * @param proxyAdmin Proxy admin contract
 * @param name Name of the contract to deploy
 * @param args Contract constructor arguments
 * @param sender Signer to deploy the contract with, must be already connected to a provider
 * @param buildAcceptTx If set to true it will build the accept tx and print it to the console. Defaults to `false`
 * @returns the deployed contract with the proxy address
 *
 * @throws Error if the sender is not connected to a provider
 */
export const deployContractWithProxyAndSave = async (
  sender: Signer,
  name: string,
  args: Array<ContractParam>,
  proxyName: string,
  proxyAdmin: Contract,
  addressBook: AddressBook,
  buildAcceptTx?: boolean,
): Promise<Contract> => {
  // Deploy implementation
  const { contract } = await deployContractAndSave(sender, name, [], addressBook)

  // Deploy proxy
  const { contract: proxy } = await deployContract(
    sender,
    proxyName,
    [contract.address, proxyAdmin.address],
    false,
  )

  // Accept implementation upgrade
  await proxyAdminAcceptUpgrade(sender, contract, args, proxyAdmin, proxy.address, buildAcceptTx)

  // Overwrite address entry with proxy
  const artifact = loadArtifact(proxyName)
  const contractEntry = addressBook.getEntry(name)

  if (!sender.provider) {
    throw Error('Sender must be connected to a provider')
  }

  addressBook.setEntry(name, {
    address: proxy.address,
    initArgs: args.length === 0 ? undefined : args.map((e) => e.toString()),
    creationCodeHash: hashHexString(artifact.bytecode),
    runtimeCodeHash: hashHexString(await sender.provider.getCode(proxy.address)),
    txHash: proxy.deployTransaction.hash,
    proxy: true,
    implementation: contractEntry,
  })
  console.info('> Contract saved to address book')

  // Use interface of contract but with the proxy address
  return contract.attach(proxy.address)
}

/**
 * Accepts an upgrade for a proxy contract managed by a proxy admin
 *
 * @remarks Initializes the implementation if init arguments are provided
 *
 * @privateRemarks This function is highly specific to the graph protocol proxy system
 *
 * @param sender Signer to make the call to the proxy admin contract
 * @param contract Implementation contract
 * @param args Implementation initialization arguments
 * @param proxyAdmin Proxy admin contract
 * @param buildAcceptTx If set to true it will build the accept tx and print it to the console. Defaults to `false`
 */
const proxyAdminAcceptUpgrade = async (
  sender: Signer,
  contract: Contract,
  args: Array<ContractParam>,
  proxyAdmin: Contract,
  proxyAddress: string,
  buildAcceptTx = false,
) => {
  const initTx = args ? await contract.populateTransaction.initialize(...args) : null
  const acceptFunctionName = initTx ? 'acceptProxyAndCall' : 'acceptProxy'
  const acceptFunctionParams = initTx
    ? [contract.address, proxyAddress, initTx.data]
    : [contract.address, proxyAddress]

  if (buildAcceptTx) {
    console.info(
      `
      Copy this data in the Gnosis Multisig UI, or a similar app and call ${acceptFunctionName}
      --------------------------------------------------------------------------------------
        > Contract Address:  ${proxyAdmin.address}
        > Implementation:    ${contract.address}
        > Proxy:             ${proxyAddress}
        > Data:              ${initTx && initTx.data}
      `,
    )
  } else {
    await proxyAdmin.connect(sender)[acceptFunctionName](...acceptFunctionParams)
  }
}
