<script lang="ts" setup>
import {
  definePageMeta,
  reactive,
  ref,
  useRoute,
  useSanctumAuth,
} from '#imports'

definePageMeta({
  middleware: ['sanctum:auth'],
})

const { twoFactorQrSvg, confirmTwoFactorAuthentication } = useSanctumAuth()
const route = useRoute()

const qrCodeSVG = ref()
const credentials = reactive({
  code: '',
})

const twoFactorQrCodeError = ref('')

try {
  const qrCodeResponse = await twoFactorQrSvg()
  qrCodeSVG.value = qrCodeResponse.svg
} catch (e) {
  console.log(e)
}

async function onFormSubmit() {
  try {
    await confirmTwoFactorAuthentication(credentials)
  }
  catch (error) {
    twoFactorQrCodeError.value = error as string
  }
}
</script>

<template>
  <div v-if="route.query.redirect">
    Hmmm, looks like you tried to open
    <em>"{{ route.query.redirect }}"</em> page, login first to access it and
    we can redirect you there
  </div>

  <h2>Setup Two Factor Authentication</h2>

  <p
    v-if="twoFactorQrCodeError"
    class="error-message"
  >
    Error - {{ twoFactorQrCodeError }}
  </p>

  <form
    class="login-form"
    @submit.prevent="onFormSubmit"
  >
    <!-- QR Code Section -->
    <div
      v-if="qrCodeSVG"
      class="text-center mb-6"
    >
      <p class="text-gray-600 mb-2">
        Scan this QR code with your authenticator app:
      </p>
      <div
        class="inline-block border border-gray-300 rounded-lg p-2 bg-gray-100"
        v-html="qrCodeSVG"
      />
    </div>

    <div class="input-group">
      <label for="code">Code</label>
      <input
        id="code"
        v-model="credentials.code"
        autocomplete="username"
        type="text"
        name="code"
      >
    </div>

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
