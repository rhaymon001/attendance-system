<template>
  <div class="w-full space-y-6">
    <!-- Top Bar -->
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">
        {{ courseLabel }} · Session History
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Review past lecture sessions and their attendance logs
      </p>
    </div>

    <!-- Sessions List Card -->
    <div class="rounded-xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      <div v-if="isLoading" class="space-y-3">
        <div
          v-for="i in 4"
          :key="`skel-${i}`"
          class="h-24 rounded-xl bg-gray-50 border border-gray-100 animate-pulse"
        ></div>
      </div>

      <div v-else-if="sessions.length > 0" class="space-y-3">
        <div
          v-for="session in sessions"
          :key="session._id"
          class="rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm"
        >
          <!-- Session Summary -->
          <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-xl">event</span>
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-gray-900">
                    {{ formatDate(session.startedAt) }}
                  </span>
                  <AppBadge variant="success">
                    {{ presentCount(session) }} students present
                  </AppBadge>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">play_circle</span>
                    Start: {{ formatTime(session.startedAt) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">stop_circle</span>
                    End: {{ formatTime(session.endedAt) }}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="h-9 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              @click="toggleDetails(session)"
            >
              <span class="material-symbols-outlined text-base">
                {{ isExpanded(session._id) ? 'expand_less' : 'visibility' }}
              </span>
              <span>{{ isExpanded(session._id) ? 'Hide Details' : 'View Details' }}</span>
            </button>
          </div>

          <!-- Expanded Attendance Details -->
          <div
            v-if="isExpanded(session._id)"
            class="border-t border-gray-100 bg-gray-50/70 p-4"
          >
            <div v-if="detailsLoading[session._id]" class="py-6">
              <AppSpinner size="sm" label="Loading attendance records..." />
            </div>

            <div
              v-else-if="(sessionDetails[session._id] || []).length > 0"
              class="overflow-x-auto"
            >
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="h-9 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th class="px-3 py-2">Student Name</th>
                    <th class="px-3 py-2">Matric No</th>
                    <th class="px-3 py-2">Check-in Time</th>
                    <th class="px-3 py-2 text-right">Distance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="record in sessionDetails[session._id]"
                    :key="record._id || record.studentId?._id"
                    class="text-sm hover:bg-white/70"
                  >
                    <td class="px-3 py-2.5 font-medium text-gray-900">
                      {{ record.studentName || record.studentId?.name || 'Student' }}
                    </td>
                    <td class="px-3 py-2.5 font-mono text-xs text-gray-600">
                      {{ record.matricNo || record.studentId?.matricNo || '—' }}
                    </td>
                    <td class="px-3 py-2.5 font-mono text-xs text-gray-500">
                      {{ formatTime(record.checkedInAt) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <AppBadge variant="success">{{ formatDistance(record.distanceMetres) }}</AppBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="py-6 text-center text-xs text-gray-500 italic">
              No attendance records were captured for this session.
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-16 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <span class="material-symbols-outlined text-4xl">event_busy</span>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">No past sessions</h3>
        <p class="text-sm text-gray-500 max-w-sm">
          Sessions will appear here after they end.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()

const sessions = ref([])
const isLoading = ref(true)
const expandedId = ref(null)
const sessionDetails = ref({})
const detailsLoading = ref({})

const courseId = computed(() => route.params.courseId)

const courseLabel = computed(() => {
  if (route.query.courseCode) return route.query.courseCode
  const first = sessions.value[0]
  return first?.courseId?.code || first?.courseCode || 'Course'
})

const presentCount = (session) => {
  return (
    session.attendanceCount ??
    session.presentCount ??
    session.attendeesCount ??
    session.recordsCount ??
    session.attendance?.length ??
    0
  )
}

const isExpanded = (sessionId) => expandedId.value === sessionId

const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown date'
  return new Date(dateStr).toLocaleDateString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDistance = (dist) => {
  if (dist === undefined || dist === null) return '0m'
  return `${Math.round(dist)}m`
}

const fetchSessions = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/api/sessions', {
      params: { courseId: courseId.value, active: false }
    })
    const data = res.data?.data || res.data?.sessions || res.data || []
    sessions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch session history:', err)
    sessions.value = []
  } finally {
    isLoading.value = false
  }
}

const fetchDetails = async (sessionId) => {
  detailsLoading.value = { ...detailsLoading.value, [sessionId]: true }
  try {
    const res = await api.get(`/api/sessions/${sessionId}/attendance`)
    const data = res.data?.data || res.data?.attendance || res.data || []
    sessionDetails.value = {
      ...sessionDetails.value,
      [sessionId]: Array.isArray(data) ? data : []
    }
  } catch (err) {
    console.error('Failed to fetch session attendance:', err)
    sessionDetails.value = { ...sessionDetails.value, [sessionId]: [] }
  } finally {
    detailsLoading.value = { ...detailsLoading.value, [sessionId]: false }
  }
}

const toggleDetails = (session) => {
  if (expandedId.value === session._id) {
    expandedId.value = null
    return
  }
  expandedId.value = session._id
  if (!sessionDetails.value[session._id]) {
    fetchDetails(session._id)
  }
}

onMounted(() => {
  fetchSessions()
})
</script>
