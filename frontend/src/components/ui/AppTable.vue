<template>
  <div class="w-full overflow-x-auto rounded-xl bg-white border border-gray-100 shadow-sm">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="h-10 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <slot name="header" />
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 text-sm text-gray-900">
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script setup>
</script>
