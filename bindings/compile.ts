import assert from 'node:assert'

import { isNil } from '../common.ts'
import { bindSolcMethod } from './helpers.ts'
import { Callbacks, CoreBindings, ReadCallback, SolJson } from 'solc/types'

export function setupCompile(solJson: SolJson, core: CoreBindings) {
  return {
    compileJson: bindCompileJson(solJson),
    compileJsonCallback: bindCompileJsonCallback(solJson, core),
    compileJsonMulti: bindCompileJsonMulti(solJson),
    compileStandard: bindCompileStandard(solJson, core),
  }
}

/**********************
 * COMPILE
 **********************/

/**
 * Returns a binding to the solidity compileJSON method.
 * input (text), optimize (bool) -> output (jsontext)
 *
 * @param solJson The Emscripten compiled Solidity object.
 */
function bindCompileJson(solJson: SolJson) {
  return bindSolcMethod(
    solJson,
    'compileJSON',
    'string',
    ['string', 'number'],
    null,
  )
}

/**
 * Returns a binding to the solidity compileJSONMulti method.
 * input (jsontext), optimize (bool) -> output (jsontext)
 *
 * @param solJson The Emscripten compiled Solidity object.
 */
function bindCompileJsonMulti(solJson: SolJson) {
  return bindSolcMethod(
    solJson,
    'compileJSONMulti',
    'string',
    ['string', 'number'],
    null,
  )
}

/**
 * Returns a binding to the solidity compileJSONCallback method.
 * input (jsontext), optimize (bool), callback (ptr) -> output (jsontext)
 *
 * @param solJson The Emscripten compiled Solidity object.
 * @param coreBindings The core bound Solidity methods.
 */
function bindCompileJsonCallback(solJson: SolJson, coreBindings: CoreBindings) {
  const compileInternal = bindSolcMethod<(arg0: string, arg1: number, arg2?: number) => string>(
    solJson,
    'compileJSONCallback',
    'string',
    ['string', 'number', 'number'],
    null,
  )

  if (isNil(compileInternal)) return null

  return function (input: string, optimize: number, readCallback: ReadCallback) {
    return runWithCallbacks(solJson, coreBindings, readCallback, compileInternal, [input, optimize])
  }
}

/**
 * Returns a binding to the solidity solidity_compile method.
 * input (jsontext), callback (optional >= v6 only - ptr) -> output (jsontext)
 *
 * @param solJson The Emscripten compiled Solidity object.
 * @param coreBindings The core bound Solidity methods.
 */
function bindCompileStandard(solJson: SolJson, coreBindings: CoreBindings) {
  let boundFunctionStandard = null
  let boundFunctionSolidity: ((jsontext: string, ptr?: number) => string) | null = null

  // input (jsontext), callback (ptr), callback_context (ptr) -> output (jsontext)
  boundFunctionSolidity = bindSolcMethod(
    solJson,
    'solidity_compile',
    'string',
    ['string', 'number', 'number'],
    null,
  )

  if (!isNil(boundFunctionSolidity)) {
    boundFunctionStandard = function (input: string, callbacks: Callbacks) {
      return runWithCallbacks(solJson, coreBindings, callbacks, boundFunctionSolidity, [input])
    }
  }

  return boundFunctionStandard
}

/**********************
 * CALL BACKS
 **********************/

function wrapCallbackWithKind<Arg extends string>(
  coreBindings: CoreBindings,
  callback: (...args: Arg[]) => Partial<{ contents: unknown; error: unknown }>,
) {
  assert(typeof callback === 'function', 'Invalid callback specified.')

  return function (context: 0, kind: number, data: number, contents: number, error: number) {
    // Must be a null pointer.
    assert(context === 0, 'Callback context must be null.')
    console.log({ kind, data })
    const result = callback(coreBindings.copyFromCString(kind) as Arg, coreBindings.copyFromCString(data) as Arg)
    if (typeof result.contents === 'string') {
      coreBindings.copyToCString(result.contents, contents)
    }
    if (typeof result.error === 'string') {
      coreBindings.copyToCString(result.error, error)
    }
  }
}

// calls compile() with args || cb
function runWithCallbacks<Args extends unknown[]>(
  _solJson: SolJson,
  coreBindings: CoreBindings,
  callbacks: Callbacks | ReadCallback,
  compile: (...args: Args) => void,
  args: Args,
) {
  if (callbacks) {
    assert(typeof callbacks === 'object', 'Invalid callback object specified.')
  } else {
    callbacks = {}
  }

  let readCallback = callbacks.import
  if (readCallback === undefined) {
    readCallback = function () {
      return {
        error: 'File import callback not supported',
      }
    }
  }

  let singleCallback
  // After 0.6.x multiple kind of callbacks are supported.
  let smtSolverCallback = callbacks.smtSolver
  if (smtSolverCallback === undefined) {
    smtSolverCallback = function () {
      return {
        error: 'SMT solver callback not supported',
      }
    }
  }

  singleCallback = function (kind: 'source' | 'smt-query', data: string) {
    if (kind === 'source') {
      return readCallback(data)
    } else if (kind === 'smt-query') {
      return smtSolverCallback(data)
    } else {
      assert(false, 'Invalid callback kind specified.')
    }
  }

  singleCallback = wrapCallbackWithKind<'source' | 'smt-query'>(coreBindings, singleCallback)

  const cb = coreBindings.addFunction(singleCallback, 'viiiii')
  let output
  try {
    args.push(cb)

    // Callback context.
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
