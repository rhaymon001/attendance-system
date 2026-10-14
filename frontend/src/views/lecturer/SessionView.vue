<template>
  <div class="w-full space-y-6">
    <!-- Page Top Bar & Context Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1.5 text-xs text-gray-500">
          <span class="hover:text-primary transition-colors cursor-pointer">Lecturer Portal</span>
          <span class="material-symbols-outlined text-sm">chevron_right</span>
          <span class="hover:text-primary transition-colors cursor-pointer">Live Sessions</span>
          <span class="material-symbols-outlined text-sm">chevron_right</span>
          <span class="font-medium text-primary flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
            Active Broadcast
          </span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
          {{ courseTitle }}
        </h1>
        <p class="text-sm text-gray-500 flex flex-wrap items-center gap-2">
          <span>Active Lecture Session</span>
          <span class="w-1 h-1 rounded-full bg-gray-300"></span>
          <span class="font-medium text-gray-800">Venue: {{ venueName }}</span>
          <span class="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>Started {{ startedTime }}</span>
        </p>
      </div>

      <!-- Top Action Controls -->
      <div class="flex items-center gap-3 self-start md:self-auto">
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          @click="showEndModal = true"
        >
          <span class="material-symbols-outlined text-lg">stop_circle</span>
          <span>End Session</span>
        </button>
      </div>
    </div>

    <!-- 2-Column Responsive Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- LEFT COLUMN: Dynamic QR Broadcast & Security Engine (5 Cols) -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <!-- Card Header -->
          <div class="flex items-start justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                {{ session?.courseId?.code || session?.courseCode || 'Course Session' }}
              </h2>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ session?.courseId?.title || session?.courseTitle || 'Dynamic Roll-Call Broadcast' }}
              </p>
            </div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping"></span>
              {{ venueRadius }}m Geofence Active
            </span>
          </div>

          <!-- QR Display Canvas Container -->
          <div class="py-6 flex flex-col items-center justify-center">
            <div class="p-3 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center relative min-w-[270px] min-h-[270px]">
              <!-- Canvas managed by useQRGenerator -->
              <canvas ref="canvasRef" class="w-64 h-64 rounded-lg"></canvas>

              <div
                v-if="!qrToken"
                class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl"
              >
                <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">progress_activity</span>
                <span class="text-xs text-gray-500 font-medium">Generating cryptographic token...</span>
              </div>
            </div>

            <!-- Countdown Timer Section -->
            <div class="mt-5 flex flex-col items-center">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full animate-pulse transition-colors"
                  :class="timerDotColorClass"
                ></span>
                <span
                  class="font-mono text-[32px] leading-none font-bold tracking-wider transition-colors"
                  :class="timerColorClass"
                >
                  {{ formattedTime }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                <span>Rotating dynamic cryptographic token in</span>
                <span class="font-semibold text-gray-800 font-mono">{{ timeLeft }}s</span>
              </p>
            </div>

            <!-- Manual Refresh Button -->
            <div class="mt-4 w-full flex justify-center">
              <button
                type="button"
                class="h-9 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                :disabled="isRefreshingQR"
                @click="refreshQR"
              >
                <span
                  class="material-symbols-outlined text-base text-gray-500 transition-transform"
                  :class="{ 'animate-spin': isRefreshingQR }"
                >
                  sync
                </span>
                <span>Refresh QR Code</span>
              </button>
            </div>
          </div>

          <!-- Security Status Telemetry List -->
          <div class="pt-4 border-t border-gray-100 flex flex-col gap-2.5 text-xs">
            <div class="flex items-center justify-between py-0.5">
              <span class="flex items-center gap-2 text-gray-500">
                <span class="material-symbols-outlined text-base text-primary">enhanced_encryption</span>
                Dynamic Token Hash
              </span>
              <span class="font-mono font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                HMAC-SHA256 (2m TTL)
              </span>
            </div>
            <div class="flex items-center justify-between py-0.5">
              <span class="flex items-center gap-2 text-gray-500">
                <span class="material-symbols-outlined text-base text-green-600">satellite_alt</span>
                Geofence Verification
              </span>
              <span class="font-medium text-green-700 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Haversine Strict Radius
              </span>
            </div>
            <div class="flex items-center justify-between py-0.5">
              <span class="flex items-center gap-2 text-gray-500">
                <span class="material-symbols-outlined text-base text-primary">security</span>
                Anti-Spoof Protocol
              </span>
              <span class="font-medium text-gray-800 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm text-green-600">verified_user</span>
                Active (Single Session Lock)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Real-Time Attendance Ledger (7 Cols) -->
      <div class="lg:col-span-7 flex flex-col gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col min-h-[600px]">
          <!-- Live Ledger Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-semibold text-gray-900">
                Live Attendance
              </h2>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <span class="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                <span>{{ attendees.length }} students present</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <span class="material-symbols-outlined text-base text-primary">sync</span>
              <span>Live WebSocket Feed</span>
            </div>
          </div>

          <!-- Quick Search Control -->
          <div class="my-4 relative">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg pointer-events-none">search</span>
            <input
              v-model="searchQuery"
              class="w-full h-10 pl-9 pr-4 rounded-lg text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="Search by student name or matric number..."
              type="text"
            />
          </div>

          <!-- Student Roster Roll-Call Register -->
          <div class="rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <!-- Table Header -->
            <div class="grid grid-cols-12 bg-gray-50 h-10 items-center px-4 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200">
              <div class="col-span-6 sm:col-span-5">Student &amp; Matric</div>
              <div class="col-span-3 sm:col-span-3">Check-In Time</div>
              <div class="col-span-3 sm:col-span-2 text-center">Distance</div>
              <div class="hidden sm:block sm:col-span-2 text-right">Status</div>
            </div>

            <!-- Table Body List -->
            <div
              v-if="filteredAttendees.length > 0"
              class="overflow-y-auto max-h-[460px] divide-y divide-gray-100 flex-1"
            >
              <div
                v-for="record in filteredAttendees"
                :key="record._id || record.studentId"
                class="grid grid-cols-12 items-center px-4 py-3 min-h-[52px] hover:bg-gray-50 transition-colors"
              >
                <!-- Student & Matric -->
                <div class="col-span-6 sm:col-span-5 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-50 text-primary font-semibold flex items-center justify-center text-xs shrink-0">
                    {{ getInitials(record.studentName || record.studentId?.name || record.name) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-semibold text-gray-900 truncate">
                      {{ record.studentName || record.studentId?.name || record.name || 'Student' }}
                    </span>
                    <span class="font-mono text-xs text-gray-500">
                      {{ record.matricNo || record.studentId?.matricNo || '—' }}
                    </span>
                  </div>
                </div>

                <!-- Check-in Time -->
                <div class="col-span-3 sm:col-span-3 font-mono text-xs text-gray-500">
                  {{ formatTime(record.checkedInAt) }}
                </div>

                <!-- Distance Badge -->
                <div class="col-span-3 sm:col-span-2 flex justify-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {{ formatDistance(record.distanceMetres) }}
                  </span>
                </div>

                <!-- Status Verified -->
                <div class="hidden sm:flex sm:col-span-2 justify-end items-center gap-1 text-green-700">
                  <span class="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                  <span class="text-xs font-medium">Verified</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="py-16 px-4 flex flex-col items-center justify-center text-center flex-1"
            >
              <div class="w-14 h-14 rounded-full bg-blue-50 text-primary flex items-center justify-center mb-3">
                <span class="material-symbols-outlined text-3xl animate-pulse">qr_code_scanner</span>
              </div>
              <h3 class="text-base font-semibold text-gray-900 mb-1">Waiting for students...</h3>
              <p class="text-xs text-gray-500 max-w-sm">
                Students in ETF Hall 2 will appear here in real time as they scan the dynamic QR code on their devices.
              </p>
            </div>
          </div>

          <!-- Ledger Footer Information -->
          <div class="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 border-t border-gray-100">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              Real-time WebSockets Connected
            </span>
            <span class="mt-1 sm:mt-0">
              Session ID: <code class="font-mono text-gray-800">{{ session?._id || 'Initializing...' }}</code>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- End Session Confirmation Modal -->
    <AppModal
      v-model="showEndModal"
      title="Terminate Broadcast?"
    >
      <template #icon>
        <span class="material-symbols-outlined text-red-600 text-2xl">warning</span>
      </template>

      <div class="space-y-3">
        <p class="text-sm text-gray-600 leading-relaxed">
          Ending this session will immediately invalidate the dynamic cryptographic QR token and conclude official roll-call logging for
          <strong>{{ courseTitle }}</strong>.
        </p>
        <p class="text-xs text-gray-500">
          A total of <strong>{{ attendees.length }}</strong> attendance records have been registered for this session.
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          :disabled="isEndingSession"
          @click="showEndModal = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
          :disabled="isEndingSession"
          @click="endSession"
        >
          <span v-if="isEndingSession" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg">stop_circle</span>
          <span>{{ isEndingSession ? 'Concluding...' : 'Confirm & End Session' }}</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios'
import { useSocket } from '@/composables/useSocket.js'
import { useQRGenerator } from '@/composables/useQRGenerator.js'
import AppModal from '@/components/ui/AppModal.vue'

// Routing
const route = useRoute()
const router = useRouter()

// Composables
const { canvasRef, renderQR } = useQRGenerator()
const { join, onAttendanceNew } = useSocket()

// State
const session = ref(null)
const qrToken = ref('')
const attendees = ref([])
const searchQuery = ref('')
const timeLeft = ref(120)
const isRefreshingQR = ref(false)
const isEndingSession = ref(false)
const showEndModal = ref(false)
let timerInterval = null

// Computed properties
const courseId = computed(() => route.params.courseId || route.params.id)

const courseTitle = computed(() => {
  if (!session.value) return 'Course Session Broadcast'
  const code = session.value.courseId?.code || session.value.courseCode || ''
  const title = session.value.courseId?.title || session.value.courseTitle || ''
  return code ? `${code}: ${title}` : title || 'Active Course Session'
})

const venueName = computed(() => {
  return session.value?.venueId?.name || session.value?.venueName || 'Main Lecture Hall'
})

const venueRadius = computed(() => {
  return session.value?.venueId?.radiusMetres || 50
})

const startedTime = computed(() => {
  if (!session.value?.startedAt) return 'Just now'
  return new Date(session.value.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const formattedTime = computed(() => {
  const mins = Math.floor(timeLeft.value / 60)
  const secs = timeLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const timerColorClass = computed(() => {
  if (timeLeft.value > 60) return 'text-green-600'
  if (timeLeft.value >= 30) return 'text-amber-500'
  return 'text-red-600'
})

const timerDotColorClass = computed(() => {
  if (timeLeft.value > 60) return 'bg-green-600'
  if (timeLeft.value >= 30) return 'bg-amber-500'
  return 'bg-red-600'
})

const filteredAttendees = computed(() => {
  if (!searchQuery.value.trim()) return attendees.value
  const query = searchQuery.value.toLowerCase().trim()
  return attendees.value.filter((item) => {
    const name = (item.studentName || item.studentId?.name || item.name || '').toLowerCase()
    const matric = (item.matricNo || item.studentId?.matricNo || '').toLowerCase()
    return name.includes(query) || matric.includes(query)
  })
})

// Helpers
const formatTime = (timeStr) => {
  if (!timeStr) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatDistance = (dist) => {
  if (dist === undefined || dist === null) return '0m'
  return `${Math.round(dist)}m`
}

const getInitials = (name) => {
  if (!name) return 'ST'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Timer & QR Rotation
const startTimer = () => {
  clearInterval(timerInterval)
  timeLeft.value = 120
  timerInterval = setInterval(async () => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      await refreshQR()
    }
  }, 1000)
}

const refreshQR = async () => {
  if (!session.value?._id) return
  isRefreshingQR.value = true
  try {
    const res = await api.get(`/api/sessions/${session.value._id}/qr`)
    const token = res.data?.token || res.data?.data?.token || res.data
    if (token) {
      qrToken.value = token
      await renderQR(token)
    }
    timeLeft.value = 120
  } catch (err) {
    console.error('Failed to rotate QR token:', err)
  } finally {
    isRefreshingQR.value = false
  }
}

// Init Session
const initSession = async () => {
  try {
    const venuesResponse = await api.get('/api/lecturer/venues')
    const venuesData = venuesResponse.data?.data || venuesResponse.data?.venues || venuesResponse.data || []
    const venues = Array.isArray(venuesData) ? venuesData : []
    const requestedVenueId = route.query.venueId
    const selectedVenue = venues.find((venue) => venue._id === requestedVenueId) || venues[0]

    if (!selectedVenue) {
      throw new Error('No venue is configured. Ask an administrator to add a venue before starting a session.')
    }

    const res = await api.post('/api/sessions', {
      courseId: courseId.value,
      venueId: selectedVenue._id
    })
    const data = res.data?.data || res.data || {}
    session.value = data.session || data
    qrToken.value = data.token || data.qrToken || session.value.token || ''

    if (session.value?._id) {
      // Join WebSocket room
      join(session.value._id)

      // Fetch any existing attendance records for this session
      try {
        const attRes = await api.get(`/api/sessions/${session.value._id}/attendance`)
        const attData = attRes.data?.data || attRes.data?.attendance || attRes.data || []
        attendees.value = Array.isArray(attData) ? attData : []
      } catch (attErr) {
        console.warn('Attendance records could not be pre-loaded:', attErr)
      }
    }

    if (qrToken.value) {
      await renderQR(qrToken.value)
    }

    startTimer()
  } catch (err) {
    console.error('Failed to initialize session:', err)
  }
}

// End Session
const endSession = async () => {
  if (!session.value?._id) return
  isEndingSession.value = true
  try {
    await api.patch(`/api/sessions/${session.value._id}/end`)
    clearInterval(timerInterval)
    showEndModal.value = false
    router.push('/lecturer/dashboard')
  } catch (err) {
    console.error('Failed to end session:', err)
  } finally {
    isEndingSession.value = false
  }
}

onMounted(() => {
  initSession()

  // Real-time listener for incoming student check-ins
  onAttendanceNew((record) => {
    if (record) {
      const id = record.studentId?._id || record.studentId
      const exists = attendees.value.some((a) => (a.studentId?._id || a.studentId) === id)
      if (!exists) {
        attendees.value.unshift(record)
      }
    }
  })
})

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>
