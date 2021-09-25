import process from 'https://esm.sh/process/browser.js'
import { createRequire } from './deps.ts'

const require = createRequire(import.meta.url)

const __filename = new URL('', import.meta.url).pathname
const __dirname = new URL('.', import.meta.url).pathname

// @ts-ignore
globalThis.__dirname = __dirname
// @ts-ignore
globalThis.__filename = __filename

process.versions = { node: '12.4.0' }

// @ts-ignore
globalThis.process = process

export const soljson = require('./soljson-v0.8.7+commit.e28d00a7.js')
