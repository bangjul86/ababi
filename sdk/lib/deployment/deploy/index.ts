import { BigNumber, Contract } from 'ethers'

export type DeployResult = {
  contract: Contract
  creationCodeHash: string
  runtimeCodeHash: string
  txHash: string
  libraries?: { [libraryName: string]: string }
}

export type ContractParam = string | BigNumber | number

export * from './contract'
export * from './proxy'
