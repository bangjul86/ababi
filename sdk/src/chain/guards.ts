import { l1ChainNames, l1Chains, l2ChainNames, l2Chains } from '.'

import type {
  GraphChainId,
  GraphChainName,
  GraphL1ChainId,
  GraphL1ChainName,
  GraphL2ChainId,
  GraphL2ChainName,
} from '../types/chain'

/** Type guard for {@link GraphL1ChainId} */
export function isGraphL1ChainId(value: unknown): value is GraphL1ChainId {
  return typeof value === 'number' && l1Chains.includes(value as GraphL1ChainId)
}
/** Type guard for {@link GraphL2ChainId} */
export function isGraphL2ChainId(value: unknown): value is GraphL2ChainId {
  return typeof value === 'number' && l2Chains.includes(value as GraphL2ChainId)
}
/** Type guard for {@link GraphChainId} */
export function isGraphChainId(value: unknown): value is GraphChainId {
  return typeof value === 'number' && (isGraphL1ChainId(value) || isGraphL2ChainId(value))
}

/** Type guard for {@link GraphL1ChainName} */
export function isGraphL1ChainName(value: unknown): value is GraphL1ChainName {
  return typeof value === 'string' && l1ChainNames.includes(value as GraphL1ChainName)
}
/** Type guard for {@link GraphL2ChainName} */
export function isGraphL2ChainName(value: unknown): value is GraphL2ChainName {
  return typeof value === 'string' && l2ChainNames.includes(value as GraphL2ChainName)
}
/** Type guard for {@link GraphChainName} */
export function isGraphChainName(value: unknown): value is GraphChainName {
  return typeof value === 'string' && (isGraphL1ChainName(value) || isGraphL2ChainName(value))
}
