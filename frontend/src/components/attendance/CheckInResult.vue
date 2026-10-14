<template>
  <div class="w-full pb-6">
    <!-- ==================== STATE 1: PRESENT (SUCCESS) ==================== -->
    <div
      v-if="result === 'present'"
      class="w-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
    >
      <!-- Celebration glow ring -->
      <div class="absolute -top-12 w-48 h-48 bg-green-50 rounded-full pointer-events-none opacity-60"></div>

      <!-- Verified Badge Icon -->
      <div class="relative mt-2 mb-4 flex items-center justify-center">
        <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center shadow-sm">
          <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span class="material-symbols-outlined text-4xl text-green-600">check_circle</span>
          </div>
        </div>
        <span class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs shadow-sm">
          <span class="material-symbols-outlined text-sm">sensors</span>
        </span>
      </div>

      <!-- Headline -->
      <h2 class="text-2xl font-bold text-gray-900 tracking-tight mb-1">
        Attendance Recorded
      </h2>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-800 font-medium text-xs mb-6">
        <span class="material-symbols-outlined text-sm">verified</span>
        <span>{{ courseLabel }} · {{ recordedTime }} · {{ distanceLabel }}</span>
      </div>

      <!-- Summary Details Ledger -->
      <div class="w-full bg-gray-50/70 border border-gray-100 rounded-xl p-5 text-left flex flex-col gap-4">
        <!-- Student Meta -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-xl">school</span>
            </div>
            <div>
              <div class="text-xs text-gray-500 font-medium">Student Identity</div>
              <div class="text-sm font-semibold text-gray-900">{{ studentName }}</div>
            </div>
          </div>
          <span class="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-mono">
            {{ matricNo }}
          </span>
        </div>

        <div class="w-full h-px bg-gray-200/60"></div>

        <!-- Session Unit -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs text-gray-500 font-medium">Session Unit</div>
            <div class="text-sm font-semibold text-gray-900">{{ sessionTitle }}</div>
            <div class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span class="material-symbols-outlined text-sm text-primary">bluetooth</span>
              <span>GPS Cryptographically Verified with University Audit Log</span>
            </div>
          </div>
        </div>

        <div class="w-full h-px bg-gray-200/60"></div>

        <!-- Ledger Status -->
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs text-gray-500 font-medium">Ledger Status</div>
            <div class="text-sm font-medium text-gray-900">Recorded on Registry</div>
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
            <span>Present</span>
          </div>
        </div>
      </div>

      <!-- Done Action Button -->
      <div class="w-full mt-6">
        <button
          type="button"
          class="w-full h-11 bg-primary hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          @click="$emit('done')"
        >
          <span class="material-symbols-outlined text-xl">task_alt</span>
          <span>Done</span>
        </button>
      </div>

      <!-- Security reassurance -->
      <div class="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
        <span class="material-symbols-outlined text-sm">lock</span>
        <span>Cryptographic check-in signed. Faculty registrar synced instantly.</span>
      </div>
    </div>

    <!-- ==================== STATE 2: EXPIRED ==================== -->
    <div
      v-else-if="result === 'expired'"
      class="w-full flex flex-col gap-4"
    >
      <div class="relative w-full rounded-xl bg-amber-50/70 border border-amber-200/60 p-6 flex flex-col items-center text-center overflow-hidden shadow-sm">
        <div class="relative flex items-center justify-center my-2">
          <div class="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
            <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-amber-600 text-4xl">update</span>
            </div>
          </div>
        </div>

        <h2 class="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
          QR Code Expired
        </h2>
        <p class="text-sm font-medium text-amber-800 max-w-xs leading-snug">
          The security token rotated. Please point your camera at the current QR code on the screen.
        </p>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-gray-600 text-xs font-medium mt-3 shadow-sm border border-amber-100">
          <span class="material-symbols-outlined text-sm text-amber-600">timer</span>
          <span>Tokens rotate every 2 minutes for tamper prevention</span>
        </div>
      </div>

      <!-- Card details -->
      <div class="w-full bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3 text-left">
        <div class="flex items-center justify-between text-sm py-1 border-b border-gray-50">
          <span class="text-gray-500">Course</span>
          <span class="font-semibold text-gray-900">{{ courseLabel }}</span>
        </div>
        <div class="flex items-center justify-between text-sm py-1 border-b border-gray-50">
          <span class="text-gray-500">Scan Status</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Token Stale (Unrecorded)
          </span>
        </div>
      </div>

      <button
        type="button"
        class="w-full h-11 bg-primary hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        @click="$emit('retry')"
      >
        <span class="material-symbols-outlined text-lg">qr_code_scanner</span>
        <span>Scan Current Code</span>
      </button>
    </div>

    <!-- ==================== STATE 3: OUT OF RANGE ==================== -->
    <div
      v-else-if="result === 'out_of_range'"
      class="w-full flex flex-col gap-4"
    >
      <div class="w-full rounded-xl bg-red-50/70 border border-red-200/60 p-6 flex flex-col items-center text-center shadow-sm">
        <div class="relative my-2">
          <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
            <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
              <span class="material-symbols-outlined text-3xl text-red-600">location_off</span>
            </div>
          </div>
        </div>

        <h2 class="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
          Not at Venue
        </h2>
        <p class="text-sm font-medium text-red-700 max-w-xs mb-3">
          {{ distanceMessage }}
        </p>

        <!-- Distance Callout -->
        <div class="w-full bg-white rounded-xl p-4 shadow-sm border border-red-100 flex flex-col items-center">
          <span class="text-xs font-semibold text-red-600 uppercase tracking-wider">Distance Variance</span>
          <div class="text-3xl font-bold text-red-600 my-1">
            {{ distanceLabel }}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Maximum permitted check-in radius: <strong>50 metres</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="w-full h-11 bg-primary hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        @click="$emit('retry')"
      >
        <span class="material-symbols-outlined text-lg">refresh</span>
        <span>Retry Check-In</span>
      </button>
    </div>

    <!-- ==================== STATE 4: ALREADY CHECKED IN ==================== -->
    <div
      v-else-if="result === 'already_checked_in'"
      class="w-full flex flex-col gap-4"
    >
      <div class="w-full rounded-xl bg-blue-50/70 border border-blue-200/60 p-6 flex flex-col items-center text-center shadow-sm">
        <div class="relative my-2">
          <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
              <span class="material-symbols-outlined text-3xl text-primary">how_to_reg</span>
            </div>
          </div>
        </div>

        <h2 class="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
          Already Checked In
        </h2>
        <p class="text-sm text-gray-600 max-w-xs mb-2">
          You have already verified your attendance for this class session.
        </p>
      </div>

      <button
        type="button"
        class="w-full h-11 bg-primary hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        @click="$emit('done')"
      >
        <span class="material-symbols-outlined text-lg">check</span>
        <span>View My Courses</span>
      </button>
    </div>

    <!-- ==================== FALLBACK / ERROR STATES ==================== -->
    <div
      v-else
      class="w-full flex flex-col gap-4"
    >
      <div class="w-full rounded-xl bg-red-50 border border-red-200 p-6 flex flex-col items-center text-center shadow-sm">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
          <span class="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 class="text-lg font-bold text-gray-900 mb-1">
          Verification Failed
        </h2>
        <p class="text-xs text-gray-600 max-w-xs">
          {{ fallbackErrorMessage }}
        </p>
      </div>

      <button
        type="button"
        class="w-full h-11 bg-primary hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        @click="$emit('retry')"
      >
        <span class="material-symbols-outlined text-lg">refresh</span>
        <span>Try Again</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: String,
    required: true
  },
  details: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['retry', 'done'])

const courseLabel = computed(() => {
  return props.details?.courseCode || 'CSC407'
})

const sessionTitle = computed(() => {
  return props.details?.sessionTitle || 'Active Lecture Session'
})

const studentName = computed(() => {
  return props.details?.studentName || localStorage.getItem('userName') || 'Student'
})

const matricNo = computed(() => {
  return props.details?.matricNo || localStorage.getItem('matricNo') || 'MATRIC-REF'
})

const recordedTime = computed(() => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const distanceLabel = computed(() => {
  const d = props.details?.distanceMetres
  if (d !== undefined && d !== null) {
    return `${Math.round(d)}m away`
  }
  return '23m from venue'
})

const distanceMessage = computed(() => {
  const d = props.details?.distanceMetres
  if (d) {
    return `You are detected ${Math.round(d)}m from the venue. Please move within the 50m radius.`
  }
  return 'You are outside the permitted 50m geofence perimeter. Move closer and try again.'
})

const fallbackErrorMessage = computed(() => {
  if (props.result === 'gps_denied') {
    return 'Location access was denied. Geofence verification requires GPS permission.'
  }
  if (props.result === 'camera_denied') {
    return 'Camera permission was denied. Please allow camera access in browser settings.'
  }
  if (props.result === 'network_error') {
    return 'Could not reach attendance server. Please check your internet connection.'
  }
  if (props.result === 'tampered') {
    return 'Cryptographic token signature mismatch. The scanned QR token was rejected.'
  }
  return props.details?.message || 'Check-in could not be completed. Please try again.'
})
</script>
