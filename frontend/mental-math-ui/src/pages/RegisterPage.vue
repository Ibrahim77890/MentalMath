<template>
  <q-page class="register-page">
    <div class="auth-container">
      <auth-layout
        title="Create Account"
        subtitle="Sign up for Mental Math"
      >
        <c-form
          :error="formError"
          submit-label="Sign Up"
          @submit="handleSubmit"
        >
          <c-input
            v-model="form.fullName"
            label="Full Name"
            type="text"
            :rules="[val => !!val || 'Full name is required']"
            placeholder="Enter your full name"
            class="q-mb-md"
          />
          
          <c-input
            v-model="form.email"
            label="Email"
            type="email"
            :rules="[
              val => !!val || 'Email is required',
              val => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test((val as any).toString()) || 'Please enter a valid email'
            ]"
            placeholder="Enter your email"
            class="q-mb-md"
          />
          
          <c-input
            v-model="form.password"
            label="Password"
            type="password"
            :rules="[val => !!val || 'Password is required']"
            placeholder="Create a password"
          />

          <c-input
            v-model="form.age"
            label="Age"
            type="number"
            :rules="[
              val => !!val || 'Age is required',
              val => Number(val) > 0 || 'Please enter a valid age',
              val => Number(val) >= 18 || 'You must be at least 18 years old'
            ]"
            placeholder="Enter your age"
            class="q-mb-md"
          />
        </c-form>
        
        <template #footer>
          <p>
            Already have an account?
            <router-link to="/login" class="text-primary">
              Sign in
            </router-link>
          </p>
        </template>
      </auth-layout>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from 'src/composables/useAuth';
import AuthLayout from 'src/layouts/AuthLayout.vue'; 
import CForm from 'src/components/form/CForm.vue';
import CInput from 'src/components/form/CInput.vue';

const { register, error } = useAuth();

const form = ref({
  fullName: '',
  email: '',
  password: '',
  age: null,
});

const formError = computed(() => error.value);

async function handleSubmit() {
  await register(
    form.value.fullName,
    form.value.age || 1,
    form.value.email,
    form.value.password
  );
}
</script>