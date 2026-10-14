<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Lecturer Dashboard</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage teaching sessions and live attendance broadcasts</p>
      </div>
    </div>

    <!-- Courses Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-44 bg-white rounded-xl border border-gray-100 p-5 animate-pulse"></div>
    </div>

    <div v-else-if="courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="course in courses"
        :key="course._id"
        class="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
      >
        <div>
          <span class="text-xs font-bold text-primary uppercase tracking-wider">{{ course.code }}</span>
          <h3 class="text-base font-semibold text-gray-900 mt-1">{{ course.title }}</h3>
          <p class="text-xs text-gray-500 mt-1">Students Enrolled: {{ course.enrolledStudents?.length || 0 }}</p>
        </div>

        <div class="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 mt-4">
          <RouterLink
            :to="{ name: 'lecturer-session', params: { courseId: course._id }, query: { courseCode: course.code, courseTitle: course.title } }"
            class="h-9 px-4 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-base">play_circle</span>
            <span>Start Session</span>
          </RouterLink>

          <RouterLink
            :to="{ name: 'lecturer-history', params: { courseId: course._id }, query: { courseCode: course.code } }"
            class="h-9 px-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-base text-gray-500">history</span>
            <span>History</span>
          </RouterLink>

          <RouterLink
            :to="{ name: 'lecturer-report', params: { courseId: course._id } }"
            class="h-9 px-3 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-base text-gray-500">bar_chart</span>
            <span>Report</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-else class="py-16 text-center bg-white rounded-xl border border-gray-100">
      <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">menu_book</span>
      <h3 class="text-sm font-semibold text-gray-800">No courses assigned yet</h3>
      <p class="text-xs text-gray-500 mt-1">Contact the Academic Registry to assign course units.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const courses = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/api/lecturer/courses')
    const data = res.data?.data || res.data?.courses || res.data || []
    courses.value = Array.isArray(data) ? data : []
  } catch (err) {
    courses.value = []
  } finally {
    isLoading.value = false
  }
})
</script>
