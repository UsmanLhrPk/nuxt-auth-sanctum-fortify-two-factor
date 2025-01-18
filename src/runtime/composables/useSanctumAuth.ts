import { computed, type Ref } from 'vue'
import { trimTrailingSlash } from '../utils/formatter'
import { IDENTITY_LOADED_KEY } from '../utils/constants'
import { useSanctumClient } from './useSanctumClient'
import { useSanctumUser } from './useSanctumUser'
import { useSanctumConfig } from './useSanctumConfig'
import { useSanctumAppConfig } from './useSanctumAppConfig'
import { navigateTo, useNuxtApp, useRoute, useState } from '#app'

export interface SanctumAuth<T> {
  user: Ref<T | null>
  isAuthenticated: Ref<boolean>
  init: () => Promise<void>
  login: (credentials: Record<string, any>) => Promise<void>
  enableTwoFactorAuthentication: () => Promise<void>
  confirmPassword: (credentials: { password: string }) => Promise<void>
  twoFactorChallenge: (credentials: { code?: string, recovery_code?: string }) => Promise<void>
  getRecoveryCodes: () => Promise<string[]>
  logout: () => Promise<void>
  refreshIdentity: () => Promise<void>
}

export type TokenResponse = {
  token?: string
  two_factor?: boolean
}

/**
 * Provides authentication methods for Laravel Sanctum
 *
 * @template T Type of the user object
 */
export const useSanctumAuth = <T>(): SanctumAuth<T> => {
  const nuxtApp = useNuxtApp()

  const user = useSanctumUser<T>()
  const client = useSanctumClient()
  const options = useSanctumConfig()
  const appConfig = useSanctumAppConfig()

  const isAuthenticated = computed(() => {
    return user.value !== null
  })

  const isIdentityLoaded = useState<boolean>(
    IDENTITY_LOADED_KEY,
    () => false,
  )

  /**
   * Initial request of the user identity for plugin initialization.
   * Only call this method when `sanctum.client.initialRequest` is false.
   */
  async function init() {
    if (isIdentityLoaded.value) {
      return
    }

    isIdentityLoaded.value = true
    await refreshIdentity()
  }

  /**
   * Fetches the user object from the API and sets it to the current state
   */
  async function refreshIdentity() {
    user.value = await client<T>(options.endpoints.user!)
  }

  /**
   * Calls the login endpoint and sets the user object to the current state
   *
   * @param credentials Credentials to pass to the login endpoint
   */
  async function login(credentials: Record<string, any>) {
    const currentRoute = useRoute()
    const currentPath = trimTrailingSlash(currentRoute.path)

    if (isAuthenticated.value) {
      if (!options.redirectIfAuthenticated) {
        throw new Error('User is already authenticated')
      }

      if (
        options.redirect.onLogin === false
        || options.redirect.onLogin === currentPath
      ) {
        return
      }

      if (options.redirect.onLogin === undefined) {
        throw new Error('`sanctum.redirect.onLogin` is not defined')
      }

      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onLogin as string),
      )
    }

    if (options.endpoints.login === undefined) {
      throw new Error('`sanctum.endpoints.login` is not defined')
    }

    const response = await client<TokenResponse>(options.endpoints.login, {
      method: 'post',
      body: credentials,
    })

    await afterLogin(response)
  }

  /**
   * Calls the enable two-factor authentication endpoint to enable two-factor authentication for the user
   */
  async function enableTwoFactorAuthentication() {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to enable 2 Factor Authentication')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly),
      )
    }

    if (options.endpoints.two_factor_enable === void 0) {
      throw new Error('`sanctum.endpoints.two_factor_enable` is not defined')
    }

    await client(options.endpoints.two_factor_enable, {
      method: 'post',
    })
  }

  /**
   * Calls this endpoint to confirm the users' password
   */
  async function confirmPassword(credentials: { password: string }) {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('You must be logged in to perform this action')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly),
      )
    }

    if (options.endpoints.confirm_password === void 0) {
      throw new Error('`sanctum.endpoints.confirm_password` is not defined')
    }

    await client(options.endpoints.confirm_password, {
      method: 'post',
      body: credentials,
    })
  }

  /**
   * Calls this endpoint to complete the two-factor challenge and login
   */
  async function twoFactorChallenge(credentials) {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to complete two factor authentication')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly),
      )
    }

    if (options.endpoints.two_factor_challenge === void 0) {
      throw new Error('`sanctum.endpoints.two_factor_challenge` is not defined')
    }

    const response = await client(options.endpoints.two_factor_challenge, {
      method: 'post',
      body: credentials,
    })

    await afterLogin(response)
  }

  /**
   * Calls this endpoint to get the recovery codes for the user
   */
  async function getRecoveryCodes(): string[] {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to retrieve Two Factor recovery codes')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly),
      )
    }

    if (options.endpoints.two_factor_recovery_codes === void 0) {
      throw new Error('`sanctum.endpoints.two_factor_recovery_codes` is not defined')
    }

    return await client(options.endpoints.two_factor_recovery_codes, {
      method: 'get',
    })
  }

  /**
   * Calls the logout endpoint and clears the user object
   */
  async function logout() {
    if (!isAuthenticated.value) {
      throw new Error('User is not authenticated')
    }

    const currentRoute = useRoute()
    const currentPath = trimTrailingSlash(currentRoute.path)

    if (options.endpoints.logout === undefined) {
      throw new Error('`sanctum.endpoints.logout` is not defined')
    }

    await client(options.endpoints.logout, { method: 'post' })

    user.value = null

    if (options.mode === 'token') {
      if (appConfig.tokenStorage === undefined) {
        throw new Error('`sanctum.tokenStorage` is not defined in app.config.ts')
      }

      await appConfig.tokenStorage.set(nuxtApp, undefined)
    }

    if (
      options.redirect.onLogout === false
      || currentPath === options.redirect.onLogout
    ) {
      return
    }

    if (options.redirect.onLogout === undefined) {
      throw new Error('`sanctum.redirect.onLogout` is not defined')
    }

    await nuxtApp.runWithContext(
      async () => await navigateTo(options.redirect.onLogout as string),
    )
  }

  /**
   * After login successfully handle the response and save the token if needed
   */
  async function afterLogin(response: Record<string, any>) {
    if (options.mode === 'token') {
      if (appConfig.tokenStorage === undefined) {
        throw new Error('`sanctum.tokenStorage` is not defined in app.config.ts')
      }

      if (response.token === undefined) {
        throw new Error('Token was not returned from the API')
      }

      await appConfig.tokenStorage.set(nuxtApp, response.token)
    }

    await refreshIdentity()

    if (options.redirect.keepRequestedRoute) {
      const requestedRoute = currentRoute.query.redirect as string | undefined

      if (requestedRoute && requestedRoute !== currentPath) {
        await nuxtApp.runWithContext(async () => await navigateTo(requestedRoute))
        return
      }
    }

    if (
      options.redirect.onLogin === false
      || currentRoute.path === options.redirect.onLogin
    ) {
      return
    }

    if (options.redirect.onLogin === undefined) {
      throw new Error('`sanctum.redirect.onLogin` is not defined')
    }

    await nuxtApp.runWithContext(
      async () => await navigateTo(options.redirect.onLogin as string),
    )
  }

  return {
    user,
    isAuthenticated,
    init,
    login,
    enableTwoFactorAuthentication,
    confirmPassword,
    twoFactorChallenge,
    getRecoveryCodes,
    logout,
    refreshIdentity,
  } as SanctumAuth<T>
}
