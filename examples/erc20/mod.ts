import { wrapper } from 'solc'
import { Input } from 'solc/types'
import { download } from 'solc/download'
import { createRequire } from '../../helpers_test.ts'
import { exists } from '../../helpers_test.ts'

if (!(await exists('./soljson.js'))) await download()

const require = createRequire(import.meta.url)
const solc = wrapper(require('./soljson.js'))

const MyToken = await Deno.readTextFile('./MyToken.sol')
const ERC20 = await Deno.readTextFile('./ERC20.sol')

const input: Input = {
  language: 'Solidity',
  sources: {
    'MyToken.sol': {
      content: MyToken,
    },
    'ERC20.sol': {
      content: ERC20,
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

const result = JSON.parse(solc.compile(JSON.stringify(input)))

console.log(result)
