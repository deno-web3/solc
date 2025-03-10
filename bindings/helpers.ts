import { isNil } from '../common.ts'
import type { SolJson } from 'solc/types'

export function bindSolcMethod<T>(
  solJson: SolJson,
  method: string,
  returnType: string | null,
  args: string[],
  defaultValue?: unknown,
): T {
  if (isNil(solJson[`_${method}` as keyof typeof solJson]) && defaultValue !== undefined) {
    return defaultValue as T
  }

  return solJson.cwrap<T>(method, returnType, args)
}

export function bindSolcMethodWithFallbackFunc<T>(
  solJson: SolJson,
  method: string,
  returnType: string | null,
  args: string[],
  fallbackMethod: string,
  finalFallback: (() => void) | undefined = undefined,
): T {
  const methodFunc = bindSolcMethod<T>(solJson, method, returnType, args, null)

  if (!isNil(methodFunc)) {
    return methodFunc as T
  }

  return bindSolcMethod<T>(solJson, fallbackMethod, returnType, args, finalFallback)
}

export function getSupportedMethods(solJson: SolJson) {
  return {
    licenseSupported: anyMethodExists(solJson, 'solidity_license'),
    versionSupported: anyMethodExists(solJson, 'solidity_version'),
    allocSupported: anyMethodExists(solJson, 'solidity_alloc'),
    resetSupported: anyMethodExists(solJson, 'solidity_reset'),
    compileJsonStandardSupported: anyMethodExists(solJson, 'compileStandard', 'solidity_compile'),
  }
}

function anyMethodExists(solJson: SolJson, ...names: string[]) {
  return names.some((name) => !isNil(solJson[`_${name}` as keyof typeof solJson]))
}
