/**
 * Original source code: https://github.com/ethereum/solc-js/blob/master/bindings/core.ts
 */

import { isNil } from './common.ts'
import { Alloc, License, Reset, SolJson, Version } from './deps.ts'
import type { Callbacks, CoreBindings, } from './types.ts'

function bindSolcMethod(
  solJson: SolJson,
  method: string,
  returnType: string | null,
  args: string[],
  defaultValue?: ((...args: unknown[]) => void) | null,
) {
  if (isNil((solJson as SolJson & { [method: string]: unknown })[`_${method}`]) && defaultValue !== undefined) {
    return defaultValue
  }

  return solJson.cwrap(method, returnType, args) as (...args: unknown[]) => void
}

function bindSolcMethodWithFallbackFunc(
  solJson: SolJson,
  method: string,
  returnType: string | null,
  args: string[],
  fallbackMethod: string,
  finalFallback: (() => void) | undefined = undefined,
) {
  const methodFunc = bindSolcMethod(solJson, method, returnType, args, null)

  if (!isNil(methodFunc)) {
    return methodFunc
  }

  return bindSolcMethod(solJson, fallbackMethod, returnType, args, finalFallback)
}

function bindAlloc(solJson: SolJson) {
  const allocBinding = bindSolcMethod(
    solJson,
    'solidity_alloc',
    'number',
    ['number'],
    null,
  )

  // the fallback malloc is not a cwrap function and should just be returned
  // directly in-case the alloc binding could not happen.
  if (isNil(allocBinding)) {
    return solJson._malloc
  }

  return allocBinding
}
const bindVersion = (solJson: SolJson) =>
  bindSolcMethodWithFallbackFunc(
    solJson,
    'solidity_version',
    'string',
    [],
    'version',
  )

function bindLicense(solJson: SolJson) {
  return bindSolcMethodWithFallbackFunc(
    solJson,
    'solidity_license',
    'string',
    [],
    'license',
    () => {
    },
  )
}

function bindReset(solJson: SolJson) {
  return bindSolcMethod(
    solJson,
    'solidity_reset',
    null,
    [],
    null,
  )
}

function unboundCopyToCString(solJson: SolJson, alloc: Alloc, str: string, ptr: number) {
  const length = solJson.lengthBytesUTF8(str)

  const buffer = alloc(length + 1)

  solJson.stringToUTF8(str, buffer, length + 1)
  solJson.setValue(ptr, buffer, '*')
}

function unboundCopyFromCString(solJson: SolJson, ptr: number) {
  const copyFromCString = solJson.UTF8ToString
  return copyFromCString(ptr)
}

function unboundAddFunction(solJson: SolJson, func: (...args: unknown[]) => unknown, signature?: string) {
  return (solJson.addFunction || solJson.Runtime.addFunction)(func, signature)
}

function unboundRemoveFunction(solJson: SolJson, ptr: number) {
  return (solJson.removeFunction || solJson.Runtime.removeFunction)(ptr)
}

const setupCore = (solJson: SolJson) => {
  const core = {
    alloc: bindAlloc(solJson) as Alloc,
    license: bindLicense(solJson) as License,
    version: bindVersion(solJson) as Version,
    reset: bindReset(solJson) as Reset,
  }

  const helpers = {
    addFunction: unboundAddFunction.bind(this, solJson),
    removeFunction: unboundRemoveFunction.bind(this, solJson),

    copyFromCString: unboundCopyFromCString.bind(this, solJson),

    copyToCString: unboundCopyToCString.bind(this, solJson, core.alloc) as unknown as (
      str: string,
      ptr: number,
    ) => string,
  }

  return {
    ...core,
    ...helpers,
  }
}

const bindCompileJson = (solJson: SolJson) =>
  bindSolcMethod(
    solJson,
    'compileJSON',
    'string',
    ['string', 'number'],
    null,
  )

const bindCompileJsonMulti = (solJson: SolJson) =>
  bindSolcMethod(
    solJson,
    'compileJSONMulti',
    'string',
    ['string', 'number'],
    null,
  )

function wrapCallbackWithKind(
  coreBindings: CoreBindings,
  callback: (arg1: string, arg2: string) => { contents: string; error: string },
) {
  if (typeof callback !== 'function') throw new Error('Invalid callback specified.')

  return function (context: number, kind: number, data: number, contents: number, error: number): void {
    // Must be a null pointer.
    if (context !== 0) throw new Error('Callback context must be null.')
    const result = callback(coreBindings.copyFromCString(kind), coreBindings.copyFromCString(data))
    if (typeof result.contents === 'string') {
      coreBindings.copyToCString(result.contents, contents)
    }
    if (typeof result.error === 'string') {
      coreBindings.copyToCString(result.error, error)
    }
  }
}

// calls compile() with args || cb
function runWithCallbacks(
  solJson: SolJson,
  coreBindings: CoreBindings,
  callbacks: Callbacks = {},
  compile: (...args: unknown[]) => void,
  args: (number | null)[],
) {
  let readCallback = callbacks.import
  if (readCallback === undefined) {
    readCallback = function () {
      return {
        error: 'File import callback not supported',
      }
    }
  }

  let singleCallback = wrapCallbackWithKind(coreBindings, (kind: string, data: string) => {
    if (kind === 'source') {
      return readCallback!(data)!
    } else if (kind === 'smt-query') {
      return smtSolverCallback!(data)!
    } else {
      throw new Error('Invalid callback kind specified.')
    }
  })
  // After 0.6.x multiple kind of callbacks are supported.
  let smtSolverCallback = callbacks.smtSolver
  if (smtSolverCallback === undefined) {
    smtSolverCallback = function () {
      return {
        error: 'SMT solver callback not supported',
      }
    }
  }


  const cb = coreBindings.addFunction(singleCallback, 'viiiii')
  let output
  try {
    args.push(cb)
    args.push(null)

    output = compile(...args)
  } finally {
    coreBindings.removeFunction(cb)
  }

  if (coreBindings.reset) {
    // Explicitly free memory.
    //
    // NOTE: cwrap() of "compile" will copy the returned pointer into a
    //       Javascript string and it is not possible to call free() on it.
    //       reset() however will clear up all allocations.
    coreBindings.reset()
  }
  return output
}

const bindCompileJsonCallback = (solJson: SolJson, coreBindings: CoreBindings) => {
  const compileInternal = bindSolcMethod(
    solJson,
    'compileJSONCallback',
    'string',
    ['string', 'number', 'number'],
    null,
  )

  if (isNil(compileInternal)) return null

  return function (input: number, optimize: number, readCallback: Callbacks) {
    return runWithCallbacks(solJson, coreBindings, readCallback, compileInternal!, [input, optimize])
  }
}

function bindCompileStandard (solJson: SolJson, coreBindings: CoreBindings) {
  let boundFunctionStandard: any = null;
  let boundFunctionSolidity: any = null;

  // input (jsontext), callback (ptr) -> output (jsontext)
  const compileInternal = bindSolcMethod(
    solJson,
    'compileStandard',
    'string',
    ['string', 'number'],
    null
  );

    // input (jsontext), callback (ptr), callback_context (ptr) -> output (jsontext)
    boundFunctionSolidity = bindSolcMethod(
      solJson,
      'solidity_compile',
      'string',
      ['string', 'number', 'number'],
      null
    );
 

  if (!isNil(compileInternal)) {
    boundFunctionStandard = function (input: number, readCallback: Callbacks) {
      return runWithCallbacks(solJson, coreBindings, readCallback, compileInternal!, [input]);
    };
  }

  if (!isNil(boundFunctionSolidity)) {
    boundFunctionStandard = function (input: number, callbacks: Callbacks) {
      return runWithCallbacks(solJson, coreBindings, callbacks, boundFunctionSolidity, [input]);
    };
  }

  return boundFunctionStandard;
}

function setupCompile(
  solJson: SolJson,
  core: CoreBindings,
) {
  return {
    compileJson: bindCompileJson(solJson),
    compileJsonCallback: bindCompileJsonCallback(solJson, core),
    compileJsonMulti: bindCompileJsonMulti(solJson),
    compileStandard: bindCompileStandard(solJson, core),
  }
}

export const setupBindings = (soljson: SolJson) => {
  const coreBindings = setupCore(soljson)
  const compileBindings = setupCompile(soljson, coreBindings)

  return { coreBindings, compileBindings }
}
