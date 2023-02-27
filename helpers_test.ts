export const exists = async (filename: string): Promise<boolean> => {
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

export { createRequire } from 'https://deno.land/std@0.178.0/node/module.ts'
