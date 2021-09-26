import { readerFromStreamReader, copy } from './deps.ts'

export const download = async (path: string, version?: string) => {
  console.log(`Fetching releases...`)
  const { releases, latestRelease } = await fetch('https://solc-bin.ethereum.org/bin/list.json').then((res) =>
    res.json()
  )

  const jsFile = releases[version || latestRelease]

  console.log(`Downloading soljson from https://solc-bin.ethereum.org/bin/${jsFile}...`)

  const res = await fetch(`https://solc-bin.ethereum.org/bin/${jsFile}`)

  const rdr = res.body?.getReader()

  if (rdr) {
    const r = readerFromStreamReader(rdr)
    const f = await Deno.open(path, { create: true, write: true })
    await copy(r, f)
    f.close()
  }
}
