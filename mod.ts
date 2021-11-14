import { setupMethods } from './wrapper.ts'
import { createRequire, process } from './deps.ts'

const require = createRequire(import.meta.url)

const __filename = new URL('', import.meta.url).pathname
const __dirname = new URL('.', import.meta.url).pathname

// @ts-ignore Node.js
globalThis.__dirname = __dirname
// @ts-ignore Node.js
globalThis.__filename = __filename

// @ts-ignore Node.js
globalThis.process = process

export const setupSolc = (soljsonPath: string) => {
  console.log(`Calling require(${soljsonPath})`)

  return setupMethods(require(soljsonPath))
}
