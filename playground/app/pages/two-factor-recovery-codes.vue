<script lang="ts" setup>
import {
  definePageMeta,
  ref,
  useSanctumAuth,
} from '#imports'
import ConfirmPassword from '~/components/ConfirmPassword.vue'

definePageMeta({
  middleware: ['sanctum:two-factor-auth'],
})

const { user, getRecoveryCodes, regenerateRecoveryCodes } = useSanctumAuth()

const recoveryCodes = ref<string[]>([])
const showConfirmPasswordForm = ref<boolean>(false)

const twoFactorRecoveryCodesError = ref('')

try {
  recoveryCodes.value = await getRecoveryCodes()
}
catch (e) {
  twoFactorRecoveryCodesError.value = e as string
}

const regenrateCodes = async () => {
  try {
    await regenerateRecoveryCodes()
    recoveryCodes.value = await getRecoveryCodes()
    showConfirmPasswordForm.value = false
  }
  catch (e) {
    twoFactorRecoveryCodesError.value = e as string
  }
}

const copyCodes = async () => {
  try {
    await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
  }
  catch (e) {
    console.error('Failed to copy code:', e)
  }
}

const downloadCodes = () => {
  const codesText = recoveryCodes.value.join('\n')
  const blob = new Blob([codesText], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `two-factor-recovery-codes-${user.value?.email}.txt`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
</script>

<template>
  <h2>Your Recovery Codes</h2>
  <h3>Store these recovery codes in a secure location. They can be used to regain access to your account if you lose your 2FA device.</h3>

  <p
    v-if="twoFactorRecoveryCodesError"
    class="error-message"
  >
    Error - {{ twoFactorRecoveryCodesError }}
  </p>

  <div>
    <div
      v-for="(code, index) in recoveryCodes"
      :key="index"
    >
      <div>
        <code>{{ code }}</code>
      </div>
    </div>
    <button @click="copyCodes">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
      </svg>
      Copy Codes
    </button>
  </div>

  <div>
    <button @click="downloadCodes">
      Download Recovery Codes
    </button>
  </div>

  <div v-show="showConfirmPasswordForm">
    <ConfirmPassword
      :after-confirm-password="regenrateCodes"
      label="Regenerate Codes"
    />
  </div>

  <div>
    <button @click="showConfirmPasswordForm = true">
      Regenerate Recovery Codes
    </button>
  </div>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: fit-content;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.error-message {
  color: red;
}
</style>
