export const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename)
    return true
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false
    } else {
      throw error
    }
  }
}

export { createRequire } from 'node:module'
