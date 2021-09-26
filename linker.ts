import { keccak256 } from './deps.ts'
import { assert } from './utils.ts'

const libraryHashPlaceholder = (input: string) => `$${keccak256(input).slice(0, 34)}$`

export const linkBytecode = (bytecode: string, libraries: Record<string, any>) => {
  // NOTE: for backwards compatibility support old compiler which didn't use file names
  const librariesComplete: Record<string, any> = {}
  for (var libraryName in libraries) {
    if (typeof libraries[libraryName] === 'object') {
      // API compatible with the standard JSON i/o
      for (const lib in libraries[libraryName]) {
        librariesComplete[lib] = libraries[libraryName][lib]
        librariesComplete[`${libraryName}:${lib}`] = libraries[libraryName][lib]
      }
    } else {
      // backwards compatible API for early solc-js versions
      const parsed = libraryName.match(/^([^:]+):(.+)$/)
      if (parsed) librariesComplete[parsed[2]] = libraries[libraryName]
      librariesComplete[libraryName] = libraries[libraryName]
    }
  }

  for (libraryName in librariesComplete) {
    let hexAddress = librariesComplete[libraryName]
    if (hexAddress.slice(0, 2) !== '0x' || hexAddress.length > 42) {
      throw new Error(`Invalid address specified for ${libraryName}`)
    }
    // remove 0x prefix
    hexAddress = hexAddress.slice(2)
    hexAddress = Array(40 - hexAddress.length + 1).join('0') + hexAddress

    // Support old (library name) and new (hash of library name)
    // placeholders.
    const replace = (name: string) => {
      // truncate to 37 characters
      const truncatedName = name.slice(0, 36)
      const libLabel = `__${truncatedName}${Array(37 - truncatedName.length).join('_')}__`
      while (bytecode.includes(libLabel)) bytecode = bytecode.replace(libLabel, hexAddress)
    }

    replace(libraryName)
    replace(libraryHashPlaceholder(libraryName))
  }

  return bytecode
}

export const findLinkReferences = (bytecode: string): Record<string, { start: number; length: number }[]> => {
  // find 40 bytes in the pattern of __...<36 digits>...__
  // e.g. __Lib.sol:L_____________________________
  const linkReferences: Record<string, { start: number; length: number }[]> = {}
  let offset = 0
  while (true) {
    const found = bytecode.match(/__(.{36})__/)
    if (!found) break

    const start = found.index!
    // trim trailing underscores
    // NOTE: this has no way of knowing if the trailing underscore was part of the name
    const libraryName: string = found[1].replace(/_+$/gm, '')

    if (!linkReferences[libraryName]) linkReferences[libraryName] = []

    linkReferences[libraryName].push({
      // offsets are in bytes in binary representation (and not hex)
      start: (offset + start) / 2,
      length: 20
    })

    offset += start + 20

    bytecode = bytecode.slice(start + 20)
  }
  return linkReferences
}
