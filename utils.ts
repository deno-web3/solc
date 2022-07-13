import * as _assert from 'https://deno.land/x/std@0.148.0/node/assert.ts'

export const assert = (actual: unknown, message: string) => _assert.strict(actual, message)

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
