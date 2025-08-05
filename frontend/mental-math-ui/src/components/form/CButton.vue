<template>
  <q-btn
    :label="label"
    :color="getColor"
    :text-color="textColor"
    :icon="icon"
    :icon-right="iconRight"
    :outline="outline"
    :flat="flat"
    :unelevated="unelevated"
    :rounded="rounded"
    :push="push"
    :glossy="glossy"
    :fab="fab"
    :fab-mini="fabMini"
    :dense="dense"
    :size="size"
    :loading="loading"
    :disable="disable"
    :round="round"
    :percentage="percentage"
    :dark="dark"
    :no-caps="noCaps"
    :no-wrap="noWrap"
    :type="type"
    :to="to"
    :href="href"
    @click="$emit('click', $event as MouseEvent)"
  >
    <slot></slot>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

interface Props {
  label?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'positive' | 'negative' | 'info' | 'warning';
  color?: string;
  textColor?: string;
  icon?: string;
  iconRight?: string;
  outline?: boolean;
  flat?: boolean;
  unelevated?: boolean;
  rounded?: boolean;
  push?: boolean;
  glossy?: boolean;
  fab?: boolean;
  fabMini?: boolean;
  dense?: boolean;
  size?: string;
  loading?: boolean;
  disable?: boolean;
  round?: boolean;
  percentage?: number;
  dark?: boolean;
  noCaps?: boolean;
  noWrap?: boolean;
  type?: 'button' | 'submit' | 'reset';
  to?: RouteLocationRaw;
  href?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  outline: false,
  flat: false,
  unelevated: false,
  rounded: false,
  push: false,
  glossy: false,
  fab: false,
  fabMini: false,
  dense: false,
  loading: false,
  disable: false,
  round: false,
  dark: false,
  noCaps: false,
  noWrap: false,
  type: 'button',
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

// Map variant to color if no specific color is provided
const getColor = computed(() => {
  if (props.color) return props.color;
  
  switch (props.variant) {
    case 'primary': return 'primary';
    case 'secondary': return 'secondary';
    case 'accent': return 'accent';
    case 'positive': return 'positive';
    case 'negative': return 'negative';
    case 'info': return 'info';
    case 'warning': return 'warning';
    default: return 'primary';
  }
});
</script>