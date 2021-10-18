// import * as linker from './linker.ts'
import type { Assembly /* , GasEstimates, Output  */ } from './types.ts'

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
