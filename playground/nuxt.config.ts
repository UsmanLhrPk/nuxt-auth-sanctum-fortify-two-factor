export default defineNuxtConfig({
  modules: ['../src/module'],
  ssr: true,
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-09-28',
  sanctum: {
    baseUrl: 'http://localhost:8000',
    mode: 'cookie',
    logLevel: 5,
    twoFactor: {
      enforce: true,
      confirm: true,
      confirmPassword: true,
    },
    redirect: {
      keepRequestedRoute: true,
      onAuthOnly: '/login',
      onGuestOnly: '/profile',
      onLogin: '/welcome',
      onLogout: '/logout',
    },
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/login',
      logout: '/logout',
      user: '/api/user',
    },
    globalMiddleware: {
      allow404WithoutAuth: false,
      enabled: false,
      prepend: false,
    },
  },
})
