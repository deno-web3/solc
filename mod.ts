import { wrapper } from './wrapper.ts'
import { createRequire } from './deps.ts'
const require = createRequire(import.meta.url)

/**
 * Load Solidity compiler and wrap it in JS interface
 * @param soljsonPath compiler file path
 * @returns Solidity compiler JS interface
 */
export const setupSolc = (soljsonPath: string) => wrapper(require(soljsonPath))
