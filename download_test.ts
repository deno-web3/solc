import { describe, it } from 'https://deno.land/std@0.221.0/testing/bdd.ts'
import { expect } from 'https://deno.land/std@0.221.0/expect/mod.ts'
import { download } from 'solc/download'
import { exists } from './helpers_test.ts'

describe('solc/download.ts', () => {
  it('downloads latest version to soljson.cjs file', async () => {
    await download()
    expect(await exists('./soljson.cjs')).toBe(true)
  })
  it('downloads latest version to any file path', async () => {
    await download('./solc.cjs')
    expect(await exists('./solc.cjs')).toBe(true)
    await Deno.remove('./solc.cjs')
  })
  it('downloads a specific version', async () => {
    const jsFile = await download('./soljson.cjs', '0.8.17')

    expect(jsFile).toEqual('solc-emscripten-wasm32-v0.8.17+commit.8df45f5f.js')
  })
  it('throws if version does not exist', async () => {
    try {
      await download('./soljson.cjs', '12.456.789')
    } catch (e) {
      expect((e as Error).message).toEqual('version 12.456.789 not found')
    }
  })
})
