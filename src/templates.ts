import { addTypeTemplate, type Resolver } from '@nuxt/kit'
import { relative, resolve } from 'pathe'

export const registerTypeTemplates = (resolver: Resolver) => {
  addTypeTemplate({
    filename: 'types/sanctum.d.ts',
    getContents: ({ nuxt }) => {
      const { buildDir } = nuxt.options
      const getRelativePath = (path: string) => relative(resolve(buildDir, './types'), resolver.resolve(path))
      return `// Generated by nuxt-auth-sanctum module
import type { SanctumAppConfig } from '${getRelativePath('./runtime/types/config.ts')}';
import type { SanctumGlobalMiddlewarePageMeta } from '${getRelativePath('./runtime/types/meta.ts')}';

declare module 'nuxt/schema' {
    interface AppConfig {
        sanctum?: SanctumAppConfig;
    }
    interface AppConfigInput {
        sanctum?: SanctumAppConfig;
    }
}

declare module '@nuxt/schema' {
    interface AppConfig {
        sanctum?: SanctumAppConfig;
    }
    interface AppConfigInput {
        sanctum?: SanctumAppConfig;
    }
}

declare module '#app' {
    interface PageMeta {
        /**
         * Sanctum global middleware page configuration.
         */
        sanctum?: Partial<SanctumGlobalMiddlewarePageMeta>;
    }
}

declare module '#app/../pages/runtime/composables' {
    interface PageMeta {
        /**
         * Sanctum global middleware page configuration.
         */
        sanctum?: Partial<SanctumGlobalMiddlewarePageMeta>;
    }
}

export {};`
    },
  })
}
