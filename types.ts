export type LegacyAssemblyCode = {
  begin: number
  end: number
  name: string
  source: number
  value?: string
}

export type Assembly = string | null | undefined | { '.code': LegacyAssemblyCode[]; '.data': any[] }

export type FunctionResult = { contents: string; error: string }

export type Input = {
  language: 'Solidity' | 'Yul'
  sources: Record<string, { content: string }>
  settings: Partial<{
    optimizer: {
      enabled?: boolean
    }
    outputSelection: Record<string, Record<string, string[]>>
    libraries: Record<string, any>
  }>
}

export type GasEstimates = Partial<{
  creation: { codeDepositCost: string; executionCost: string; totalCost: string }
  internal: any
  external: Record<string, string>
}>

export type Contract = {
  gasEstimates: GasEstimates
  interface: string
  metadata: string
  assembly: any
  bytecode: any
  opcodes: string
  srcmap: any
  runtimeBytecode: any
  srcmapRuntime: any
  functionHashes: any
}

export type CompilationError = {
  component: string
  errorCode: string
  formattedMessage: string
  message: string
  severity: 'error' | 'warning'
  sourceLocation: { end: number; file: string; start: number }
  type: 'Warning' | 'Parser' | string
}

export type ABI = {
  inputs?: any[]
  name?: string
  outputs?: any[]
  stateMutability: string
  type: string
  payable?: boolean
  constant?: boolean
}

export type YulAST = {
  nodeType: string
  src: string
  name?: string
  statements: {
    body: { nodeType: string; src: string; statements: any[] }
    name: string
    nodeType: string
    parameters: { name: string; nodeType: string; src: string; type: string }[]
    src: string
  }[]
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

export type ContractEVM = {
  assembly: string
  bytecode: {
    functionDebugData: FunctionDebugData
    generatedSources: GeneratedSources
    linkReferences: any
    object: string
    opcodes: string
    sourceMap: string
  }
  deployedBytecode: {
    functionDebugData: FunctionDebugData
    generatedSources: GeneratedSources
    immutableReferences: Record<string, { length: number; start: number }[]>
    linkReferences: any
  }
  gasEstimates: GasEstimates
  legacyAssembly: {
    '.code': LegacyAssemblyCode[]
    '.data': Record<string, any>
  }
  methodIdentifiers: Record<string, string>
}

export type CompiledContract = {
  abi: ABI[]
  devdoc: { kind: string; methods: Record<string, any>; version: 1 }
  evm: ContractEVM
  ewasm: { wasm: string }
  metadata: string
  storageLayout: { storage: any[]; types: any }
  userdoc: { kind: string; methods: any; version: number }
}

export type Output = {
  error?: CompilationError
  errors: CompilationError[]
  contracts: Record<string, Record<string, CompiledContract>>
  sourceList?: Record<string, any>
  sources: Record<string, { id: number; AST?: any }>
}
