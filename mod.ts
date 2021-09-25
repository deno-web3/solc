import { setupMethods } from './wrapper.js'
import { soljson } from './module.ts'

export const solc = setupMethods(soljson)
