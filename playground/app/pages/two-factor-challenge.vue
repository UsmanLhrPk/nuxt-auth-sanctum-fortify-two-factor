<script lang="ts" setup>
import {
  definePageMeta,
  reactive,
  ref,
  useSanctumAuth,
} from '#imports'

definePageMeta({
  middleware: ['sanctum:guest'],
})

const { twoFactorChallenge } = useSanctumAuth()

const useRecoveryCode = ref(false)
const credentials = reactive({
  code: '',
  recovery_code: '',
})

const twoFactorChallengeError = ref('')

async function onFormSubmit() {
  try {
    await twoFactorChallenge(credentials)
  }
  catch (error) {
    twoFactorChallengeError.value = error as string
  }
}
</script>

<template>
  <h2>Verify Two Factor Authentication</h2>

  <p
    v-if="twoFactorChallengeError"
    class="error-message"
  >
    Error - {{ twoFactorChallengeError }}
  </p>

  <form
    class="login-form"
    @submit.prevent="onFormSubmit"
  >
    <div
      v-if="useRecoveryCode"
      class="input-group"
    >
      <label for="code">Code</label>
      <input
        id="recovery_code"
        v-model="credentials.recovery_code"
        autocomplete="username"
        type="text"
        name="recovery_code"
      >
    </div>

    <div
      v-else
      class="input-group">
      <label for="code">Code</label>
      <input
        id="code"
        v-model="credentials.code"
        autocomplete="username"
        type="text"
        name="code"
      >
    </div>

    <button
      type="button"
      @click="useRecoveryCode = !useRecoveryCode"
    >
      {{ useRecoveryCode ? 'Use verification code.' : 'Use recovery code instead.' }}
    </button>

    <button type="submit">
      Verify
    </button>
  </form>
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
