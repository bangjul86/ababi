import { BigNumber, Wallet } from 'ethers'
import { hexlify, keccak256, parseUnits, randomBytes } from 'ethers/lib/utils'

import { GraphToken } from '../../build/types/GraphToken'

export const hashHexString = (input: string): string => keccak256(`0x${input.replace(/^0x/, '')}`)
export const randomHexBytes = (n = 32): string => hexlify(randomBytes(n))

export function assertObject(obj: unknown): asserts obj is Record<string, unknown> {
  if (typeof obj !== 'object' || obj == null) throw new Error('Not an object')
}

export const toBN = (value: string | number | BigNumber): BigNumber => BigNumber.from(value)

export const toGRT = (value: string | number): BigNumber => {
  return parseUnits(typeof value === 'number' ? value.toString() : value, '18')
}

export const ensureAllowance = async (
  sender: Wallet,
  spenderAddress: string,
  token: GraphToken,
  amount: BigNumber,
) => {
  // check balance
  const senderBalance = await token.balanceOf(sender.address)
  if (senderBalance.lt(amount)) {
    throw new Error('Sender balance is insufficient for the transfer')
  }

  // check allowance
  const allowance = await token.allowance(sender.address, spenderAddress)
  if (allowance.gte(amount)) {
    return
  }

  // approve
  console.info('Approving token transfer')
  const tx = await token.connect(sender).approve(spenderAddress, amount)
  return await sender.provider.waitForTransaction(tx.hash)
}
