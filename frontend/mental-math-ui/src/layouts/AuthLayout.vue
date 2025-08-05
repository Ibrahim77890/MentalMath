<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div class="auth-container">
        <q-card class="auth-card">

          <div class="auth-card-content">
            <!-- Use either slot or router-view, not both -->
            <slot>
              <!-- If no slot content is provided, use router-view -->
              <router-view />
            </slot>
          </div>

          <q-separator v-if="$slots.footer" />

          <div v-if="$slots.footer" class="auth-footer">
            <slot name="footer"></slot>
          </div>
        </q-card>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Mental Math',
  subtitle: "Improve your mental math skills",
});
</script>

<style lang="scss">
@import '../css/auth.scss';
</style>