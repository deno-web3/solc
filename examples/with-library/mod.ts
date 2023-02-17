import { wrapper } from 'solc'
import { Input, Output } from 'solc/types'
import { download } from 'solc/download'
import { createRequire } from '../../helpers_test.ts'
import { exists } from '../../helpers_test.ts'

if (!(await exists('./soljson.js'))) await download()

const dec = new TextDecoder()

const require = createRequire(import.meta.url)
const solc = wrapper(require('./soljson.js'))

const readFile = async (path: string) => {
  const file = await Deno.readFile(path)
  return dec.decode(file)
}

const Example = await readFile('./Example.sol')
const LibString = await readFile('./LibString.sol')

const input: Input = {
  language: 'Solidity',
  sources: {
    'Example.sol': {
      content: Example,
    },
    'LibString.sol': {
      content: LibString,
    },
  },

  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
}

const result = JSON.parse(solc.compile(JSON.stringify(input))) as Output

console.log(result.contracts['LibString.sol']['LibString'].evm.bytecode)
