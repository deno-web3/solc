import type { CoreBindings as Bindings, LibraryAddresses, Wrapper as SolcWrapper } from './deps.ts'

// Taken from https://stackoverflow.com/a/68404823/11889402
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`

type DotNestedKeys<T> =
  (T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<keyof T, symbol>]
    : '') extends infer D ? Extract<D, string> : never

type OutputSelection = DotNestedKeys<Omit<CompiledContract, 'abi'>> | 'abi' | '*' | 'ast'

export type InputSettings = Partial<{
  remappings: string[]
  optimizer: Partial<{
    enabled: boolean
    runs: number
    details: {
      peephole: boolean
      jumpdestRemover: boolean
      deduplicate: boolean
      orderLiterals: boolean
      cse: boolean
      constantOptimizer: boolean
      yul: boolean
      yulDetails: {
        /**
         * Improve allocation of stack slots for variables, can free up stack slots early. ctivated by default if the Yul optimizer is activated.
         */
        stackAllocation: boolean
        /**
         * Select optimization steps to be applied.
         * Optional, the optimizer will use the default sequence if omitted.
         */
        optimizerSteps: string
      }
    }
  }>
  outputSelection: Record<string, Record<string, OutputSelection[]>>
  libraries: LibraryAddresses
}>

export type Input = {
  /**
   * Source code language. Currently supported are "Solidity" and "Yul"
   */
  language: 'Solidity' | 'Yul'
  sources: Record<
    string,
    { content: string; keccak256?: `0x${string}` } | { urls: string[]; keccak256?: `0x${string}` }
  >
  settings?: InputSettings
}

export type LegacyAssemblyCode = {
  begin: number
  end: number
  name: string
  source: number
  value?: string
}

export type Assembly = string | null | undefined | {
  '.code': LegacyAssemblyCode[]
  '.data': {
    '.auxdata': string
    '.code': LegacyAssemblyCode[]
  }
}

export type GeneratedSources = {
  ast: YulAST
  contents: string
  id: number
  language: string
  name: string
}[]

export type FunctionDebugData = Record<
  string,
  { entryPoint: number | null; id: number | null; parameterSlots: number; returnSlots: number }
>

export type CompilationError = {
  component: 'general' | string
  errorCode: string
  formattedMessage: string
  message: string
  severity: 'error' | 'warning'
  sourceLocation: { end: number; file: string; start: number }
  type: 'Warning' | 'Parser' | string
}

export type ABI = {
  inputs: {
    internalType: string
    name: string
    type: string
  }[]

  name?: string
  outputs?: { internalType: string; name: string; type: string }[]
  stateMutability: string
  type: string
  payable?: boolean
  constant?: boolean
}

type Statement = {
  body: { nodeType: string; src: string; statements: Statement[] }
  name: string
  nodeType: string
  parameters: { name: string; nodeType: string; src: string; type: string }[]
  src: string
}

export type YulAST = {
  nodeType: string
  src: string
  name?: string
  statements: Statement[]
}

export type DocMethods = Record<
  string,
  {
    details: string
    params: Record<string, string>
  }
>
export type GasEstimates = Partial<{
  creation: { codeDepositCost: string; executionCost: string; totalCost: string } | string[]
  internal: Record<string, string>
  external: Record<string, string>
}>

export type LinkReferences = Record<string, Record<string, { length: number; start: number }[]>>

export type ContractEVM = {
  assembly: string
  bytecode: {
    functionDebugData: FunctionDebugData
    generatedSources: GeneratedSources
    linkReferences: LinkReferences
    object: string
    opcodes: string
    sourceMap: string
  }
  deployedBytecode: {
    functionDebugData: FunctionDebugData
    generatedSources: GeneratedSources
    immutableReferences: Record<string, { length: number; start: number }[]>
    linkReferences: LinkReferences
  }
  gasEstimates: GasEstimates
  legacyAssembly: {
    '.code': LegacyAssemblyCode[]
    '.data': Record<
      string,
      {
        '.auxdata': string
        '.code': LegacyAssemblyCode[]
      }
    >
  }
  methodIdentifiers: Record<string, string>
}

export type CompiledContract = {
  abi: ABI[]
  devdoc: { kind: string; methods: DocMethods; version: 1; author: string }
  evm: ContractEVM
  ewasm: { wasm: string }
  metadata: string
  storageLayout: {
    storage: {
      astId: number
      contract: string
      label: string
      offset: number
      slot: string
      type: string
    }[]
    types: Record<string, { encoding: string; key?: string; label: string; numberOfBytes: string; value?: string }>
  }
  userdoc: { kind: string; methods: DocMethods; version: number }
}

export type Output = {
  interface: string
  error?: CompilationError
  errors: CompilationError[]
  contracts: { gasEstimates?: GasEstimates } & Record<string, Record<string, CompiledContract>>
  sourceList?: string[]
  sources?: Record<string, { id: number; AST?: any }>
}

export type Wrapper = Pick<SolcWrapper, 'license' | 'compile' | 'version' | 'loadRemoteVersion'>

export type CoreBindings =
  & Omit<Bindings, 'versionToSemver' | 'isVersion6OrNewer' | 'copyFromCString' | 'copyToCString'>
  & {
    copyFromCString: (ptr: number) => string
    copyToCString: (input: string, ptr: number) => string
  }

export type Callbacks = Partial<{
  import: (data: unknown) => void
  smtSolver: (data: string) => void
}>
