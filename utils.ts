import * as _assert from 'https://deno.land/x/std@0.108.0/node/assert.ts'

export const assert = (actual: unknown, message: string) => {
  return _assert.strict(actual, message)
}
