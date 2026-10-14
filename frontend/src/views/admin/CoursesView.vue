<template>
  <div class="w-full space-y-6">
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Courses</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Create course units, assign lecturers, and manage student enrollment
        </p>
      </div>
      <button
        type="button"
        class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        @click="openCreateModal"
      >
        <span class="material-symbols-outlined text-lg">library_add</span>
        <span>Create Course</span>
      </button>
    </div>

    <!-- Courses Table Card -->
    <div class="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div v-if="isLoading" class="p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-100 rounded w-full"></div>
          <div v-for="i in 6" :key="`skel-${i}`" class="h-12 bg-gray-50 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="courses.length > 0" class="w-full overflow-x-auto">
        <AppTable>
          <template #header>
            <th class="px-4 py-3">Course Code</th>
            <th class="px-4 py-3">Course Title</th>
            <th class="px-4 py-3">Assigned Lecturer</th>
            <th class="px-4 py-3">Enrolled Students</th>
            <th class="px-4 py-3">Alert Threshold</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </template>

          <tr
            v-for="course in courses"
            :key="course._id"
            class="h-13 hover:bg-gray-50/75 transition-colors"
          >
            <td class="px-4 py-3 font-mono font-semibold text-sm text-primary">
              {{ course.code }}
            </td>
            <td class="px-4 py-3 font-medium text-sm text-gray-900">
              {{ course.title }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ course.lecturerId?.name || course.lecturerName || '—' }}
            </td>
            <td class="px-4 py-3">
              <AppBadge variant="info">{{ enrolledCount(course) }} Students</AppBadge>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ course.alertThreshold ?? 75 }}%
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="h-8 px-2.5 rounded-lg flex items-center gap-1 text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors text-xs font-medium"
                  title="Manage Students"
                  @click="openManageModal(course)"
                >
                  <span class="material-symbols-outlined text-lg">group</span>
                  <span>Manage</span>
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Course"
                  @click="deleteCourse(course)"
                >
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </AppTable>
      </div>

      <div v-else class="py-16 px-4 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <span class="material-symbols-outlined text-4xl">menu_book</span>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">No courses yet</h3>
        <p class="text-sm text-gray-500 max-w-sm mb-6">Create a course to get started.</p>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          @click="openCreateModal"
        >
          <span class="material-symbols-outlined text-lg">library_add</span>
          <span>Create Course</span>
        </button>
      </div>
    </div>

    <!-- Create Course Modal -->
    <AppModal v-model="isCourseModalOpen" title="Create New Course">
      <template #icon>
        <span class="material-symbols-outlined text-primary text-xl">library_add</span>
      </template>

      <form class="space-y-4" @submit.prevent="createCourse">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Course Code
            </label>
            <input
              v-model="courseForm.code"
              class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm font-mono uppercase outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. CSC407"
              required
              type="text"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Alert Threshold (%)
            </label>
            <input
              v-model.number="courseForm.alertThreshold"
              class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              max="100"
              min="0"
              required
              type="number"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Course Title
          </label>
          <input
            v-model="courseForm.title"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="e.g. Data Communication & Networks"
            required
            type="text"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Assigned Lecturer
          </label>
          <select
            v-model="courseForm.lecturerId"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
            required
          >
            <option value="">Select Lecturer</option>
            <option v-for="lecturer in lecturers" :key="lecturer._id" :value="lecturer._id">
              {{ lecturer.name }}
            </option>
          </select>
        </div>

        <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            :disabled="isSubmitting"
            @click="isCourseModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            <span v-else class="material-symbols-outlined text-lg">check</span>
            <span>{{ isSubmitting ? 'Creating...' : 'Create Course' }}</span>
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Manage Students Modal -->
    <AppModal
      v-model="isManageModalOpen"
      :title="managingCourse ? `Manage Students — ${managingCourse.code}` : 'Manage Students'"
      custom-width="max-w-2xl"
    >
      <template #icon>
        <span class="material-symbols-outlined text-primary text-xl">group</span>
      </template>

      <div class="space-y-5">
        <!-- Enrolled Students -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <AppBadge variant="info">{{ enrolledStudents.length }} Enrolled</AppBadge>
          </div>

          <div class="rounded-lg border border-gray-200 overflow-hidden">
            <div v-if="isEnrolledLoading" class="p-4">
              <AppSpinner size="sm" label="Loading enrolled students..." />
            </div>
            <div
              v-else-if="enrolledStudents.length > 0"
              class="max-h-56 overflow-y-auto divide-y divide-gray-100"
            >
              <div
                v-for="student in enrolledStudents"
                :key="student._id"
                class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm font-medium text-gray-900 truncate">{{ student.name }}</span>
                  <span class="font-mono text-xs text-gray-500 shrink-0">{{ student.matricNo || '—' }}</span>
                </div>
                <button
                  type="button"
                  class="text-xs font-medium text-rejected hover:underline disabled:opacity-50"
                  :disabled="busyIds.has(student._id)"
                  @click="removeStudent(student)"
                >
                  Remove
                </button>
              </div>
            </div>
            <div v-else class="p-4 text-center text-xs text-gray-500">
              No students enrolled in this course yet.
            </div>
          </div>
        </div>

        <!-- Add Students -->
        <div>
          <span class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Add Students
          </span>
          <div class="relative mb-2">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg pointer-events-none">search</span>
            <input
              v-model="studentSearch"
              class="w-full h-10 pl-9 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Search by name or matric number..."
              type="text"
            />
          </div>

          <div class="rounded-lg border border-gray-200 overflow-hidden">
            <div
              v-if="availableStudents.length > 0"
              class="max-h-56 overflow-y-auto divide-y divide-gray-100"
            >
              <div
                v-for="student in availableStudents"
                :key="student._id"
                class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm font-medium text-gray-900 truncate">{{ student.name }}</span>
                  <span class="font-mono text-xs text-gray-500 shrink-0">{{ student.matricNo || '—' }}</span>
                </div>
                <button
                  type="button"
                  class="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  :disabled="busyIds.has(student._id)"
                  @click="addStudent(student)"
                >
                  Add
                </button>
              </div>
            </div>
            <div v-else class="p-4 text-center text-xs text-gray-500">
              {{ studentSearch ? 'No matching students found.' : 'All registered students are enrolled.' }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm"
          @click="isManageModalOpen = false"
        >
          Done
        </button>
      </template>
    </AppModal>

    <AppToast
      v-model="toast.show"
      :message="toast.message"
      :type="toast.type"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import AppToast from '@/components/ui/AppToast.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const courses = ref([])
const lecturers = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)

const isCourseModalOpen = ref(false)
const courseForm = ref({
  code: '',
  title: '',
  lecturerId: '',
  alertThreshold: 75
})

const isManageModalOpen = ref(false)
const managingCourse = ref(null)
const enrolledStudents = ref([])
const allStudents = ref([])
const isEnrolledLoading = ref(false)
const studentSearch = ref('')
const busyIds = ref(new Set())

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
}

const enrolledCount = (course) => {
  return course.enrolledStudents?.length ?? course.enrolledCount ?? 0
}

const normalizeStudent = (entry) => {
  if (entry && entry.studentId && typeof entry.studentId === 'object') {
    return entry.studentId
  }
  return entry
}

const enrolledIds = computed(() => new Set(enrolledStudents.value.map((s) => s._id)))

const availableStudents = computed(() => {
  const query = studentSearch.value.toLowerCase().trim()
  return allStudents.value
    .filter((s) => s && s._id && !enrolledIds.value.has(s._id))
    .filter((s) => {
      if (!query) return true
      const name = (s.name || '').toLowerCase()
      const matric = (s.matricNo || '').toLowerCase()
      return name.includes(query) || matric.includes(query)
    })
})

const fetchCourses = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/api/admin/courses')
    const data = res.data?.data || res.data?.courses || res.data || []
    courses.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch courses:', err)
    courses.value = []
  } finally {
    isLoading.value = false
  }
}

const fetchLecturers = async () => {
  try {
    const res = await api.get('/api/admin/lecturers')
    const data = res.data?.data || res.data?.lecturers || res.data || []
    lecturers.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch lecturers:', err)
    lecturers.value = []
  }
}

const openCreateModal = () => {
  courseForm.value = {
    code: '',
    title: '',
    lecturerId: '',
    alertThreshold: 75
  }
  isCourseModalOpen.value = true
}

const createCourse = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await api.post('/api/admin/courses', {
      code: courseForm.value.code.trim().toUpperCase(),
      title: courseForm.value.title.trim(),
      lecturerId: courseForm.value.lecturerId,
      alertThreshold: Number(courseForm.value.alertThreshold) || 75
    })
    showToast('Course created successfully!')
    isCourseModalOpen.value = false
    await fetchCourses()
  } catch (err) {
    console.error('Failed to create course:', err)
    showToast(err?.response?.data?.message || 'Failed to create course', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const fetchEnrolledStudents = async (courseId) => {
  isEnrolledLoading.value = true
  try {
    const res = await api.get(`/api/admin/courses/${courseId}/students`)
    const data = res.data?.data || res.data?.students || res.data || []
    enrolledStudents.value = (Array.isArray(data) ? data : []).map(normalizeStudent)
  } catch (err) {
    console.error('Failed to fetch enrolled students:', err)
    enrolledStudents.value = []
  } finally {
    isEnrolledLoading.value = false
  }
}

const fetchAllStudents = async () => {
  try {
    const res = await api.get('/api/admin/students')
    const data = res.data?.data || res.data?.students || res.data || []
    allStudents.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch students:', err)
    allStudents.value = []
  }
}

const openManageModal = async (course) => {
  managingCourse.value = course
  studentSearch.value = ''
  enrolledStudents.value = []
  isManageModalOpen.value = true
  await Promise.all([fetchEnrolledStudents(course._id), fetchAllStudents()])
}

const markBusy = (id, busy) => {
  const next = new Set(busyIds.value)
  if (busy) next.add(id)
  else next.delete(id)
  busyIds.value = next
}

const addStudent = async (student) => {
  if (!managingCourse.value) return
  markBusy(student._id, true)
  try {
    await api.put(`/api/admin/courses/${managingCourse.value._id}`, {
      studentId: student._id
    })
    await fetchEnrolledStudents(managingCourse.value._id)
    await fetchCourses()
    showToast(`${student.name} enrolled successfully`)
  } catch (err) {
    console.error('Failed to enroll student:', err)
    showToast(err?.response?.data?.message || 'Failed to enroll student', 'error')
  } finally {
    markBusy(student._id, false)
  }
}

const removeStudent = async (student) => {
  if (!managingCourse.value) return
  markBusy(student._id, true)
  try {
    await api.put(`/api/admin/courses/${managingCourse.value._id}`, {
      removeStudentId: student._id
    })
    await fetchEnrolledStudents(managingCourse.value._id)
    await fetchCourses()
    showToast(`${student.name} removed from course`)
  } catch (err) {
    console.error('Failed to remove student:', err)
    showToast(err?.response?.data?.message || 'Failed to remove student', 'error')
  } finally {
    markBusy(student._id, false)
  }
}

const deleteCourse = async (course) => {
  const confirmed = window.confirm(`Are you sure you want to delete course "${course.code}"?`)
  if (!confirmed) return

  try {
    await api.delete(`/api/admin/courses/${course._id}`)
    showToast('Course deleted successfully')
    await fetchCourses()
  } catch (err) {
    console.error('Failed to delete course:', err)
    showToast(err?.response?.data?.message || 'Failed to delete course', 'error')
  }
}

onMounted(() => {
  fetchCourses()
  fetchLecturers()
})
</script>
