import { setupBindings } from './bindings.ts'
import { formatFatalError, isNil } from './common.ts'
import { CompileBindings, LibraryAddresses, SolJson, translateJsonCompilerOutput } from './deps.ts'
import type { Input, Wrapper } from './types.ts'

function translateOutput(outputRaw: string, libraries?: LibraryAddresses) {
  let parsedOutput

  try {
    parsedOutput = JSON.parse(outputRaw)
  } catch (e) {
    return formatFatalError(`Compiler returned invalid JSON: ${e.message}`)
  }

  const output = translateJsonCompilerOutput(parsedOutput, libraries)

  if (isNil(output)) {
    return formatFatalError('Failed to process output.')
  }

  return JSON.stringify(output)
}

function translateSources(input: Input) {
  const sources: Record<string, string> = {}

  for (const source in input.sources) {
    if (input.sources[source].content !== null) {
      sources[source] = input.sources[source].content
    } else {
      // force failure
      return null
    }
  }

  return sources
}

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
    loadRemoteVersion: () => void 0,
  }
}
