<template>
  <div class="w-full space-y-4 pb-6">
    <!-- Semester & Academic Context Bar -->
    <div class="flex items-center justify-between gap-3 pt-1">
      <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 text-gray-800 text-xs font-medium shadow-sm">
        <span class="material-symbols-outlined text-base text-primary">calendar_month</span>
        <span>Harmattan 2024/2025</span>
      </div>
      <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
        <span class="material-symbols-outlined text-sm">school</span>
        <span>My Attendance</span>
      </div>
    </div>

    <!-- Student Overall Cumulative Ledger Overview Card -->
    <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Cumulative Standing
          </p>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-3xl font-bold text-gray-900">{{ cumulativeAverage }}%</span>
            <span class="text-xs font-medium text-gray-500">Average</span>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
            <span class="material-symbols-outlined text-sm text-primary">rule</span>
            <span>75% Required</span>
          </div>
          <span class="text-[11px] text-gray-400 mt-1">Exam Clearance Threshold</span>
        </div>
      </div>

      <!-- Aggregate Progress Bar with 75% Clearance Marker -->
      <div class="mt-4">
        <div class="relative w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progressBarColor(cumulativeAverage)"
            :style="{ width: `${Math.min(cumulativeAverage, 100)}%` }"
          ></div>
          <!-- Target Marker at 75% -->
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-gray-900"
            style="left: 75%;"
            title="75% Clearance Line"
          ></div>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{{ totalAttendedHours }} / {{ totalSessionHours }} Sessions Attended</span>
          <span
            class="font-semibold"
            :class="cumulativeAverage >= 75 ? 'text-green-600' : 'text-amber-600'"
          >
            {{ cumulativeAverage >= 75 ? 'Overall Eligible' : 'At Risk Status' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Section Header -->
    <div class="flex items-center justify-between px-1 pt-1">
      <h2 class="text-base font-semibold text-gray-900">
        Enrolled Courses ({{ courses.length }})
      </h2>
      <span class="text-xs text-gray-400">Tap card to review logs</span>
    </div>

    <!-- Skeleton Loaders while fetching -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="`skel-course-${i}`"
        class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-3"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-2 w-3/5">
            <div class="h-4 bg-gray-200 rounded w-24"></div>
            <div class="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div class="h-6 w-20 bg-gray-100 rounded-full"></div>
        </div>
        <div class="h-2.5 bg-gray-100 rounded-full w-full"></div>
      </div>
    </div>

    <!-- Enrolled Courses Stack (Cards) -->
    <div v-else-if="courses.length > 0" class="space-y-3">
      <div
        v-for="course in courses"
        :key="course._id"
        class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md"
      >
        <!-- Card Main Content -->
        <div class="p-4 sm:p-5">
          <!-- Course Title and Status Badge -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-primary uppercase tracking-wider">
                  {{ course.code }}
                </span>
                <!-- "At Risk" amber badge if below 75% -->
                <span
                  v-if="course.percentage < 75"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium"
                >
                  <span class="material-symbols-outlined text-xs text-amber-700">warning</span>
                  <span>At Risk</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium"
                >
                  <span class="material-symbols-outlined text-xs text-green-700">verified</span>
                  <span>Eligible</span>
                </span>
              </div>

              <h3 class="text-sm font-semibold text-gray-900 mt-1 truncate">
                {{ course.title }}
              </h3>
              <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm text-gray-400">person</span>
                <span>{{ course.lecturerName || 'Faculty Lecturer' }}</span>
              </p>
            </div>

            <!-- Expand/Collapse Chevron Button -->
            <button
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              :aria-expanded="isExpanded(course._id)"
              @click="toggleExpand(course._id)"
            >
              <span
                class="material-symbols-outlined text-xl transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded(course._id) }"
              >
                expand_more
              </span>
            </button>
          </div>

          <!-- Attendance Metrics & Progress Bar -->
          <div class="mt-4">
            <div class="flex items-center justify-between text-xs font-medium">
              <span class="text-gray-700">
                {{ course.attended }} of {{ course.totalSessions }} sessions attended
              </span>
              <span :class="percentageTextColor(course.percentage)" class="font-bold">
                {{ course.percentage }}%
              </span>
            </div>

            <!-- Horizontal Progress Bar -->
            <div class="w-full h-2.5 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progressBarColor(course.percentage)"
                :style="{ width: `${Math.min(course.percentage, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Warning helper note if at risk -->
          <div
            v-if="course.percentage < 75"
            class="mt-3.5 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/50"
          >
            <span class="material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">error_outline</span>
            <p class="text-xs leading-snug">
              Short of 75% clearance. Attend upcoming sessions to secure exam admittance.
            </p>
          </div>
        </div>

        <!-- Expanded Sessions Audit Drawer -->
        <div
          v-if="isExpanded(course._id)"
          class="bg-gray-50/80 border-t border-gray-100 px-4 sm:px-5 py-3 space-y-2"
        >
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Session History Log
          </div>

          <div
            v-if="course.history && course.history.length > 0"
            class="divide-y divide-gray-100"
          >
            <div
              v-for="(session, idx) in course.history"
              :key="idx"
              class="flex items-center justify-between py-2 text-xs"
            >
              <div class="flex items-center gap-2">
                <span
                  class="material-symbols-outlined text-base"
                  :class="session.status === 'present' ? 'text-green-600' : 'text-red-500'"
                >
                  {{ session.status === 'present' ? 'check_circle' : 'cancel' }}
                </span>
                <span class="text-gray-800 font-medium">{{ formatDate(session.date) }}</span>
              </div>
              <span
                class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                :class="
                  session.status === 'present'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                "
              >
                {{ session.status === 'present' ? 'Verified Present' : 'Absent' }}
              </span>
            </div>
          </div>

          <div v-else class="py-2 text-xs text-gray-500 italic">
            No session records found for this course yet.
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="py-16 px-4 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center"
    >
      <div class="w-16 h-16 rounded-full bg-blue-50 text-primary flex items-center justify-center mb-3">
        <span class="material-symbols-outlined text-3xl">history_edu</span>
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-1">No attendance records yet</h3>
      <p class="text-xs text-gray-500 max-w-sm mb-4">
        You have not checked in to any class sessions yet. Attend lectures and scan the live QR code to build your attendance ledger.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

// State
const isLoading = ref(true)
const courses = ref([])
const expandedCourseIds = ref(new Set())

// Expand / Collapse State
const isExpanded = (courseId) => expandedCourseIds.value.has(courseId)

const toggleExpand = (courseId) => {
  if (expandedCourseIds.value.has(courseId)) {
    expandedCourseIds.value.delete(courseId)
  } else {
    expandedCourseIds.value.add(courseId)
  }
}

// Progress Bar & Percentage Color Rules
const progressBarColor = (percentage) => {
  if (percentage >= 75) return 'bg-[#16A34A]' // green
  if (percentage >= 50) return 'bg-[#D97706]' // amber
  return 'bg-[#DC2626]' // red
}

const percentageTextColor = (percentage) => {
  if (percentage >= 75) return 'text-[#16A34A]'
  if (percentage >= 50) return 'text-[#D97706]'
  return 'text-[#DC2626]'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Recent Lecture'
  const d = new Date(dateStr)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Aggregates
const totalAttendedHours = computed(() => {
  return courses.value.reduce((acc, c) => acc + (c.attended || 0), 0)
})

const totalSessionHours = computed(() => {
  return courses.value.reduce((acc, c) => acc + (c.totalSessions || 0), 0)
})

const cumulativeAverage = computed(() => {
  if (courses.value.length === 0) return 0
  const sum = courses.value.reduce((acc, c) => acc + (c.percentage || 0), 0)
  return Math.round(sum / courses.value.length)
})

// Fetch Courses and their Attendance Reports
const fetchAttendanceReports = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/api/student/courses')
    const data = res.data?.data || res.data?.courses || res.data || []
    courses.value = Array.isArray(data)
      ? data.map((course) => ({
          ...course,
          lecturerName: course.lecturerId?.name || '',
          history: Array.isArray(course.history) ? course.history : []
        }))
      : []
  } catch (err) {
    console.error('Failed to load attendance report:', err)
    courses.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAttendanceReports()
})
</script>
