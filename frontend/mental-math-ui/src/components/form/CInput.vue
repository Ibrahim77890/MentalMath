<template>
  <div class="c-input">
    <q-input
      :model-value="modelValue"
      :label="label"
      :hint="hint"
      :type="type"
      :rules="rules"
      :disable="disable"
      :readonly="readonly"
      :dense="dense"
      :outlined="outlined"
      :filled="filled"
      :dark="dark"
      :color="color"
      :bg-color="bgColor"
      :loading="loading"
      :clearable="clearable"
      :error="error"
      :error-message="errorMessage"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      :hide-bottom-space="hideBottomSpace"
      :counter="counter"
      :maxlength="maxlength"
      @update:model-value="$emit('update:modelValue', $event)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
      @keyup="$emit('keyup', $event)"
      @keydown="$emit('keydown', $event)"
      @keypress="$emit('keypress', $event)"
      ref="inputRef"
    >
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend"></slot>
      </template>
      
      <template v-if="$slots.append" #append>
        <slot name="append"></slot>
      </template>
      
      <template v-if="$slots.before" #before>
        <slot name="before"></slot>
      </template>
      
      <template v-if="$slots.after" #after>
        <slot name="after"></slot>
      </template>
      
      <template v-if="$slots['error-message']" #error>
        <slot name="error-message"></slot>
      </template>
      
      <template v-if="$slots.hint" #hint>
        <slot name="hint"></slot>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QInput } from 'quasar';

interface Props {
  modelValue?: string | number | null;
  label?: string;
  hint?: string;
  type?: 'number' | 'email' | 'password' | 'text' | 'textarea' | 'time' | 'search' | 'tel' | 'file' | 'url' | 'date' | 'datetime-local';
  rules?: Array<(val: unknown) => boolean | string>;
  disable?: boolean;
  readonly?: boolean;
  dense?: boolean;
  outlined?: boolean;
  filled?: boolean;
  dark?: boolean;
  color?: string;
  bgColor?: string;
  loading?: boolean;
  clearable?: boolean;
  error?: boolean;
  errorMessage?: string;
  placeholder?: string;
  autocomplete?: string;
  autofocus?: boolean;
  hideBottomSpace?: boolean;
  counter?: boolean;
  maxlength?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disable: false,
  readonly: false,
  dense: true,
  outlined: true,
  filled: false,
  dark: false,
  color: 'primary',
  loading: false,
  clearable: false,
  error: false,
  hideBottomSpace: false,
  counter: false,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'blur', event: Event): void;
  (e: 'focus', event: Event): void;
  (e: 'keyup', event: Event): void;
  (e: 'keydown', event: Event): void;
  (e: 'keypress', event: Event): void;
}>();

const inputRef = ref<QInput | null>(null);

// Expose methods for parent components
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
  getNativeElement: () => inputRef.value?.$refs.input,
});
</script>

<style lang="scss" scoped>
.c-input {
  width: 100%;
}
</style>