<template>
  <div class="w-full space-y-6">
    <!-- Top Bar -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">
          {{ reportTitle }}
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Attendance performance report and exam eligibility breakdown
        </p>
      </div>

      <div class="flex items-center gap-3 self-start lg:self-auto">
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
          :disabled="isExportingCsv || rows.length === 0"
          @click="exportFile('csv')"
        >
          <span v-if="isExportingCsv" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg text-gray-500">download</span>
          <span>{{ isExportingCsv ? 'Exporting...' : 'Export CSV' }}</span>
        </button>

        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
          :disabled="isExportingPdf || rows.length === 0"
          @click="exportFile('pdf')"
        >
          <span v-if="isExportingPdf" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg">picture_as_pdf</span>
          <span>{{ isExportingPdf ? 'Exporting...' : 'Export PDF' }}</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-xl">menu_book</span>
          </div>
        </div>
        <div v-if="isLoading" class="h-7 w-28 bg-gray-200 rounded animate-pulse"></div>
        <div v-else>
          <div class="text-lg font-bold text-gray-900">{{ reportCode }}</div>
          <div class="text-xs text-gray-500 mt-1 truncate">{{ reportTitle }}</div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sessions</span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-xl">event_note</span>
          </div>
        </div>
        <div v-if="isLoading" class="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div v-else class="text-2xl font-bold text-gray-900">{{ totalSessions }}</div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class Average</span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-xl">analytics</span>
          </div>
        </div>
        <div v-if="isLoading" class="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div v-else class="text-2xl font-bold" :class="percentageColor(classAverage)">
          {{ classAverage }}%
        </div>
      </div>
    </div>

    <!-- Report Table Card -->
    <div class="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div v-if="isLoading" class="p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-100 rounded w-full"></div>
          <div v-for="i in 6" :key="`skel-${i}`" class="h-12 bg-gray-50 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="rows.length > 0" class="w-full overflow-x-auto">
        <AppTable>
          <template #header>
            <th class="px-4 py-3">Matric No</th>
            <th class="px-4 py-3">Student Name</th>
            <th class="px-4 py-3">Attended</th>
            <th class="px-4 py-3">Total Sessions</th>
            <th class="px-4 py-3">Percentage</th>
            <th class="px-4 py-3 text-right">Status</th>
          </template>

          <tr
            v-for="row in rows"
            :key="row.matricNo || row._id"
            class="h-13 hover:bg-gray-50/75 transition-colors"
          >
            <td class="px-4 py-3 font-mono text-sm text-gray-900">{{ row.matricNo || '—' }}</td>
            <td class="px-4 py-3 font-medium text-sm text-gray-900">{{ row.name }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ row.attended }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ row.totalSessions }}</td>
            <td class="px-4 py-3 text-sm font-bold" :class="percentageColor(row.percentage)">
              {{ row.percentage }}%
            </td>
            <td class="px-4 py-3 text-right">
              <AppBadge :variant="row.percentage >= 75 ? 'success' : 'warning'">
                {{ row.percentage >= 75 ? 'Good Standing' : 'At Risk' }}
              </AppBadge>
            </td>
          </tr>
        </AppTable>
      </div>

      <div v-else class="py-16 px-4 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <span class="material-symbols-outlined text-4xl">insert_chart</span>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">No attendance data yet</h3>
        <p class="text-sm text-gray-500 max-w-sm">
          Data will appear once sessions have been run.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const route = useRoute()

const report = ref({})
const rows = ref([])
const isLoading = ref(true)
const isExportingCsv = ref(false)
const isExportingPdf = ref(false)

const courseId = computed(() => route.params.courseId)

const reportCode = computed(() => {
  return report.value.code || report.value.course?.code || route.query.courseCode || courseId.value
})

const reportTitle = computed(() => {
  return report.value.title || report.value.course?.title || route.query.courseTitle || 'Course Report'
})

const totalSessions = computed(() => {
  if (report.value.totalSessions !== undefined) return report.value.totalSessions
  return rows.value.reduce((max, row) => Math.max(max, row.totalSessions || 0), 0)
})

const classAverage = computed(() => {
  if (report.value.average !== undefined && report.value.average !== null) {
    return Math.round(report.value.average)
  }
  if (rows.value.length === 0) return 0
  const sum = rows.value.reduce((acc, row) => acc + (row.percentage || 0), 0)
  return Math.round(sum / rows.value.length)
})

const percentageColor = (percentage) => {
  if (percentage >= 75) return 'text-present'
  if (percentage >= 50) return 'text-warning'
  return 'text-rejected'
}

const normalizeRow = (item) => {
  const student = item.student || item.studentId || {}
  const attended = item.attended ?? item.attendedCount ?? 0
  const total = item.totalSessions ?? item.total ?? 0
  const percentage =
    item.percentage !== undefined && item.percentage !== null
      ? Math.round(item.percentage)
      : total > 0
        ? Math.round((attended / total) * 100)
        : 0

  return {
    _id: student._id || item._id || student.matricNo || item.matricNo,
    matricNo: student.matricNo || item.matricNo || '',
    name: student.name || item.name || 'Student',
    attended,
    totalSessions: total,
    percentage
  }
}

const fetchReport = async () => {
  isLoading.value = true
  try {
    const res = await api.get(`/api/reports/${courseId.value}`)
    const data = res.data?.data || res.data || {}
    report.value = data
    const list = data.students || data.records || data.rows || (Array.isArray(data) ? data : [])
    rows.value = (Array.isArray(list) ? list : []).map(normalizeRow)
  } catch (err) {
    console.error('Failed to fetch course report:', err)
    report.value = {}
    rows.value = []
  } finally {
    isLoading.value = false
  }
}

const filenameFromHeaders = (headers, fallback) => {
  const disposition = headers?.['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  return match ? match[1] : fallback
}

const exportFile = async (type) => {
  const isCsv = type === 'csv'
  const loadingRef = isCsv ? isExportingCsv : isExportingPdf
  loadingRef.value = true
  try {
    const res = await api.get(`/api/reports/${courseId.value}/export/${type}`, {
      responseType: 'blob'
    })
    const blob = new Blob([res.data])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filenameFromHeaders(res.headers, `${courseId.value}-report.${type}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error(`Failed to export ${type.toUpperCase()}:`, err)
  } finally {
    loadingRef.value = false
  }
}

onMounted(() => {
  fetchReport()
})
</script>
