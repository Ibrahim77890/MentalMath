<template>
  <auth-layout 
    title="Welcome back" 
    subtitle="Sign in to your Mental Math account"
  >
    <q-form @submit="onSubmit">
      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        class="q-mb-md"
      />
      
      <q-input
        v-model="password"
        label="Password"
        type="password"
        outlined
        class="q-mb-md"
      />
      
      <div class="row justify-between items-center q-mb-md">
        <q-checkbox v-model="rememberMe" label="Remember me" />
        <q-btn flat dense color="primary" label="Forgot Password?" />
      </div>
      
      <q-btn 
        label="Sign In" 
        type="submit" 
        color="primary" 
        class="full-width"
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
import AuthLayout from 'src/layouts/AuthLayout.vue';

const email = ref('');
const password = ref('');
const rememberMe = ref(false);

function onSubmit() {
  console.log('Login attempt:', { 
    email: email.value, 
    password: password.value, 
    rememberMe: rememberMe.value 
  });
}
</script>