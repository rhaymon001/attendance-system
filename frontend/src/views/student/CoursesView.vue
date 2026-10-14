<template>
  <div class="space-y-4 pb-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-900">My Enrolled Courses</h2>
      <span class="text-xs text-gray-400">{{ courses.length }} Courses</span>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-28 bg-white rounded-xl border border-gray-100 p-4 animate-pulse"></div>
    </div>

    <div v-else-if="courses.length > 0" class="space-y-3">
      <div
        v-for="course in courses"
        :key="course._id"
        class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
      >
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-primary uppercase tracking-wider">{{ course.code }}</span>
            <h3 class="text-sm font-semibold text-gray-900 mt-0.5">{{ course.title }}</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ course.lecturerId?.name || 'Faculty Lecturer' }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-gray-50">
          <RouterLink
            :to="`/student/attendance`"
            class="text-xs text-gray-500 hover:text-gray-800"
          >
            View Attendance
          </RouterLink>

          <RouterLink
            :to="`/student/checkin/${course._id}?courseCode=${encodeURIComponent(course.code)}&courseTitle=${encodeURIComponent(course.title)}`"
            class="h-8 px-3 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <span class="material-symbols-outlined text-sm">qr_code_scanner</span>
            <span>Check In</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-else class="py-16 text-center bg-white rounded-xl border border-gray-100">
      <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">school</span>
      <h3 class="text-sm font-semibold text-gray-800">No courses enrolled</h3>
      <p class="text-xs text-gray-500 mt-1">You are not enrolled in any course units for this term.</p>
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
    const res = await api.get('/api/student/courses')
    const data = res.data?.data || res.data?.courses || res.data || []
    courses.value = Array.isArray(data) ? data : []
  } catch (err) {
    courses.value = []
  } finally {
    isLoading.value = false
  }
})
</script>
