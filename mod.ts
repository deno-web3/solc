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

if (!(await exists('./soljson.js'))) await download()

export const solc = setupMethods(require('./soljson.js'))
