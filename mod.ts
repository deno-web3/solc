import setupBindings from './bindings/index.ts'
import type { CompileBindings, SolJson, Wrapper } from 'solc/types'

function compileStandardWrapper(compile: CompileBindings, inputRaw: string, readCallback: unknown) {
  return compile.compileStandard(inputRaw, readCallback as number)
}

/**
 * Wrap Solidity compiler into a JS interface
 * @param soljson WebAssembly compiler module
 */
export function wrapper(soljson: SolJson): Wrapper {
  const { coreBindings, compileBindings } = setupBindings(soljson)

  return {
    version: coreBindings.version,
    license: coreBindings.license,
    // @ts-ignore this stuff
    compile: compileStandardWrapper.bind(this, compileBindings),
  }
}
