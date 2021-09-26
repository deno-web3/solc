import { setupMethods } from './wrapper.ts'
import { createRequire } from './deps.ts'
import { download } from './download.ts'
import process from 'https://esm.sh/process/browser.js'
import { exists } from './utils.ts'

const require = createRequire(import.meta.url)

const __filename = new URL('', import.meta.url).pathname
const __dirname = new URL('.', import.meta.url).pathname

// @ts-ignore Node.js
globalThis.__dirname = __dirname
// @ts-ignore Node.js
globalThis.__filename = __filename

process.versions = { node: '12.4.0' }

// @ts-ignore Node.js
globalThis.process = process

const soljsonPath = `file://${Deno.cwd()}/.cache/soljson.js'`

if (!(await exists(soljsonPath))) {
  console.log(`Downloading soljson to ${soljsonPath}`)

  await download()
}

export const solc = setupMethods(require(soljsonPath))
