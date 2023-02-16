import {
  CompileBindings,
  CoreBindings,
  LibraryAddresses,
  setupBindings,
  SolJson,
  SupportedMethods,
  translateJsonCompilerOutput,
  Wrapper
} from './deps.ts'
import type { Input } from './types.ts'

function formatFatalError(message: string) {
  return JSON.stringify({
    errors: [
      {
        type: 'JSONError',
        component: 'solcjs',
        severity: 'error',
        message: message,
        formattedMessage: 'Error: ' + message
      }
    ]
  })
}

function isNil(value: unknown) {
  return value == null
}

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

function isOptimizerEnabled(input: Input): boolean {
  return input.settings?.optimizer?.enabled || false
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

function librariesSupplied(input: Input) {
  if (!isNil(input.settings)) return input.settings.libraries
}

function compileStandardWrapper(compile: CompileBindings, inputRaw: string, readCallback: unknown) {
  if (!isNil(compile.compileStandard)) {
    return compile.compileStandard(inputRaw, readCallback as number)
  }

  let input: Omit<Input, 'sources'> & { sources: string[] }

  try {
    input = JSON.parse(inputRaw)
  } catch (e) {
    return formatFatalError(`Invalid JSON supplied: ${e.message}`)
  }

  if (input.language !== 'Solidity') {
    return formatFatalError('Only "Solidity" is supported as a language.')
  }

  // NOTE: this is deliberately `== null`
  if (isNil(input.sources) || input.sources.length === 0) {
    return formatFatalError('No input sources specified.')
  }

  const sources = translateSources(input as unknown as Input)
  const optimize = isOptimizerEnabled(input as unknown as Input)
  const libraries = librariesSupplied(input as unknown as Input)

  if (isNil(sources) || Object.keys(sources!).length === 0) {
    return formatFatalError('Failed to process sources.')
  }

  // Try to wrap around old versions
  if (!isNil(compile.compileJsonCallback)) {
    const inputJson = JSON.stringify({ sources: sources })
    const output = compile.compileJsonCallback(inputJson, optimize, readCallback as number)
    return translateOutput(output, libraries)
  }

  if (!isNil(compile.compileJsonMulti)) {
    const output = compile.compileJsonMulti(JSON.stringify({ sources: sources }), optimize)
    return translateOutput(output, libraries)
  }

  return formatFatalError('Compiler does not support any known interface.')
}

/**
 * Wrap Solidity compiler into a JS interface
 * @param soljson WebAssembly compiler module
 */
export function wrapper(soljson: SolJson): Omit<Wrapper, 'loadRemoteVersion' | 'setupMethods'> {
  const { coreBindings, compileBindings, methodFlags } = setupBindings(soljson) as {
    coreBindings: CoreBindings
    compileBindings: CompileBindings
    methodFlags: SupportedMethods
  }

  return {
    version: coreBindings.version,
    semver: coreBindings.versionToSemver,
    license: coreBindings.license,
    lowlevel: {
      compileSingle: compileBindings.compileJson,
      compileMulti: compileBindings.compileJsonMulti,
      compileCallback: compileBindings.compileJsonCallback,
      compileStandard: compileBindings.compileStandard
    },
    features: {
      legacySingleInput: methodFlags.compileJsonStandardSupported,
      multipleInputs: methodFlags.compileJsonMultiSupported || methodFlags.compileJsonStandardSupported,
      importCallback: methodFlags.compileJsonCallbackSupported || methodFlags.compileJsonStandardSupported,
      nativeStandardJSON: methodFlags.compileJsonStandardSupported
    },
    // @ts-ignore this stuff
    compile: compileStandardWrapper.bind(this, compileBindings)
  }
}
