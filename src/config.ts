import type { ModuleOptions } from './runtime/types/options'

export const defaultModuleOptions: ModuleOptions = {
  baseUrl: 'http://localhost:80',
  mode: 'cookie',
  userStateKey: 'sanctum.user.identity',
  redirectIfAuthenticated: false,
  redirectIfUnauthenticated: false,
  twoFactor: {
    enforce: false,
    confirm: true,
    confirmPassword: true,
  },
  endpoints: {
    csrf: '/sanctum/csrf-cookie',
    login: '/login',
    two_factor_qr_code: '/user/two-factor-qr-code',
    two_factor_enable: '/user/two-factor-authentication',
    two_factor_confirm: '/user/confirmed-two-factor-authentication',
    two_factor_challenge: '/two-factor-challenge',
    two_factor_recovery_codes: '/user/two-factor-recovery-codes',
    two_factor_disable: '/user/two-factor-authentication',
    confirm_password: '/user/confirm-password',
    logout: '/logout',
    user: '/api/user',
  },
  csrf: {
    cookie: 'XSRF-TOKEN',
    header: 'X-XSRF-TOKEN',
  },
  client: {
    retry: false,
    initialRequest: true,
  },
  redirect: {
    keepRequestedRoute: false,
    onLogin: '/',
    onTwoFactorOnly: '/two-factor-qr-code',
    onLogout: '/',
    onAuthOnly: '/login',
    onGuestOnly: '/',
    onLoginWithTwoFactor: '/two-factor-challenge',
    onLoginWithConfigureTwoFactor: '/two-factor-qr-code',
    toRecoveryCodesOnConfirmingTwoFactor: '/two-factor-recovery-codes',
  },
  globalMiddleware: {
    enabled: false,
    prepend: false,
    allow404WithoutAuth: true,
  },
  logLevel: 3,
  appendPlugin: false,
}
