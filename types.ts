import type { CoreBindings as Bindings, LibraryAddresses, Wrapper as SolcWrapper } from './deps.ts'

export type Input = {
  language: 'Solidity' | 'Yul'
  sources: Record<string, { content: string }>
  settings?: Partial<{
    optimizer: Partial<{
      enabled: boolean
      runs: number
    }>

    outputSelection: Record<string, Record<string, string[]>>
    libraries: LibraryAddresses
  }>
}

export type LegacyAssemblyCode = {
  begin: number
  end: number
  name: string
  source: number
  value?: string
}

export type Assembly = string | null | undefined | { '.code': LegacyAssemblyCode[]; '.data': any[] }

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
  creation: { codeDepositCost: string; executionCost: string; totalCost: string }
  internal: any
  external: Record<string, string>
}>

export type ContractEVM = {
  assembly: string
  bytecode: {
    functionDebugData: FunctionDebugData
    generatedSources: GeneratedSources
    linkReferences: Record<string, string>[]
    object: string
    opcodes: string
    sourceMap: string
  }
  deployedBytecode: {
    functionDebugData: FunctionDebugData
    generatedSources: GeneratedSources
    immutableReferences: Record<string, { length: number; start: number }[]>
    linkReferences: Record<string, string>[]
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
  devdoc: { kind: string; methods: DocMethods; version: 1 }
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
  error?: CompilationError
  errors: CompilationError[]
  contracts: Record<string, Record<string, CompiledContract>>
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
