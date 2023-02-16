import { setupSolc } from 'solc'
import { Input } from 'solc/types'
import { download } from 'solc/download'
import 'solc/env'

const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename)
    // successful, file or directory must exist
    return true
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // file or directory does not exist
      return false
    } else {
      // unexpected error, maybe permissions, pass it along
      throw error
    }
  }
}

if (!(await exists('./soljson.js'))) await download('./soljson.js')

const dec = new TextDecoder()

const solc = setupSolc('./soljson.js')

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
