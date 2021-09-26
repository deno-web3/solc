export type Assembly = string | null | undefined | { '.code': any[]; '.data': any[] }

export type FunctionResult = { contents: string; error: string }

export type Input = {
  language: 'Solidity'
  sources: Record<string, { content: string }>
  settings?: {
    optimizer?: {
      enabled?: boolean
    }
    outputSelection: Record<string, Record<string, Record<string, string[]>>>
    libraries: Record<string, any>
  }
}

export type GasEstimates = Partial<{
  creation: any
  internal: any
  external: any
}>

export type Contract = {
  gasEstimates: GasEstimates
  interface: string
  metadata: any
  assembly: any
  bytecode: any
  opcodes: any
  srcmap: any
  runtimeBytecode: any
  srcmapRuntime: any
  functionHashes: any
  evm: { bytecode: { object: any } }
}

export type Output = {
  error?: any
  errors: any
  contracts: Record<string, Contract>
  sourceList?: Record<string, any>
  sources: Record<string, any>
}
