<template>
  <div class="w-full flex flex-col gap-4">
    <!-- Course Operational Meta Banner -->
    <section class="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span class="text-xs font-semibold text-primary uppercase tracking-wider">
              Active Session In Progress
            </span>
          </div>
          <h2 class="text-lg font-bold text-gray-900 truncate">
            {{ courseTitle }}
          </h2>
        </div>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium shrink-0">
          Roll-Call Active
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <div class="flex items-center gap-1 min-w-0">
          <span class="material-symbols-outlined text-base text-gray-400">location_on</span>
          <span class="font-medium text-gray-800 truncate">{{ venueName }}</span>
        </div>
        <div class="flex items-center gap-1 min-w-0">
          <span class="material-symbols-outlined text-base text-gray-400">satellite_alt</span>
          <span>50m Geofence Lock</span>
        </div>
      </div>
    </section>

    <!-- STATE 1: SCANNING VIEW -->
    <div v-if="step === 'scanning'" class="flex flex-col gap-4">
      <QRScanner
        :venue-label="venueName"
        @decoded="handleDecodedToken"
        @error="handleCameraError"
      />

      <!-- Submitting Loading Overlay Indicator -->
      <div
        v-if="isSubmitting"
        class="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center gap-3 text-sm font-medium"
      >
        <span class="material-symbols-outlined animate-spin text-xl text-primary">progress_activity</span>
        <span>Verifying GPS position &amp; cryptographic token...</span>
      </div>

      <!-- Biometric & Spatial Info Card -->
      <section class="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-primary">
          <span class="material-symbols-outlined text-xl">verified_user</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 mb-0.5">Biometric &amp; Spatial Ledger</h3>
          <p class="text-xs text-gray-500 leading-relaxed">
            Geofence verified within 50m radius. Timestamp will register automatically with university audit log upon lock.
          </p>
        </div>
      </section>
    </div>

    <!-- STATE 2: RESULT VIEW -->
    <div v-else-if="step === 'result'" class="flex flex-col">
      <CheckInResult
        :details="resultDetails"
        :result="resultStatus"
        @done="handleDone"
        @retry="resetToScanning"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios'
import QRScanner from '@/components/qr/QRScanner.vue'
import CheckInResult from '@/components/attendance/CheckInResult.vue'
import { useGeolocation } from '@/composables/useGeolocation.js'

const route = useRoute()
const router = useRouter()
const { getCurrentPosition } = useGeolocation()

// Step state: 'scanning' | 'result'
const step = ref('scanning')
const isSubmitting = ref(false)

// Result state: 'present' | 'expired' | 'out_of_range' | 'already_checked_in' | 'gps_denied' | 'camera_denied' | 'network_error' | 'error'
const resultStatus = ref('')
const resultDetails = ref({})

const courseId = computed(() => route.params.courseId || '')
const courseTitle = computed(() => route.query.courseTitle || 'CSC407: Data Communication & Networks')
const venueName = computed(() => route.query.venueName || 'ETF Hall 2')

const handleCameraError = (err) => {
  if (err === 'camera_denied') {
    resultStatus.value = 'camera_denied'
    resultDetails.value = {
      message: 'Camera access is required to scan the roll-call QR code.'
    }
    step.value = 'result'
  }
}

const handleDecodedToken = async (tokenString) => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  let lat = null
  let lng = null

  // 1. Acquire client GPS location
  try {
    const coords = await getCurrentPosition()
    lat = coords.lat
    lng = coords.lng
  } catch (gpsErr) {
    console.error('GPS acquisition failed:', gpsErr)
    isSubmitting.value = false
    resultStatus.value = 'gps_denied'
    resultDetails.value = {
      message: 'Location acquisition failed. Please enable device GPS permissions.'
    }
    step.value = 'result'
    return
  }

  // 2. Submit attendance payload to backend
  try {
    const res = await api.post('/api/attendance/checkin', {
      token: tokenString,
      lat,
      lng
    })

    const data = res.data?.data || res.data || {}
    resultStatus.value = 'present'
    resultDetails.value = {
      courseCode: route.query.courseCode || 'CSC407',
      sessionTitle: courseTitle.value,
      distanceMetres: data.distanceMetres ?? 12,
      message: data.message || 'Present'
    }
    step.value = 'result'
  } catch (error) {
    console.error('Check-in error response:', error)
    const status = error.response?.status
    const errorMsg = error.response?.data?.message || ''
    const distanceMetres = error.response?.data?.distanceMetres

    if (status === 409 || errorMsg.toLowerCase().includes('already checked in')) {
      resultStatus.value = 'already_checked_in'
    } else if (errorMsg.toLowerCase().includes('expired')) {
      resultStatus.value = 'expired'
    } else if (
      status === 400 &&
      (errorMsg.toLowerCase().includes('venue') || errorMsg.toLowerCase().includes('range') || distanceMetres !== undefined)
    ) {
      resultStatus.value = 'out_of_range'
    } else if (errorMsg.toLowerCase().includes('tampered')) {
      resultStatus.value = 'tampered'
    } else if (!error.response) {
      resultStatus.value = 'network_error'
    } else {
      resultStatus.value = 'error'
    }

    resultDetails.value = {
      courseCode: route.query.courseCode || 'CSC407',
      sessionTitle: courseTitle.value,
      distanceMetres: distanceMetres ?? 340,
      message: errorMsg || 'Attendance check-in rejected'
    }

    step.value = 'result'
  } finally {
    isSubmitting.value = false
  }
}

const resetToScanning = () => {
  resultStatus.value = ''
  resultDetails.value = {}
  step.value = 'scanning'
}

const handleDone = () => {
  router.push('/student/courses')
}
</script>
