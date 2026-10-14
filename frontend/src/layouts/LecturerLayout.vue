<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Desktop Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-40 flex flex-col justify-between">
      <div>
        <div class="h-16 px-6 flex items-center gap-3 border-b border-gray-800">
          <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-xl">school</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold tracking-wider uppercase text-white">Faculty Portal</span>
            <span class="text-xs text-gray-400">Lecturer Console</span>
          </div>
        </div>

        <div class="p-4">
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Instruction
          </div>
          <nav class="space-y-1">
            <RouterLink
              to="/lecturer/dashboard"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="
                $route.path === '/lecturer/dashboard'
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              "
            >
              <span class="material-symbols-outlined text-xl">menu_book</span>
              <span>My Courses</span>
            </RouterLink>
          </nav>
        </div>
      </div>

      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
              LC
            </div>
            <div class="truncate text-xs">
              <div class="font-medium text-white truncate">{{ authStore.user?.name || 'Lecturer' }}</div>
              <div class="text-gray-400 truncate">{{ authStore.user?.email || 'lecturer@portal.edu' }}</div>
            </div>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-red-400 p-1.5 rounded-lg transition-colors"
            title="Logout"
            @click="handleLogout"
          >
            <span class="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>

    <div class="pl-64 flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-800">Faculty Roll-Call &amp; Audit Engine</span>
        </div>
        <div class="text-right text-xs">
          <div class="font-semibold text-gray-900">{{ authStore.user?.name || 'Lecturer' }}</div>
          <div class="text-gray-500">Academic Staff</div>
        </div>
      </header>

      <main class="flex-1 p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
