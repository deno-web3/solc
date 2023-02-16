import { process } from './deps.ts'

const __filename = new URL('', import.meta.url).pathname
const __dirname = new URL('.', import.meta.url).pathname

// @ts-ignore Node.js
globalThis.__dirname = __dirname
// @ts-ignore Node.js
globalThis.__filename = __filename

// @ts-ignore Node.js
globalThis.process = process
