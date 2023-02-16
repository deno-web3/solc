import { copy, readerFromStreamReader } from './deps.ts'

/**
 * Downloads Solidity compiler
 * @param path download destination
 * @param version compiler version. if not specified, latest is downloaded
 */
export const download = async (path = './soljson.js', version?: string) => {
  console.log(`Fetching releases...`)
  const { releases, latestRelease } = (await fetch('https://solc-bin.ethereum.org/bin/list.json').then((res) =>
    res.json()
  )) as { releases: Record<string, string>; latestRelease: string }

  const jsFile: string = releases[version || latestRelease]

  if (!jsFile) throw new Error(`version ${version} not found`)

  console.log(`Downloading soljson from https://solc-bin.ethereum.org/bin/${jsFile}...`)

  const res = await fetch(`https://solc-bin.ethereum.org/bin/${jsFile}`)

  const rdr = res.body?.getReader()

  if (rdr) {
    const r = readerFromStreamReader(rdr)
    const f = await Deno.open(path, { create: true, write: true })
    await copy(r, f)
    f.close()
  }

  return jsFile
}
