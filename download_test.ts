import { it, describe, run, expect, afterAll } from 'https://deno.land/x/tincan@1.0.1/mod.ts'
import { download } from 'solc/download'
import { exists } from './test_helpers.ts'

describe('solc/download.ts', () => {
  afterAll(async () => {
    await Deno.remove('./soljson.js')
    await Deno.remove('./solc.js')
  })
  it('downloads latest version to soljson.js file', async () => {
    await download()
    expect(await exists('./soljson.js')).toBe(true)
  })
  it('downloads latest version to any file path', async () => {
    await download('./solc.js')
    expect(await exists('./solc.js')).toBe(true)
  })
  it('downloads a specific version', async () => {
    const jsFile = await download('./soljson.js', '0.8.17')

    expect(jsFile).toEqual('soljson-v0.8.17+commit.8df45f5f.js')
  })
  it('throws if version does not exist', async () => {
    try {
      await download('./soljson.js', '12.456.789')
    } catch (e) {
      expect((e as Error).message).toEqual('version 12.456.789 not found')
    }
  })
})

run()
