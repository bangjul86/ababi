import type { BigNumber, Contract } from 'ethers'

export type ContractParam = string | BigNumber | number

export type ContractList<T extends string = string> = Record<T, Contract>
