import { wrapper } from './wrapper.ts'
import { createRequire } from './deps.ts'
const require = createRequire(import.meta.url)

export const setupSolc = (soljsonPath: string) => wrapper(require(soljsonPath))
