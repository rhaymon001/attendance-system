<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 transition-all max-w-lg"
      :class="customWidth || 'max-w-lg'"
    >
      <!-- Header -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <slot name="icon" />
          <h3 class="text-base font-semibold text-gray-900">
            {{ title }}
          </h3>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 focus:outline-none"
          aria-label="Close modal"
          @click="close"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <slot />
      </div>

      <!-- Footer -->
      <div
        v-if="$slots.footer"
        class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  customWidth: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>
