import type { BigNumber, Contract } from 'ethers'

export type ContractList<T extends string = string> = Record<T, Contract>

export type ContractParam = string | BigNumber | number
