import { readerFromStreamReader, copy } from './deps.ts'

export const download = async (version?: string) => {
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
    await Deno.mkdir(`${Deno.cwd()}/.cache`)
    const f = await Deno.open(`${Deno.cwd()}/.cache/soljson.js`, { create: true, write: true })
    await copy(r, f)
    f.close()
  }
}
