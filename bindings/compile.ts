import assert from 'node:assert'

import { bindSolcMethod } from './helpers.ts'
import type { Callbacks, CompileBindings, CompileJsonStandard, CoreBindings, ReadCallback, SolJson } from 'solc/types'

export function setupCompile(solJson: SolJson, core: CoreBindings): CompileBindings {
  return {
    compileStandard: bindCompileStandard(solJson, core),
  }
}

/**********************
 * COMPILE
 **********************/

/**
 * Returns a binding to the solidity solidity_compile method.
 * input (jsontext), callback (optional >= v6 only - ptr) -> output (jsontext)
 *
 * @param solJson The Emscripten compiled Solidity object.
 * @param coreBindings The core bound Solidity methods.
 */
function bindCompileStandard(solJson: SolJson, coreBindings: CoreBindings): CompileJsonStandard {
  // input (jsontext), callback (ptr), callback_context (ptr) -> output (jsontext)
  const boundFunctionSolidity: (jsontext: string, ptr?: number) => string = bindSolcMethod(
    solJson,
    'solidity_compile',
    'string',
    ['string', 'number', 'number'],
    null,
  )

  const boundFunctionStandard = function (input: string, callbacks: Callbacks) {
    return runWithCallbacks(solJson, coreBindings, callbacks, boundFunctionSolidity, [input])
  }

  return boundFunctionStandard as unknown as CompileJsonStandard
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
  callbacks?: Callbacks | ReadCallback,
  compile?: (...args: Args) => void,
  args: Args = [] as unknown as Args,
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

    output = compile?.(...args)
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
