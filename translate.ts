import * as linker from './linker.ts'
import type { Assembly, GasEstimates, Output } from './types.ts'

/// Translate old style version numbers to semver.
/// Old style: 0.3.6-3fc68da5/Release-Emscripten/clang
///            0.3.5-371690f0/Release-Emscripten/clang/Interpreter
///            0.3.5-0/Release-Emscripten/clang/Interpreter
///            0.2.0-e7098958/.-Emscripten/clang/int linked to libethereum-1.1.1-bbb80ab0/.-Emscripten/clang/int
///            0.1.3-0/.-/clang/int linked to libethereum-0.9.92-0/.-/clang/int
///            0.1.2-5c3bfd4b*/.-/clang/int
///            0.1.1-6ff4cd6b/RelWithDebInfo-Emscripten/clang/int
/// New style: 0.4.5+commit.b318366e.Emscripten.clang
export function versionToSemver(version: string) {
  // FIXME: parse more detail, but this is a good start
  const parsed = version.match(/^([0-9]+\.[0-9]+\.[0-9]+)-([0-9a-f]{8})[/*].*$/)
  if (parsed) {
    return `${parsed[1]}+commit.${parsed[2]}`
  }
  if (version.includes('0.1.3-0')) {
    return '0.1.3'
  }
  if (version.includes('0.3.5-0')) {
    return '0.3.5'
  }
  // assume it is already semver compatible
  return version
}

function translateErrors(
  ret: {
    type: string
    component: string
    severity: 'warning' | 'error'
    message: string
    formattedMessage: string
  }[],
  errors: Record<string, string>
) {
  for (const error in errors) {
    let type = 'error'
    const extractType = /^(.*):(\d+):(\d+):(.*):/.exec(errors[error])
    if (extractType) {
      type = extractType[4].trim()
    } else if (errors[error].indexOf(': Warning:')) {
      type = 'Warning'
    } else if (errors[error].indexOf(': Error:')) {
      type = 'Error'
    }
    ret.push({
      type,
      component: 'general',
      severity: type === 'Warning' ? 'warning' : 'error',
      message: errors[error],
      formattedMessage: errors[error]
    })
  }
}

function translateGasEstimates(gasEstimates: null | number | Record<string, any>) {
  if (gasEstimates === null) {
    return 'infinite'
  }

  if (typeof gasEstimates === 'number') {
    return gasEstimates.toString()
  }

  const gasEstimatesTranslated: Record<string, any> = {}
  for (const func in gasEstimates) {
    gasEstimatesTranslated[func] = translateGasEstimates(gasEstimates[func])
  }
  return gasEstimatesTranslated
}

export function translateJsonCompilerOutput(output: Output, libraries: Record<string, any>) {
  const ret: { errors: any[]; contracts: Record<string, any>; sources: Record<string, any> } = {
    errors: [],
    contracts: {},
    sources: {}
  }

  const errors = output.error ? [output.error] : output.errors

  translateErrors(ret.errors, errors)

  for (const contract in output.contracts) {
    // Split name first, can be `contract`, `:contract` or `filename:contract`
    const tmp = contract.match(/^(([^:]*):)?([^:]+)$/)
    if (tmp?.length !== 4) {
      // Force abort
      return null
    }
    const fileName = tmp[2] || ''

    const contractName = tmp[3]

    const contractInput = output.contracts[contract]

    const gasEstimates = contractInput.gasEstimates
    const translatedGasEstimates: GasEstimates = {}

    if (gasEstimates.creation) {
      translatedGasEstimates.creation = {
        codeDepositCost: translateGasEstimates(gasEstimates.creation[1]),
        executionCost: translateGasEstimates(gasEstimates.creation[0])
      }
    }
    if (gasEstimates.internal) translatedGasEstimates.internal = translateGasEstimates(gasEstimates.internal)
    if (gasEstimates.external) translatedGasEstimates.external = translateGasEstimates(gasEstimates.external)

    const contractOutput = {
      abi: JSON.parse(contractInput.interface),
      metadata: contractInput.metadata,
      evm: {
        legacyAssembly: contractInput.assembly,
        bytecode: {
          object: contractInput.bytecode && linker.linkBytecode(contractInput.bytecode, libraries || {}),
          opcodes: contractInput.opcodes,
          sourceMap: contractInput.srcmap,
          linkReferences: contractInput.bytecode && linker.findLinkReferences(contractInput.bytecode)
        },
        deployedBytecode: {
          object: contractInput.functionHashes && linker.linkBytecode(contractInput.functionHashes, libraries || {}),
          sourceMap: contractInput.srcmapRuntime,
          linkReferences: contractInput.functionHashes && linker.findLinkReferences(contractInput.functionHashes)
        },
        methodIdentifiers: contractInput.functionHashes,
        gasEstimates: translatedGasEstimates
      }
    }

    if (!ret.contracts[fileName]) ret.contracts[fileName] = {}

    ret.contracts[fileName][contractName] = contractOutput
  }

  const sourceMap: Record<string, string> = {}
  for (const sourceId in output.sourceList) sourceMap[output.sourceList[sourceId]] = sourceId

  for (const source in output['sources']) {
    ret['sources'][source] = {
      id: sourceMap[source],
      legacyAST: output['sources'][source].AST
    }
  }

  return ret
}

const escapeString = (text: string) => text.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')

// 'asm' can be an object or a string
function formatAssemblyText(asm: Assembly, prefix: string, source: string | undefined) {
  if (typeof asm === 'string' || asm == null) return `${prefix + (asm || '')}\n`
  let text = `${prefix}.code\n`
  asm['.code'].forEach(({ value, begin, end, name }) => {
    const v = value === undefined ? '' : value
    let src = ''
    if (source !== undefined && begin !== undefined && end !== undefined) src = escapeString(source.slice(begin, end))

    if (src.length > 30) src = `${src.slice(0, 30)}...`

    if (name !== 'tag') text += '  '

    text += `${prefix + name} ${v}\t\t\t${src}\n`
  })
  text += `${prefix}.data\n`
  const asmData = asm['.data'] || []
  for (const i in asmData) {
    const item = asmData[i]
    text += `  ${prefix}${i}:\n`
    text += formatAssemblyText(item, `${prefix}    `, source)
  }
  return text
}

export const prettyPrintLegacyAssemblyJSON = (assembly: Assembly, source: string) =>
  formatAssemblyText(assembly, '', source)
