import { setupMethods } from '../wrapper.ts'
import '../env.ts'
import { Input, Output } from '../types.ts'
import { exists } from '../utils.ts'
import { download } from '../download.ts'
import { process, createRequire } from '../deps.ts'

// @ts-ignore Node.js
globalThis.process = process

if (!(await exists('./soljson.js'))) await download('./soljson.js')

const dec = new TextDecoder()

const require = createRequire(import.meta.url)

const solc = setupMethods(require('../soljson.js'))

const readFile = async (path: string) => {
  const file = await Deno.readFile(path)
  return dec.decode(file)
}

const MyToken = await readFile('./MyToken.sol')
const ERC20 = await readFile('./ERC20.sol')
const IERC20 = await readFile('./interfaces/IERC20.sol')

const input: Input = {
  language: 'Solidity',
  sources: {
    'MyToken.sol': {
      content: MyToken
    },
    'ERC20.sol': {
      content: ERC20
    },
    'interfaces/IERC20.sol': {
      content: IERC20
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

const compile = () => JSON.parse(solc.compile(JSON.stringify(input)))

const result = compile() as Output

console.log(result.contracts['MyToken.sol'].MyToken.evm.bytecode)
