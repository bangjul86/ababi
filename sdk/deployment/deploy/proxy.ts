import { Contract, Overrides, Signer } from 'ethers'

import { hashHexString } from '../utils'
import { getContractAt } from '../contract/contract'
import { loadArtifact } from '../artifacts'
import { AddressBook } from '../address-book'
import { deployContract, deployContractAndSave } from './contract'

import { ContractParam, DeployResult } from '.'

export const deployProxy = async (
  proxyName: string,
  implementationAddress: string,
  proxyAdminAddress: string,
  sender: Signer,
  overrides?: Overrides,
): Promise<DeployResult> => {
  return deployContract(
    proxyName,
    [implementationAddress, proxyAdminAddress],
    sender,
    false,
    overrides,
  )
}

export const deployContractWithProxy = async (
  proxyName: string,
  proxyAdmin: Contract,
  name: string,
  args: Array<ContractParam>,
  sender: Signer,
  buildAcceptProxyTx = false,
  overrides?: Overrides,
): Promise<Contract> => {
  // Deploy implementation
  const { contract } = await deployContract(name, [], sender, true, overrides)

  // Wrap implementation with proxy
  const proxy = await wrapContractWithProxy(
    proxyName,
    proxyAdmin,
    contract,
    args,
    sender,
    buildAcceptProxyTx,
    overrides,
  )

  // Use interface of contract but with the proxy address
  return contract.attach(proxy.address)
}

export const deployContractWithProxyAndSave = async (
  name: string,
  proxyName: string,
  args: Array<ContractParam>,
  sender: Signer,
  addressBook: AddressBook,
  buildAcceptProxyTx?: boolean,
): Promise<Contract> => {
  if (!sender.provider) {
    throw Error('Sender must be connected to a provider')
  }
  // Get the GraphProxyAdmin to own the GraphProxy for this contract
  const proxyAdminEntry = addressBook.getEntry('GraphProxyAdmin')
  if (!proxyAdminEntry) {
    throw new Error('GraphProxyAdmin not detected in the config, must be deployed first!')
  }
  const proxyAdmin = getContractAt('GraphProxyAdmin', proxyAdminEntry.address)

  // Deploy implementation
  const contract = await deployContractAndSave(name, [], sender, addressBook)

  // Wrap implementation with proxy
  const proxy = await wrapContractWithProxy(
    proxyName,
    proxyAdmin,
    contract,
    args,
    sender,
    buildAcceptProxyTx,
  )

  // Overwrite address entry with proxy
  const artifact = loadArtifact('GraphProxy')
  const contractEntry = addressBook.getEntry(name)
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

const wrapContractWithProxy = async (
  proxyName: string,
  proxyAdmin: Contract,
  contract: Contract,
  args: Array<ContractParam>,
  sender: Signer,
  buildAcceptProxyTx = false,
  overrides?: Overrides,
): Promise<Contract> => {
  // Deploy proxy
  const { contract: proxy } = await deployProxy(
    proxyName,
    contract.address,
    proxyAdmin.address,
    sender,
    overrides,
  )

  // Implementation accepts upgrade
  const initTx = args ? await contract.populateTransaction.initialize(...args) : null
  const acceptFunctionName = initTx ? 'acceptProxyAndCall' : 'acceptProxy'
  const acceptFunctionParams = initTx
    ? [contract.address, proxy.address, initTx.data]
    : [contract.address, proxy.address]
  if (buildAcceptProxyTx) {
    console.info(
      `
      Copy this data in the Gnosis Multisig UI, or a similar app and call ${acceptFunctionName}
      --------------------------------------------------------------------------------------
        > Contract Address:  ${proxyAdmin.address}
        > Implementation:    ${contract.address}
        > Proxy:             ${proxy.address}
        > Data:              ${initTx && initTx.data}
      `,
    )
  } else {
    await proxyAdmin.connect(sender)[acceptFunctionName](...acceptFunctionParams)
  }

  return proxy
}
