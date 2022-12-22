import { keccak256 } from 'ethers/lib/utils'

export const hashHexString = (input: string): string => keccak256(`0x${input.replace(/^0x/, '')}`)

export function assertObject(obj: unknown): asserts obj is Record<string, unknown> {
  if (typeof obj !== 'object' || obj == null) throw new Error('Not an object')
}
