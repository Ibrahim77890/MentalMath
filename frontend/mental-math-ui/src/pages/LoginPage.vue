<template>
  <auth-layout
    title="Welcome back" 
    subtitle="Sign in to your Mental Math account"
  >
    <q-form @submit.prevent="onSubmit" style="display: flex; gap: 8px; flex-direction: column;">
      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        class="q-mb-lg`input-field"
      />
      
      <q-input
        v-model="password"
        label="Password"
        type="password"
        outlined
        class="q-mb-lg`input-field"
      />

      <div v-if="error" class="text-negative q-mb-md">{{ error }}</div>
      
      <q-btn 
        label="Sign In" 
        type="submit" 
        color="primary" 
        class="full-width"
        :loading="loading"
      />
    </q-form>
    
    <template #footer>
      <div class="text-center">
        Don't have an account?
        <router-link to="/register" class="text-primary">Sign up</router-link>
      </div>
    </template>
  </auth-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from 'src/layouts/AuthLayout.vue';
import { useAuth } from 'src/composables/useAuth';

const email = ref('learner@gmail.com');
const password = ref('password123');
const { login, loading, error } = useAuth();
const router = useRouter();

async function onSubmit() {
  await login(email.value, password.value);
  if (!error.value) {
    await router.push({ name: 'dashboard' });
  }
}
</script>

<style scoped>
.input-field {
  border: 8px solid white;
}

.input-field :deep(.q-field__control) {
  background: white;
}

.input-field :deep(.q-field__control:before) {
  border: 1px solid #ddd;
}

.input-field :deep(.q-field__control:hover:before) {
  border-color: #999;
}
</style>