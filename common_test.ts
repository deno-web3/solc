import { isNil } from './common.ts'
import { expect } from '@std/expect'
import { describe, it } from '@std/testing/bdd'

describe('common.ts', () => {
  it('isNil', () => {
    expect(isNil(null)).toBe(true)
    expect(isNil(undefined)).toBe(true)
    expect(isNil(0)).toBe(false)
    expect(isNil('')).toBe(false)
  })
})
