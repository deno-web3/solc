import { wrapper } from 'solc'
import { Input } from 'solc/types'
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

const MyToken = await readFile('./MyToken.sol')
const ERC20 = await readFile('./ERC20.sol')

const input: Input = {
  language: 'Solidity',
  sources: {
    'MyToken.sol': {
      content: MyToken
    },
    'ERC20.sol': {
      content: ERC20
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
}

const result = JSON.parse(solc.compile(JSON.stringify(input)))

console.log(result)
