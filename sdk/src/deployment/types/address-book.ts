import type { Contract } from 'ethers'
import type { Libraries } from 'hardhat/types'

// TODO: doc this

// JSON format:
// {
//   "<CHAIN_ID>": {
//     "<CONTRACT_NAME>": {}
//     ...
//    }
// }
export type AddressBookJson<
  ChainId extends string = string,
  ContractName extends string = string,
> = Record<ChainId, Record<ContractName, AddressBookEntry>>

export type DeployResult = {
  contract: Contract
  creationCodeHash: string
  runtimeCodeHash: string
  txHash: string
  libraries?: Libraries
}

export type AddressBookEntry = {
  address: string
  constructorArgs?: Array<string>
  initArgs?: Array<string>
  proxy?: boolean
  implementation?: AddressBookEntry
} & Partial<Omit<DeployResult, 'contract'>>
