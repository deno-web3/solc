import { isNil } from '../common.ts'
import { SolJson } from '../deps.ts'

export function bindSolcMethod<T>(
  solJson: SolJson,
  method: string,
  returnType: string | null,
  args: string[],
  defaultValue?: unknown,
): T {
  if (isNil((solJson as any)[`_${method}`]) && defaultValue !== undefined) {
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
    compileJsonSupported: anyMethodExists(solJson, 'compileJSON'),
    compileJsonMultiSupported: anyMethodExists(solJson, 'compileJSONMulti'),
    compileJsonCallbackSuppported: anyMethodExists(solJson, 'compileJSONCallback'),
    compileJsonStandardSupported: anyMethodExists(solJson, 'compileStandard', 'solidity_compile'),
  }
}

function anyMethodExists(solJson: SolJson, ...names: string[]) {
  return names.some((name) => !isNil((solJson as any)[`_${name}`]))
}
