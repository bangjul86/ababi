import { L1ToL2MessageGasEstimator } from '@arbitrum/sdk'
import { L1ToL2MessageNoGasParams } from '@arbitrum/sdk/dist/lib/message/L1ToL2MessageCreator'
import { GasOverrides } from '@arbitrum/sdk/dist/lib/message/L1ToL2MessageGasEstimator'
import { BigNumber, providers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

interface L2GasParams {
  maxGas: BigNumber
  gasPriceBid: BigNumber
  maxSubmissionCost: BigNumber
}

export const estimateRetryableTxGas = async (
  l1Provider: providers.Provider,
  l2Provider: providers.Provider,
  gatewayAddress: string,
  l2Dest: string,
  depositCalldata: string,
  opts: L2GasParams,
): Promise<L2GasParams> => {
  const autoEstimate = opts && (!opts.maxGas || !opts.gasPriceBid || !opts.maxSubmissionCost)
  if (!autoEstimate) {
    return opts
  }

  // Comment from Offchain Labs' implementation:
  // we add a 0.05 ether "deposit" buffer to pay for execution in the gas estimation
  console.info('Estimating retryable ticket gas:')
  const baseFee = (await l1Provider.getBlock('latest')).baseFeePerGas
  const gasEstimator = new L1ToL2MessageGasEstimator(l2Provider)
  const retryableEstimateData: L1ToL2MessageNoGasParams = {
    from: gatewayAddress,
    to: l2Dest,
    data: depositCalldata,
    l2CallValue: parseEther('0'),
    excessFeeRefundAddress: gatewayAddress,
    callValueRefundAddress: gatewayAddress,
  }

  const estimateOpts: GasOverrides = {}
  if (opts.maxGas) estimateOpts.gasLimit = { base: opts.maxGas }
  if (opts.maxSubmissionCost) estimateOpts.maxSubmissionFee = { base: opts.maxSubmissionCost }
  if (opts.gasPriceBid) estimateOpts.maxFeePerGas = { base: opts.gasPriceBid }

  const gasParams = await gasEstimator.estimateAll(
    retryableEstimateData,
    baseFee as BigNumber,
    l1Provider,
    estimateOpts,
  )

  // override fixed values
  return {
    maxGas: opts.maxGas ?? gasParams.gasLimit,
    gasPriceBid: opts.gasPriceBid ?? gasParams.maxFeePerGas,
    maxSubmissionCost: opts.maxSubmissionCost ?? gasParams.maxSubmissionCost,
  }
}
