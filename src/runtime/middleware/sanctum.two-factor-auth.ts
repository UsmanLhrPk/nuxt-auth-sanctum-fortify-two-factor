import type { RouteLocationAsPathGeneric } from 'vue-router'
import { useSanctumConfig } from '../composables/useSanctumConfig'
import { useSanctumAuth } from '../composables/useSanctumAuth'
import { trimTrailingSlash } from '../utils/formatter'
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const options = useSanctumConfig()
  const { isAuthenticatedWithTwoFactor } = useSanctumAuth()

  if (isAuthenticatedWithTwoFactor.value) {
    return
  }

  const endpoint = options.redirect.onTwoFactorOnly

  if (endpoint === undefined) {
    throw new Error('`sanctum.redirect.onTwoFactorOnly` is not defined')
  }

  if (endpoint === false) {
    throw createError({ statusCode: 403 })
  }

  const redirect: RouteLocationAsPathGeneric = { path: endpoint }

  if (options.redirect.keepRequestedRoute) {
    redirect.query = { redirect: trimTrailingSlash(to.fullPath) }
  }

  return navigateTo(redirect, { replace: true })
})
