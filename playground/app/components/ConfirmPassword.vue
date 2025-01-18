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

const props = defineProps({
  label: {
    type: String,
    default: 'Confirm Password',
  },
  afterConfirmPassword: {
    type: Function,
    required: true,
  },
})

const { confirmPassword } = useSanctumAuth()

const credentials = reactive({
  password: '',
})

const confirmPasswordError = ref('')

async function onFormSubmit() {
  try {
    await confirmPassword(credentials)
    props.afterConfirmPassword()
  }
  catch (error) {
    confirmPasswordError.value = error as string
  }
  finally {
    credentials.password = ''
  }
}
</script>

<template>
  <h2>Confirm Password</h2>

  <p
    v-if="confirmPasswordError"
    class="error-message"
  >
    Error - {{ confirmPasswordError }}
  </p>

  <form
    class="confirmPassword-form"
    @submit.prevent="onFormSubmit"
  >
    <div class="input-group">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="credentials.password"
        type="password"
        autocomplete="current-password"
        name="password"
      >
    </div>

    <button type="submit">
      Confirm Password
    </button>
  </form>
</template>

<style scoped>
.confirmPassword-form {
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
