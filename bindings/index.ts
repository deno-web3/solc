import type { SolJson } from 'solc/types'
import { setupCompile } from './compile.ts'
import { setupCore } from './core.ts'
import { getSupportedMethods } from './helpers.ts'

export default function setupBindings(solJson: SolJson) {
  const coreBindings = setupCore(solJson)

  const compileBindings = setupCompile(solJson, coreBindings)

  const methodFlags = getSupportedMethods(solJson)

  return {
    methodFlags,
    coreBindings,
    compileBindings,
  }
}
