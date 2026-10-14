<template>
  <div class="min-h-screen bg-gray-50 flex flex-col antialiased">
    <!-- Top Header -->
    <header class="fixed top-0 w-full z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div class="h-14 px-4 flex items-center justify-between">
        <h1 class="text-base font-semibold text-gray-900 tracking-tight">
          {{ pageTitle }}
        </h1>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {{ userInitials }}
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-red-500 p-1"
            title="Logout"
            @click="handleLogout"
          >
            <span class="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main View Area -->
    <main class="flex-1 w-full max-w-lg mx-auto pt-16 pb-20 px-4">
      <RouterView />
    </main>

    <!-- Bottom Navigation Bar (PWA Style) -->
    <nav class="fixed bottom-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-200">
      <div class="max-w-lg mx-auto h-16 flex items-center justify-around px-2">
        <RouterLink
          to="/student/courses"
          class="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors"
          :class="$route.path.startsWith('/student/courses') || $route.path.startsWith('/student/checkin') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'"
        >
          <span class="material-symbols-outlined text-2xl">qr_code_scanner</span>
          <span class="mt-0.5">Check In</span>
        </RouterLink>

        <RouterLink
          to="/student/attendance"
          class="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors"
          :class="$route.path.startsWith('/student/attendance') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'"
        >
          <span class="material-symbols-outlined text-2xl">history</span>
          <span class="mt-0.5">Attendance</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => {
  if (route.path.includes('/student/attendance')) return 'My Attendance'
  if (route.path.includes('/student/checkin')) return 'Check In / Scan'
  return 'My Courses'
})

const userInitials = computed(() => {
  const name = authStore.user?.name || 'Student'
  return name.slice(0, 2).toUpperCase()
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
