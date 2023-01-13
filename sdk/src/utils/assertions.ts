import { AssertionError } from 'assert'

export function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value == null)
    throw new AssertionError({
      message: 'Not an object',
    })
}
