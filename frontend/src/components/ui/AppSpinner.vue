<template>
  <div class="flex items-center justify-center gap-2" role="status" aria-live="polite">
    <span
      class="material-symbols-outlined animate-spin"
      :class="[sizeClass, colorClass]"
    >
      progress_activity
    </span>
    <span v-if="label" class="text-gray-500" :class="labelClass">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md'
  },
  color: {
    type: String,
    default: 'primary'
  },
  label: {
    type: String,
    default: ''
  }
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'text-lg'
  if (props.size === 'lg') return 'text-4xl'
  return 'text-2xl'
})

const labelClass = computed(() => {
  if (props.size === 'lg') return 'text-sm'
  return 'text-xs'
})

const colorClass = computed(() => {
  if (props.color === 'white') return 'text-white'
  if (props.color === 'muted') return 'text-gray-400'
  return 'text-primary'
})
</script>
