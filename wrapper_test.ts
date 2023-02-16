import { it, describe, run, expect, beforeAll, afterAll } from 'https://deno.land/x/tincan@1.0.1/mod.ts'
import { wrapper } from './wrapper.ts'
import { createRequire } from './deps.ts'
import { download } from 'solc/download'

const require = createRequire(import.meta.url)

describe('solc/wrapper.ts', () => {
  beforeAll(async () => {
    await download('./soljson.js', '0.8.18')
  })
  it('returns JS interface', async () => {
    const solc = wrapper(require('./soljson.js'))

    expect(solc.compile).toBeDefined()
    expect(solc.version()).toBe('0.8.18+commit.87f61d96.Emscripten.clang')
    expect(solc.semver()).toBe('0.8.18+commit.87f61d96.Emscripten.clang')
    expect(solc.license()).toContain('Most of the code is licensed under GPLv3 (see below), the license for individual')
  })
})

run()
