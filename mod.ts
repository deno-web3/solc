import setupBindings from './bindings/index.ts'
import { CompileBindings, SolJson } from './deps.ts'
import type { Wrapper } from './types.ts'

function compileStandardWrapper(compile: CompileBindings, inputRaw: string, readCallback: unknown) {
  return compile.compileStandard(inputRaw, readCallback as number)
}

if (!globalThis.__dirname) {
  globalThis.__dirname = import.meta.url
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
    loadRemoteVersion: () => void 0,
  }
}
