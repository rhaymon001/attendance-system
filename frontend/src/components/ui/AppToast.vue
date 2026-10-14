<template>
  <div
    v-if="modelValue"
    class="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all"
    :class="variantClasses"
    role="status"
    aria-live="polite"
  >
    <span class="material-symbols-outlined text-xl shrink-0">
      {{ iconName }}
    </span>
    <span>{{ message }}</span>
    <button
      type="button"
      class="ml-2 p-0.5 text-current opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
      @click="close"
    >
      <span class="material-symbols-outlined text-base">close</span>
    </button>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'success' // 'success' | 'error' | 'info'
  },
  duration: {
    type: Number,
    default: 4000
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.duration > 0) {
      setTimeout(() => {
        close()
      }, props.duration)
    }
  }
)

const variantClasses = computed(() => {
  if (props.type === 'error') {
    return 'bg-red-50 text-red-800 border-red-200'
  }
  if (props.type === 'info') {
    return 'bg-blue-50 text-blue-800 border-blue-200'
  }
  return 'bg-green-50 text-green-800 border-green-200'
})

const iconName = computed(() => {
  if (props.type === 'error') return 'error'
  if (props.type === 'info') return 'info'
  return 'check_circle'
})
</script>
