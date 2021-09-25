import { setupMethods } from './wrapper.ts'
import { soljson } from './module.ts'

export const solc = setupMethods(soljson)
