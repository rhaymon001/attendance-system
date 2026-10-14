<template>
  <span
    class="inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap"
    :class="[variantClass, sizeClass]"
  >
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral'
  },
  size: {
    type: String,
    default: 'md'
  }
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'success':
    case 'present':
      return 'bg-present/10 text-present'
    case 'danger':
    case 'rejected':
      return 'bg-rejected/10 text-rejected'
    case 'warning':
    case 'pending':
      return 'bg-warning/10 text-warning'
    case 'info':
    case 'primary':
      return 'bg-primary/10 text-primary'
    default:
      return 'bg-gray-100 text-gray-600'
  }
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'px-2 py-0.5 text-xs'
  return 'px-2.5 py-1 text-xs'
})
</script>
