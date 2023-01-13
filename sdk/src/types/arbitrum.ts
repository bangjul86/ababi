import type { BigNumber } from 'ethers'

export interface L2GasParams {
  maxGas: BigNumber
  gasPriceBid: BigNumber
  maxSubmissionCost: BigNumber
}
