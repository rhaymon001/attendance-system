<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md mx-auto flex flex-col gap-6">
      <!-- Institutional Identity Header -->
      <div class="flex flex-col items-center text-center gap-2 pt-4">
        <div class="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined text-white text-3xl">school</span>
        </div>
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight uppercase">
            University Portal
          </h1>
          <p class="text-xs font-medium text-gray-500">
            Attendance & Verification System
          </p>
        </div>
      </div>

      <!-- Main Authentication Card -->
      <div class="w-full bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
        <!-- Academic Role Segmented Selector -->
        <div class="flex flex-col gap-1.5 text-left">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Academic Role
          </label>
          <div
            aria-label="Select User Role"
            class="grid grid-cols-3 p-1 bg-gray-100 rounded-lg gap-1"
            role="radiogroup"
          >
            <button
              v-for="roleOption in roles"
              :key="roleOption.value"
              :aria-checked="role === roleOption.value"
              class="h-10 rounded-md text-sm font-medium flex items-center justify-center transition-all"
              :class="
                role === roleOption.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              "
              role="radio"
              type="button"
              @click="role = roleOption.value"
            >
              {{ roleOption.label }}
            </button>
          </div>
        </div>

        <!-- Authentication Form -->
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <!-- Identifier / Email Input -->
          <div class="flex flex-col gap-1.5 text-left">
            <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider" for="email">
              {{ identifierLabel }}
            </label>
            <div class="relative flex items-center w-full">
              <span class="material-symbols-outlined absolute left-3 text-gray-400 text-xl pointer-events-none">
                badge
              </span>
              <input
                id="email"
                v-model="email"
                autocomplete="username"
                class="w-full h-11 pl-10 pr-3 bg-white border border-gray-200 text-gray-900 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                :placeholder="identifierPlaceholder"
                required
                type="text"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="flex flex-col gap-1.5 text-left">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider" for="password">
                Password
              </label>
              <button
                class="text-xs font-medium text-gray-500 hover:text-primary transition-colors focus:outline-none"
                type="button"
                @click="handleForgotPassword"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative flex items-center w-full">
              <span class="material-symbols-outlined absolute left-3 text-gray-400 text-xl pointer-events-none">
                lock
              </span>
              <input
                id="password"
                v-model="password"
                autocomplete="current-password"
                class="w-full h-11 pl-10 pr-10 bg-white border border-gray-200 text-gray-900 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter portal password"
                required
                :type="showPassword ? 'text' : 'password'"
              />
              <button
                aria-label="Toggle password visibility"
                class="absolute right-2.5 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-700 focus:outline-none"
                type="button"
                @click="togglePasswordVisibility"
              >
                <span class="material-symbols-outlined text-xl">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Informational Notice (e.g. Forgot Password) -->
          <div
            v-if="infoMessage"
            class="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 flex items-start gap-2 text-left"
          >
            <span class="material-symbols-outlined text-lg text-primary shrink-0 mt-0.5">
              contact_support
            </span>
            <span>{{ infoMessage }}</span>
          </div>

          <!-- Primary Submit Action -->
          <div class="pt-2">
            <button
              class="w-full h-11 bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              :disabled="isLoading"
              type="submit"
            >
              <template v-if="isLoading">
                <svg
                  class="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    d="M4 12a8 8 0 018-8v8H4z"
                    fill="currentColor"
                  ></path>
                </svg>
                <span>Signing In...</span>
              </template>
              <template v-else>
                <span>Sign In</span>
                <span class="material-symbols-outlined text-lg">arrow_forward</span>
              </template>
            </button>
          </div>

          <!-- Error Alert Banner -->
          <div
            v-if="errorMessage"
            class="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2 text-left"
          >
            <span class="material-symbols-outlined text-lg text-red-600 shrink-0">error</span>
            <span>{{ errorMessage }}</span>
          </div>
        </form>

        <!-- Institutional Registry Notice -->
        <div class="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-2.5 text-left">
          <span class="material-symbols-outlined text-gray-400 text-lg shrink-0 mt-0.5">
            verified_user
          </span>
          <p class="text-xs text-gray-500 leading-relaxed">
            Accounts are provisioned by the Academic Registry. For access credentials or verification support, contact the
            <span class="font-medium text-gray-900">ICT Helpdesk</span>.
          </p>
        </div>
      </div>

      <!-- Security & Audit Footer -->
      <div class="flex items-center justify-center gap-2 text-gray-400 text-xs pb-6">
        <span class="material-symbols-outlined text-base">lock</span>
        <span>256-bit SSL encrypted institutional session</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const emit = defineEmits(['submit'])

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const role = ref('student')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'admin', label: 'Admin' }
]

const identifierLabel = computed(() => {
  if (role.value === 'student') return 'Institutional Email or Matric No'
  if (role.value === 'lecturer') return 'Staff Email or Faculty ID'
  return 'Administrative ID or Official Email'
})

const identifierPlaceholder = computed(() => {
  if (role.value === 'student') return 'e.g. o.adeyemi@futo.edu.ng or CSC/2022/001'
  if (role.value === 'lecturer') return 'e.g. j.smith@faculty.edu.ng or STF/8821'
  return 'e.g. audit.officer@registry.edu.ng'
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleForgotPassword = () => {
  infoMessage.value = 'Please visit the Academic Registry desk (Room 104) with your valid University ID.'
}

const handleSubmit = async () => {
  if (isLoading.value) return
  errorMessage.value = ''
  isLoading.value = true

  const payload = {
    email: email.value.trim(),
    password: password.value,
    role: role.value
  }

  try {
    if (authStore && typeof authStore.login === 'function') {
      await authStore.login(payload)
    }

    const nextRole = authStore.role || role.value

    if (nextRole === 'admin') {
      await router.push('/admin/dashboard')
    } else if (nextRole === 'lecturer') {
      await router.push('/lecturer/dashboard')
    } else {
      await router.push('/student/courses')
    }

    emit('submit', payload)
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      error?.message ||
      'Authentication failed. Please verify your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>
