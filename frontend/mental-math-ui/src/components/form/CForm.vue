<template>
  <form
    class="c-form"
    @submit.prevent="onSubmit"
    novalidate
  >
    <div v-if="error" class="c-form__error q-mb-md">
      <q-banner
        rounded
        class="bg-negative text-white"
      >
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
      </q-banner>
    </div>

    <slot></slot>

    <div class="c-form__actions">
      <slot name="actions">
        <c-button
          v-if="submitLabel"
          v-bind="buttonProps"
        />
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CButton from './CButton.vue';

interface Props {
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  submitLabel: '',
});

const emit = defineEmits<{
  (e: 'submit'): void;
}>();

const buttonProps = computed(() => ({
  label: props.submitLabel,
  loading: props.loading,
  disable: props.loading,
  variant: 'primary' as const,
  class: 'full-width',
  type: 'submit' as const
}));

const onSubmit = () => {
  emit('submit');
};
</script>

<style lang="scss" scoped>
.c-form {
  &__actions {
    margin-top: 24px;
  }

  &__error {
    border-radius: 4px;
    font-size: 14px;
  }
}
</style>