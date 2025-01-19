import { computed, type Ref } from 'vue'
import { trimTrailingSlash } from '../utils/formatter'
import { IDENTITY_LOADED_KEY } from '../utils/constants'
import { useSanctumClient } from './useSanctumClient'
import { useSanctumUser } from './useSanctumUser'
import { useSanctumConfig } from './useSanctumConfig'
import { useSanctumAppConfig } from './useSanctumAppConfig'
import { navigateTo, useNuxtApp, useRoute, useState } from '#app'

export interface SanctumAuth<T extends BaseUser> {
  user: Ref<T | null>
  isAuthenticated: Ref<boolean>
  isVerified: Ref<boolean>
  isAuthenticatedWithTwoFactor: Ref<boolean>
  init: () => Promise<void>
  login: (credentials: Record<string, any>) => Promise<void>
  enableTwoFactorAuthentication: () => Promise<void>
  confirmPassword: (credentials: { password: string }) => Promise<void>
  twoFactorQrSvg: () => Promise<{ svg?: string }>
  confirmTwoFactorAuthentication: (credentials: { code: string }) => Promise<void>
  twoFactorChallenge: (credentials: { code?: string, recovery_code?: string }) => Promise<void>
  getRecoveryCodes: () => Promise<string[]>
  regenerateRecoveryCodes: () => Promise<string[]>
  logout: () => Promise<void>
  refreshIdentity: () => Promise<void>
}

export interface BaseUser {
  id: number
  name: string
  email: string
  email_verified_at: Date
  two_factor_confirmed_at?: Date
  created_at: Date
  updated_at: Date
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
export const useSanctumAuth = <T extends BaseUser>(): SanctumAuth<T> => {
  const nuxtApp = useNuxtApp()

  const user = useSanctumUser<T>()
  const client = useSanctumClient()
  const options = useSanctumConfig()
  const appConfig = useSanctumAppConfig()

  const isAuthenticated = computed(() => {
    return !!user.value
  })

  const isVerified = computed(() => {
    return isAuthenticated && !!user.value?.email_verified_at
  })

  const isAuthenticatedWithTwoFactor = computed(() => {
    return isAuthenticated && !!user.value?.two_factor_confirmed_at
  })

  const currentRoute = computed(() => {
    return useRoute()
  })

  const currentPath = computed(() => {
    return trimTrailingSlash(currentRoute.value.path)
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
    if (isAuthenticated.value) {
      if (!options.redirectIfAuthenticated) {
        throw new Error('User is already authenticated')
      }

      if (
        options.redirect.onLogin === false
        || options.redirect.onLogin === currentPath.value
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

    if (options.twoFactor.enforce) {
      await handleTwoFactorAuthentication({ password: credentials.password }, response.two_factor || false)
    }
    else {
      await afterLogin(response)
    }
  }

  /**
   * Redirect the user based on the two-factor authentication settings
   */
  async function handleTwoFactorAuthentication(credentials: { password: string }, two_factor: boolean) {
    if (two_factor) {
      if (
        options.redirect.onLoginWithTwoFactor === false
        || options.redirect.onLoginWithTwoFactor === currentPath.value
      ) {
        return
      }

      if (options.redirect.onLoginWithTwoFactor === undefined) {
        throw new Error('`sanctum.redirect.onLoginWithTwoFactor` is not defined')
      }

      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onLoginWithTwoFactor as string),
      )
    }
    else {
      await refreshIdentity()
      await confirmPassword(credentials)
      await enableTwoFactorAuthentication()

      if (
        options.redirect.onLoginWithConfigureTwoFactor === false
        || options.redirect.onLoginWithConfigureTwoFactor === currentPath.value
      ) {
        return
      }

      if (options.redirect.onLoginWithConfigureTwoFactor === undefined) {
        throw new Error('`sanctum.redirect.onLoginWithConfigureTwoFactor` is not defined')
      }

      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onLoginWithConfigureTwoFactor as string),
      )
    }
  }

  /**
   * Calls the enable two-factor authentication endpoint to enable two-factor authentication for the user
   */
  async function enableTwoFactorAuthentication() {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to enable 2 Factor Authentication')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath.value) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly as string),
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
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath.value) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly as string),
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
   * Calls this endpoint to configure the two-factor using QR code
   */
  async function twoFactorQrSvg() {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to configure two factor authentication')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath.value) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly as string),
      )
    }

    if (options.endpoints.two_factor_qr_code === void 0) {
      throw new Error('`sanctum.endpoints.two_factor_qr_code` is not defined')
    }

    return await client(options.endpoints.two_factor_qr_code, {
      method: 'get',
    })
  }

  /**
   * Calls this endpoint to complete the two-factor challenge and login
   */
  async function confirmTwoFactorAuthentication(credentials: { code?: string, recovery_code?: string }) {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to confirm two factor authentication')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath.value) {
        return
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly as string),
      )
    }

    if (options.endpoints.two_factor_confirm === void 0) {
      throw new Error('`sanctum.endpoints.two_factor_confirm` is not defined')
    }

    const response = await client(options.endpoints.two_factor_confirm, {
      method: 'post',
      body: credentials,
    })

    if (options.redirect.toRecoveryCodesOnConfirmingTwoFactor === undefined) {
      throw new Error('`sanctum.redirect.toRecoveryCodesOnConfirmingTwoFactor` is not defined. Set it to '
        + 'false if no redirect to recovery codes is required')
    }

    if (options.redirect.toRecoveryCodesOnConfirmingTwoFactor) {
      if (options.endpoints.two_factor_confirm === void 0) {
        throw new Error('`sanctum.endpoints.two_factor_confirm` is not defined')
      }
    }

    await afterLogin(response, !options.redirect.toRecoveryCodesOnConfirmingTwoFactor)

    if (
      options.redirect.toRecoveryCodesOnConfirmingTwoFactor === false
      || currentRoute.value.path === options.redirect.toRecoveryCodesOnConfirmingTwoFactor
    ) {
      return
    }

    if (options.redirect.keepRequestedRoute) {
      const requestedRoute = currentRoute.value.query.redirect as string | undefined

      if (requestedRoute && requestedRoute !== currentPath.value) {
        await nuxtApp.runWithContext(async () => await navigateTo(requestedRoute))
        return
      }
    }

    await nuxtApp.runWithContext(
      async () => await navigateTo(options.redirect.toRecoveryCodesOnConfirmingTwoFactor as string),
    )
  }

  /**
   * Calls this endpoint to complete the two-factor challenge and login
   */
  async function twoFactorChallenge(credentials: { code?: string, recovery_code?: string }) {
    if (isAuthenticated.value) {
      if (!options.redirectIfAuthenticated) {
        throw new Error('User is already authenticated')
      }

      if (
        options.redirect.onLogin === false
        || options.redirect.onLogin === currentPath.value
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
  async function getRecoveryCodes(): Promise<string[]> {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to retrieve Two Factor recovery codes')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath.value) {
        return []
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly as string),
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
   * Calls this endpoint to regenerate the recovery codes for the user
   */
  async function regenerateRecoveryCodes(): Promise<string[]> {
    if (!isAuthenticated.value) {
      if (!options.redirectIfUnauthenticated) {
        throw new Error('Please login to generate two-factor recovery codes')
      }
      if (options.redirect.onAuthOnly === false || options.redirect.onAuthOnly === currentPath.value) {
        return []
      }
      if (options.redirect.onAuthOnly === void 0) {
        throw new Error('`sanctum.redirect.onAuthOnly` is not defined')
      }
      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onAuthOnly as string),
      )
    }

    if (options.endpoints.two_factor_recovery_codes === void 0) {
      throw new Error('`sanctum.endpoints.two_factor_recovery_codes` is not defined')
    }

    return await client(options.endpoints.two_factor_recovery_codes, {
      method: 'post',
    })
  }

  /**
   * Calls the logout endpoint and clears the user object
   */
  async function logout() {
    if (!isAuthenticated.value) {
      throw new Error('User is not authenticated')
    }

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
      || currentPath.value === options.redirect.onLogout
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
  async function afterLogin(response: Record<string, any>, redirect: boolean = true) {
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
      const requestedRoute = currentRoute.value.query.redirect as string | undefined

      if (requestedRoute && requestedRoute !== currentPath.value) {
        await nuxtApp.runWithContext(async () => await navigateTo(requestedRoute))
        return
      }
    }

    if (redirect) {
      return
    }

    if (
      options.redirect.onLogin === false
      || currentRoute.value.path === options.redirect.onLogin
    ) {
      return
    }

    if (options.redirect.onLogin === undefined) {
      throw new Error('`sanctum.redirect[redirectTo` is not defined')
    }

    await nuxtApp.runWithContext(
      async () => await navigateTo(options.redirect.onLogin as string),
    )
  }

  return {
    user,
    isAuthenticated,
    isVerified,
    isAuthenticatedWithTwoFactor,
    init,
    login,
    enableTwoFactorAuthentication,
    confirmPassword,
    twoFactorQrSvg,
    confirmTwoFactorAuthentication,
    twoFactorChallenge,
    getRecoveryCodes,
    regenerateRecoveryCodes,
    logout,
    refreshIdentity,
  } as SanctumAuth<T>
}
