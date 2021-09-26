import { semver } from './deps.ts'
import { assert } from './utils.ts'
import * as translate from './translate.ts'
import { FunctionResult, Input } from './types.ts'

export const setupMethods = (soljson: {
  cwrap: (arg0?: any, arg1?: any, arg2?: any[]) => (arg0?: any, arg1?: any) => any
  _malloc: any
  lengthBytesUTF8: (arg0: string) => any
  stringToUTF8: (arg0: string, arg1: any, arg2: number) => void
  setValue: (arg0: any, arg1: any, arg2: string) => void
  UTF8ToString: (data: any) => any
  Pointer_stringify: any
  addFunction: (arg1: any, arg2: string) => any
  Runtime: { addFunction: (arg1: any, arg2: string) => any; removeFunction: (x: any) => any }
  removeFunction: (x: any) => any
}) => {
  const version: () => string =
    '_solidity_version' in soljson
      ? soljson.cwrap('solidity_version', 'string', [])
      : soljson.cwrap('version', 'string', [])

  const versionToSemver = () => translate.versionToSemver(version())

  const isVersion6: boolean = semver.gt(versionToSemver(), '0.5.99')

  let license
  if ('_solidity_license' in soljson) {
    license = soljson.cwrap('solidity_license', 'string', [])
  } else if ('_license' in soljson) {
    license = soljson.cwrap('license', 'string', [])
  }

  let alloc: (x: number) => any
  if ('_solidity_alloc' in soljson) {
    alloc = soljson.cwrap('solidity_alloc', 'number', ['number'])
  } else {
    alloc = soljson._malloc
    assert(alloc, 'Expected malloc to be present.')
  }

  let reset: () => void
  if ('_solidity_reset' in soljson) reset = soljson.cwrap('solidity_reset', null, [])

  const copyToCString = (str: string, ptr: any) => {
    const length = soljson.lengthBytesUTF8(str)
    // This is allocating memory using solc's allocator.
    //
    // Before 0.6.0:
    //   Assuming copyToCString is only used in the context of wrapCallback, solc will free these pointers.
    //   See https://github.com/ethereum/solidity/blob/v0.5.13/libsolc/libsolc.h#L37-L40
    //
    // After 0.6.0:
    //   The duty is on solc-js to free these pointers. We accomplish that by calling `reset` at the end.
    const buffer = alloc(length + 1)
    soljson.stringToUTF8(str, buffer, length + 1)
    soljson.setValue(ptr, buffer, '*')
  }

  // This is to support multiple versions of Emscripten.
  // Take a single `ptr` and returns a `str`.
  const copyFromCString = soljson.UTF8ToString || soljson.Pointer_stringify

  const wrapCallback = (callback: (arg0: any) => FunctionResult) => {
    assert(typeof callback === 'function', 'Invalid callback specified.')
    return (data: any, contents: string, error: string) => {
      const result = callback(copyFromCString(data))
      if (typeof result.contents === 'string') copyToCString(result.contents, contents)
      if (typeof result.error === 'string') copyToCString(result.error, error)
    }
  }

  const wrapCallbackWithKind = (callback: { (kind: 'source' | 'smt-query', data: any): FunctionResult }) => {
    assert(typeof callback === 'function', 'Invalid callback specified.')
    return (context: number, kind: any, data: any, contents: string, error: string) => {
      // Must be a null pointer.
      assert(context === 0, 'Callback context must be null.')
      const result = callback(copyFromCString(kind), copyFromCString(data))
      if (typeof result.contents === 'string') copyToCString(result.contents, contents)
      if (typeof result.error === 'string') copyToCString(result.error, error)
    }
  }

  // This calls compile() with args || cb
  const runWithCallbacks = (
    callbacks: Record<string, any>,
    compile: { apply: (arg0: undefined, arg1: any) => any },
    args: any[]
  ) => {
    if (callbacks) assert(typeof callbacks === 'object', 'Invalid callback object specified.')
    else callbacks = {}

    const readCallback = callbacks.import || (() => ({ error: 'File import callback not supported' }))

    let singleCallback
    if (isVersion6) {
      // After 0.6.x multiple kind of callbacks are supported.
      const smtSolverCallback = callbacks.smtSolver || (() => ({ error: 'SMT solver callback not supported' }))

      singleCallback = (kind: 'source' | 'smt-query', data: any) => {
        if (kind === 'source') return readCallback(data)
        else if (kind === 'smt-query') return smtSolverCallback(data)
        else assert(false, 'Invalid callback kind specified.')
      }

      singleCallback = wrapCallbackWithKind(singleCallback)
    } else {
      // Old Solidity version only supported imports.
      singleCallback = wrapCallback(readCallback)
    }

    // This is to support multiple versions of Emscripten.
    const addFunction = soljson.addFunction || soljson.Runtime.addFunction
    const removeFunction = soljson.removeFunction || soljson.Runtime.removeFunction

    const cb = addFunction(singleCallback, 'viiiii')
    let output
    try {
      args.push(cb)
      if (isVersion6) args.push(null) // Callback context.
      output = compile.apply(undefined, args)
    } catch (e) {
      removeFunction(cb)
      throw e
    }
    removeFunction(cb)
    if (reset) reset()

    return output
  }

  let compileJSON: ((arg0: any, arg1: any) => any) | null = null
  if ('_compileJSON' in soljson) {
    // input (text), optimize (bool) -> output (jsontext)
    compileJSON = soljson.cwrap('compileJSON', 'string', ['string', 'number'])
  }

  let compileJSONMulti: ((arg0: string, arg1: any) => any) | null = null
  if ('_compileJSONMulti' in soljson) {
    // input (jsontext), optimize (bool) -> output (jsontext)
    compileJSONMulti = soljson.cwrap('compileJSONMulti', 'string', ['string', 'number'])
  }

  let compileJSONCallback: {
    (arg0: string, arg1: any, arg2: any): any
    (input: any, optimize: any, readCallback: any): any
  } | null = null
  if ('_compileJSONCallback' in soljson) {
    // input (jsontext), optimize (bool), callback (ptr) -> output (jsontext)
    const compileInternal = soljson.cwrap('compileJSONCallback', 'string', ['string', 'number', 'number'])
    compileJSONCallback = (input, optimize, readCallback) =>
      runWithCallbacks(readCallback, compileInternal, [input, optimize])
  }

  let compileStandard: {
    (arg0: any, arg1: any): any
    (input: any, readCallback: any): any
    (input: any, callbacks: any): any
  } | null = null
  if ('_compileStandard' in soljson) {
    // input (jsontext), callback (ptr) -> output (jsontext)
    const compileStandardInternal = soljson.cwrap('compileStandard', 'string', ['string', 'number'])
    compileStandard = (input, readCallback) => runWithCallbacks(readCallback, compileStandardInternal, [input])
  }
  if ('_solidity_compile' in soljson) {
    const solidityCompile = soljson.cwrap(
      'solidity_compile',
      'string',
      isVersion6 ? ['string', 'number', 'number'] : ['string', 'number']
    )

    compileStandard = (input, callbacks) => runWithCallbacks(callbacks, solidityCompile, [input])
  }

  // Expects a Standard JSON I/O but supports old compilers
  const compileStandardWrapper = (_input: string, readCallback?: any): string => {
    if (compileStandard !== null) return compileStandard(_input, readCallback)

    function formatFatalError(message: string) {
      return JSON.stringify({
        errors: [
          {
            type: 'JSONError',
            component: 'solcjs',
            severity: 'error',
            message,
            formattedMessage: `Error: ${message}`
          }
        ]
      })
    }

    let input: Input

    try {
      input = JSON.parse(_input)
    } catch (e) {
      return formatFatalError(`Invalid JSON supplied: ${e.message}`)
    }

    // NOTE: this is deliberately `== null`
    if (input.sources == null || Object.keys(input.sources).length === 0)
      return formatFatalError('No input sources specified.')

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

    const sources = translateSources(input)
    if (sources === null || Object.keys(sources).length === 0) return formatFatalError('Failed to process sources.')

    return formatFatalError('Compiler does not support any known interface.')
  }
  return {
    version,
    semver: versionToSemver,
    license,
    lowlevel: {
      compileSingle: compileJSON,
      compileMulti: compileJSONMulti,
      compileCallback: compileJSONCallback,
      compileStandard
    },
    features: {
      legacySingleInput: compileJSON !== null,
      multipleInputs: compileJSONMulti !== null || compileStandard !== null,
      importCallback: compileJSONCallback !== null || compileStandard !== null,
      nativeStandardJSON: compileStandard !== null
    },
    compile: compileStandardWrapper
  }
}
