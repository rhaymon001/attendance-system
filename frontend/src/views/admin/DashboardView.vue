<template>
  <div class="w-full space-y-8">
    <!-- Operational Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">
          Overview of real-time university attendance &amp; active sessions
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
          @click="refreshData"
        >
          <span class="material-symbols-outlined text-lg text-gray-500">refresh</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Metric Stat Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Skeleton Loaders for Stat Cards -->
      <template v-if="isLoadingStats">
        <div
          v-for="i in 4"
          :key="`stat-skeleton-${i}`"
          class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse flex flex-col justify-between h-36"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="h-3.5 w-24 bg-gray-200 rounded"></div>
            <div class="w-8 h-8 rounded-lg bg-gray-200"></div>
          </div>
          <div>
            <div class="h-8 w-20 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </template>

      <!-- Actual Stat Cards -->
      <template v-else>
        <!-- Stat 1: Total Students -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Students
            </span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-xl">school</span>
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">
              {{ stats.totalStudents.toLocaleString() }}
            </div>
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-xs text-gray-500">Enrolled undergraduates</span>
            </div>
          </div>
        </div>

        <!-- Stat 2: Total Lecturers -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Lecturers
            </span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-xl">badge</span>
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">
              {{ stats.totalLecturers.toLocaleString() }}
            </div>
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-xs text-gray-500">Assigned academic staff</span>
            </div>
          </div>
        </div>

        <!-- Stat 3: Active Sessions -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Sessions
            </span>
            <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <span class="material-symbols-outlined text-xl">schedule</span>
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">
              {{ stats.activeSessions.toLocaleString() }}
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="relative flex h-2 w-2">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              <span class="text-xs font-medium text-green-600">Live audit underway</span>
            </div>
          </div>
        </div>

        <!-- Stat 4: Attendance Records -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Attendance Records
            </span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-xl">fact_check</span>
            </div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">
              {{ stats.attendanceRecords.toLocaleString() }}
            </div>
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-xs text-gray-500">Verified registry entries</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Recent Sessions Table Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <!-- Section Header & Filter Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          <p class="text-xs text-gray-500 mt-0.5">
            Real-time attendance logs across academic facilities
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <span
              class="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none text-lg"
            >
              search
            </span>
            <input
              v-model="searchQuery"
              class="h-10 w-full pl-9 pr-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Search course or lecturer..."
              type="text"
            />
          </div>
        </div>
      </div>

      <!-- Data Table Container -->
      <div class="w-full overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="h-10 bg-gray-50 border-b border-gray-200">
              <th class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Lecturer
              </th>
              <th class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Venue
              </th>
              <th class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Started At
              </th>
              <th class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Status
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <!-- Skeleton Rows for Recent Sessions -->
            <template v-if="isLoadingSessions">
              <tr v-for="i in 5" :key="`row-skeleton-${i}`" class="h-14 animate-pulse">
                <td class="px-4 py-3">
                  <div class="h-4 w-20 bg-gray-200 rounded mb-1.5"></div>
                  <div class="h-3 w-36 bg-gray-100 rounded"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 w-32 bg-gray-200 rounded"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 w-24 bg-gray-200 rounded"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 w-16 bg-gray-200 rounded"></div>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="h-5 w-16 bg-gray-200 rounded-full ml-auto"></div>
                </td>
              </tr>
            </template>

            <!-- Loaded Rows -->
            <template v-else-if="filteredSessions.length > 0">
              <tr
                v-for="session in filteredSessions"
                :key="session._id"
                class="h-14 hover:bg-gray-50/75 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">
                      {{ session.courseId?.code || session.courseCode || 'N/A' }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ session.courseId?.title || session.courseTitle || '' }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ session.lecturerId?.name || session.lecturerName || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ session.venueId?.name || session.venueName || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ formatStartedAt(session.startedAt) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <span
                    v-if="session.isActive"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    Active
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    Ended
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Empty State -->
        <div
          v-if="!isLoadingSessions && filteredSessions.length === 0"
          class="py-12 flex flex-col items-center justify-center text-center"
        >
          <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <span class="material-symbols-outlined text-2xl">event_busy</span>
          </div>
          <h3 class="text-sm font-semibold text-gray-900">No sessions yet</h3>
          <p class="text-xs text-gray-500 mt-1 max-w-sm">
            {{
              searchQuery
                ? 'No matching sessions found for your search term.'
                : 'No attendance sessions have been initiated or scheduled recently.'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

// State
const isLoadingStats = ref(true)
const isLoadingSessions = ref(true)
const searchQuery = ref('')

const stats = ref({
  totalStudents: 0,
  totalLecturers: 0,
  activeSessions: 0,
  attendanceRecords: 0
})

const sessions = ref([])

// Formatters
const formatStartedAt = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Fetch stats
const fetchStats = async () => {
  isLoadingStats.value = true
  try {
    const res = await api.get('/api/admin/stats')
    const data = res.data?.data || res.data || {}
    stats.value = {
      totalStudents: data.totalStudents ?? data.students ?? data.users?.students ?? 0,
      totalLecturers: data.totalLecturers ?? data.lecturers ?? data.users?.lecturers ?? 0,
      activeSessions: data.activeSessions ?? data.sessions?.active ?? 0,
      attendanceRecords: data.attendanceRecords ?? data.records ?? data.totalRecords ?? 0
    }
  } catch (err) {
    console.error('Failed to load dashboard stats:', err)
  } finally {
    isLoadingStats.value = false
  }
}

// Fetch recent sessions
const fetchSessions = async () => {
  isLoadingSessions.value = true
  try {
    const res = await api.get('/api/admin/sessions', {
      params: { limit: 5 }
    })
    const data = res.data?.data || res.data?.sessions || res.data || []
    sessions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load recent sessions:', err)
    sessions.value = []
  } finally {
    isLoadingSessions.value = false
  }
}

// Filtered sessions based on search
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return sessions.value
  const query = searchQuery.value.toLowerCase().trim()
  return sessions.value.filter((session) => {
    const courseCode = (session.courseId?.code || session.courseCode || '').toLowerCase()
    const courseTitle = (session.courseId?.title || session.courseTitle || '').toLowerCase()
    const lecturer = (session.lecturerId?.name || session.lecturerName || '').toLowerCase()
    const venue = (session.venueId?.name || session.venueName || '').toLowerCase()
    return (
      courseCode.includes(query) ||
      courseTitle.includes(query) ||
      lecturer.includes(query) ||
      venue.includes(query)
    )
  })
})

const refreshData = async () => {
  await Promise.all([fetchStats(), fetchSessions()])
}

onMounted(() => {
  refreshData()
})
</script>
