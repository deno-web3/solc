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

export { createRequire } from 'https://deno.land/std@0.177.0/node/module.ts'
