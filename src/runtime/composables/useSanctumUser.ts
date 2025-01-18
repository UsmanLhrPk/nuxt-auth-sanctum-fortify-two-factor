import type { Ref } from 'vue'
import { useSanctumConfig } from './useSanctumConfig'
import { useState } from '#app'
import type { User } from '~/src/runtime/types/user'

/**
 * Returns a current authenticated user information.
 * @returns Reference to the user state as T.
 */
export const useSanctumUser = <T>(): Ref<T | User | null> => {
  const options = useSanctumConfig()
  return useState<T | User | null>(options.userStateKey, () => null)
}
