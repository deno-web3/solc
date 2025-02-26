import { isNil } from '../common.ts'
import { type CoreBindings, type License, Reset, type SolJson } from 'solc/types'
import { bindSolcMethod, bindSolcMethodWithFallbackFunc } from './helpers.ts'

export function setupCore(solJson: SolJson): CoreBindings {
  const core = {
    alloc: bindAlloc<(n: number) => number>(solJson),
    license: bindLicense(solJson),
    version: bindVersion<() => string>(solJson),
    reset: bindReset(solJson),
  }

  const helpers = {
    // @ts-expect-error binding to this
    addFunction: unboundAddFunction.bind(this, solJson),
    // @ts-expect-error binding to this
    removeFunction: unboundRemoveFunction.bind(this, solJson),
    // @ts-expect-error binding to this
    copyFromCString: unboundCopyFromCString.bind(this, solJson),
    // @ts-expect-error binding to this
    copyToCString: unboundCopyToCString.bind(this, solJson, core.alloc),
  }

  return {
    ...core,
    ...helpers,
  }
}

/**********************
 * Core Functions
 **********************/

/**
 * Returns a binding to the solidity_alloc function.
 *
 * @param solJson The Emscripten compiled Solidity object.
 */
function bindAlloc<T>(solJson: SolJson) {
  const allocBinding = bindSolcMethod<T>(
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

/**
 * Returns a binding to the solidity_version method.
 *
 * @param solJson The Emscripten compiled Solidity object.
 */
function bindVersion<T>(solJson: SolJson) {
  return bindSolcMethodWithFallbackFunc<T>(
    solJson,
    'solidity_version',
    'string',
    [],
    'version',
  )
}

/**
 * Returns a binding to the solidity_license method.
 *
 * If the current solJson version < 0.4.14 then this will bind an empty function.
 *
 * @param solJson The Emscripten compiled Solidity object.
 */
function bindLicense(solJson: SolJson) {
  return bindSolcMethodWithFallbackFunc<License>(
    solJson,
    'solidity_license',
    'string',
    [],
    'license',
    () => {
    },
  )
}

/**
 * Returns a binding to the solidity_reset method.
 *
 * @param solJson The Emscripten compiled Solidity object.
 */
function bindReset(solJson: SolJson) {
  return bindSolcMethod<Reset>(
    solJson,
    'solidity_reset',
    null,
    [],
    null,
  )
}

/**********************
 * Helpers Functions
 **********************/

/**
 * Copy to a C string.
 *
 * Allocates memory using solc's allocator.
 *
 * Before 0.6.0:
 *   Assuming copyToCString is only used in the context of wrapCallback, solc will free these pointers.
 *   See https://github.com/ethereum/solidity/blob/v0.5.13/libsolc/libsolc.h#L37-L40
 *
 * After 0.6.0:
 *   The duty is on solc-js to free these pointers. We accomplish that by calling `reset` at the end.
 *
 * @param solJson The Emscripten compiled Solidity object.
 * @param alloc The memory allocation function.
 * @param str The source string being copied to a C string.
 * @param ptr The pointer location where the C string will be set.
 */
function unboundCopyToCString(solJson: SolJson, alloc: (n: number) => number, str: string, ptr: number) {
  const length = solJson.lengthBytesUTF8(str)

  const buffer = alloc(length + 1)

  solJson.stringToUTF8(str, buffer, length + 1)
  solJson.setValue(ptr, buffer, '*')
}

/**
 * Wrapper over Emscripten's C String copying function (which can be different
 * on different versions).
 *
 * @param solJson The Emscripten compiled Solidity object.
 * @param ptr The pointer location where the C string will be referenced.
 */
function unboundCopyFromCString(solJson: SolJson, ptr: number) {
  return solJson.UTF8ToString(ptr)
}

function unboundAddFunction(solJson: SolJson, func: (...args: unknown[]) => unknown, signature?: string) {
  return (solJson.addFunction || solJson.Runtime.addFunction)(func, signature)
}

function unboundRemoveFunction(solJson: SolJson, ptr: number) {
  return (solJson.removeFunction || solJson.Runtime.removeFunction)(ptr)
}
