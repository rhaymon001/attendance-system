<template>
  <div class="w-full space-y-6">
    <!-- Page Header Area -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Students</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Manage registered students, academic departments, and enrollment credentials
        </p>
      </div>
      <div class="flex items-center gap-3 self-start md:self-auto">
        <!-- Import CSV Button (Secondary) -->
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          @click="isImportModalOpen = true"
        >
          <span class="material-symbols-outlined text-lg text-gray-500">upload_file</span>
          <span>Import CSV</span>
        </button>

        <!-- Add Student Button (Primary) -->
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          @click="openAddStudentModal"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          <span>Add Student</span>
        </button>
      </div>
    </div>

    <!-- Format Advisory / Ingestion Specification Banner -->
    <div class="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-start md:items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-xl">table_chart</span>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-900 block">Standard Registry CSV Schema Active</span>
          <span class="text-xs text-gray-500">
            Required column headers:
            <code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">Matric</code>,
            <code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">Name</code>,
            <code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">Department</code>,
            <code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">Level</code>,
            <code class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">Email</code>
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs">UTF-8 / RFC 4180</span>
        <button
          type="button"
          class="text-xs text-primary font-medium hover:underline"
          @click="isImportModalOpen = true"
        >
          View specification
        </button>
      </div>
    </div>

    <!-- Filter & Query Control Bar -->
    <div class="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-lg">
          <span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg pointer-events-none">search</span>
          <input
            v-model="searchQuery"
            class="w-full h-10 pl-9 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Search by matric no, name, or email..."
            type="text"
          />
        </div>

        <!-- Department Filter -->
        <div class="relative">
          <select
            v-model="departmentFilter"
            class="h-10 pl-3 pr-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical & Electronic Engr">Electrical & Electronic Engr</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Software Engineering">Software Engineering</option>
          </select>
          <span class="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-lg pointer-events-none">expand_more</span>
        </div>

        <!-- Level Filter -->
        <div class="relative">
          <select
            v-model="levelFilter"
            class="h-10 pl-3 pr-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
          >
            <option value="">All Levels</option>
            <option value="100">100L</option>
            <option value="200">200L</option>
            <option value="300">300L</option>
            <option value="400">400L</option>
            <option value="500">500L</option>
          </select>
          <span class="material-symbols-outlined absolute right-2.5 top-2.5 text-gray-400 text-lg pointer-events-none">expand_more</span>
        </div>
      </div>

      <!-- Metric Counter Pill -->
      <div class="flex items-center gap-3 shrink-0 self-end lg:self-auto">
        <div class="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-900 text-xs font-medium">
          <span class="font-semibold text-primary">{{ filteredStudents.length }}</span> Total Enrolled
        </div>
      </div>
    </div>

    <!-- Primary Roster Table Card -->
    <div class="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <!-- Skeleton Loading State -->
      <div v-if="isLoading" class="p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-100 rounded w-full"></div>
          <div v-for="i in 6" :key="`skel-${i}`" class="h-12 bg-gray-50 rounded w-full"></div>
        </div>
      </div>

      <!-- Loaded Active Table -->
      <div v-else-if="filteredStudents.length > 0" class="w-full overflow-x-auto">
        <AppTable>
          <template #header>
            <th class="px-4 py-3">Matric No</th>
            <th class="px-4 py-3">Full Name</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Level</th>
            <th class="px-4 py-3">Email Address</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </template>

          <tr
            v-for="student in filteredStudents"
            :key="student._id"
            class="h-13 hover:bg-gray-50/75 transition-colors"
          >
            <td class="px-4 py-3 font-mono font-medium text-sm text-gray-900">
              {{ student.matricNo || '—' }}
            </td>
            <td class="px-4 py-3 font-medium text-sm text-gray-900">
              {{ student.name }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ student.department || '—' }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {{ formatLevel(student.level) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ student.email }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                  title="Edit Student"
                  @click="editStudent(student)"
                >
                  <span class="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Student"
                  @click="deleteStudent(student)"
                >
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </AppTable>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="py-16 px-4 flex flex-col items-center justify-center text-center"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <span class="material-symbols-outlined text-4xl">folder_open</span>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">No students yet</h3>
        <p class="text-sm text-gray-500 max-w-sm mb-6">
          Import a CSV to get started or add individual students manually to register them in the registry.
        </p>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          @click="isImportModalOpen = true"
        >
          <span class="material-symbols-outlined text-lg text-gray-500">upload_file</span>
          <span>Import CSV</span>
        </button>
      </div>
    </div>

    <!-- MODAL: Import CSV -->
    <AppModal
      v-model="isImportModalOpen"
      title="Bulk Import Student Registry"
    >
      <template #icon>
        <span class="material-symbols-outlined text-primary text-xl">upload_file</span>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-500 leading-relaxed">
          Upload a structured Comma-Separated Values (<code class="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">.csv</code>)
          file containing student records.
        </p>

        <!-- Dropzone / File Picker -->
        <label
          class="p-6 border-2 border-dashed border-gray-200 hover:border-primary rounded-xl flex flex-col items-center justify-center text-center cursor-pointer bg-gray-50 hover:bg-blue-50/20 transition-all group"
        >
          <div class="w-12 h-12 rounded-full bg-blue-50 group-hover:scale-105 flex items-center justify-center mb-2 text-primary transition-transform">
            <span class="material-symbols-outlined text-2xl">cloud_upload</span>
          </div>
          <span class="text-sm font-medium text-gray-900 mb-0.5">
            {{ selectedFile ? selectedFile.name : 'Click to browse or drop CSV file here' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'CSV format up to 10MB' }}
          </span>
          <input
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileSelect"
          />
        </label>

        <div class="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-start gap-2.5">
          <span class="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
          <div class="text-xs text-gray-600 leading-relaxed">
            Record verification checks each student's Matric format against Nigerian National Academic Registry conventions prior to database persistence.
          </div>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          :disabled="isImporting"
          @click="isImportModalOpen = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          :disabled="!selectedFile || isImporting"
          @click="submitCsvImport"
        >
          <span v-if="isImporting" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg">play_arrow</span>
          <span>{{ isImporting ? 'Processing...' : 'Process & Ingest' }}</span>
        </button>
      </template>
    </AppModal>

    <!-- MODAL: Add/Edit Single Student -->
    <AppModal
      v-model="isStudentModalOpen"
      :title="editingStudentId ? 'Edit Student Record' : 'Register Individual Student'"
    >
      <template #icon>
        <span class="material-symbols-outlined text-primary text-xl">
          {{ editingStudentId ? 'edit' : 'person_add' }}
        </span>
      </template>

      <form class="space-y-4" @submit.prevent="saveStudent">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Matriculation Number
          </label>
          <input
            v-model="studentForm.matricNo"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="e.g. CSC/2024/099"
            required
            type="text"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Full Legal Name
          </label>
          <input
            v-model="studentForm.name"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Surname Firstname Middlename"
            required
            type="text"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Academic Department
            </label>
            <select
              v-model="studentForm.department"
              class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
              required
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical & Electronic Engr">Electrical & Electronic Engr</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Software Engineering">Software Engineering</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Enrollment Level
            </label>
            <select
              v-model="studentForm.level"
              class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
              required
            >
              <option value="100">100L</option>
              <option value="200">200L</option>
              <option value="300">300L</option>
              <option value="400">400L</option>
              <option value="500">500L</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Institutional Email
          </label>
          <input
            v-model="studentForm.email"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="student.name@futo.edu.ng"
            required
            type="email"
          />
        </div>

        <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            @click="isStudentModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span class="material-symbols-outlined text-lg">check</span>
            <span>{{ editingStudentId ? 'Update Record' : 'Save Student Record' }}</span>
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Feedback Toast -->
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

// State
const students = ref([])
const isLoading = ref(true)
const isImporting = ref(false)
const searchQuery = ref('')
const departmentFilter = ref('')
const levelFilter = ref('')

const isImportModalOpen = ref(false)
const selectedFile = ref(null)

const isStudentModalOpen = ref(false)
const editingStudentId = ref(null)
const studentForm = ref({
  matricNo: '',
  name: '',
  department: '',
  level: '100',
  email: ''
})

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }
}

const formatLevel = (level) => {
  if (!level) return '—'
  const str = String(level)
  return str.endsWith('L') ? str : `${str}L`
}

// Fetch Students
const fetchStudents = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/api/admin/students')
    const data = res.data?.data || res.data?.students || res.data || []
    students.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch students:', err)
    students.value = []
  } finally {
    isLoading.value = false
  }
}

// Filtered computation
const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const dept = departmentFilter.value
  const lvl = levelFilter.value

  return students.value.filter((st) => {
    const matric = (st.matricNo || '').toLowerCase()
    const name = (st.name || '').toLowerCase()
    const email = (st.email || '').toLowerCase()
    const department = st.department || ''
    const levelStr = String(st.level || '').replace('L', '')

    const matchesQuery = !query || matric.includes(query) || name.includes(query) || email.includes(query)
    const matchesDept = !dept || department === dept
    const matchesLevel = !lvl || levelStr === lvl.replace('L', '')

    return matchesQuery && matchesDept && matchesLevel
  })
})

// CSV Import Handling
const handleFileSelect = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
  }
}

const submitCsvImport = async () => {
  if (!selectedFile.value) return
  isImporting.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const res = await api.post('/api/admin/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const summary = `Import complete: ${res.data?.created || 0} created, ${res.data?.skipped || 0} skipped.`
    showToast(summary, 'success')
    isImportModalOpen.value = false
    selectedFile.value = null
    await fetchStudents()
  } catch (err) {
    console.error('CSV import failed:', err)
    showToast(err?.response?.data?.message || 'Failed to import CSV file', 'error')
  } finally {
    isImporting.value = false
  }
}

// Add/Edit Student
const openAddStudentModal = () => {
  editingStudentId.value = null
  studentForm.value = {
    matricNo: '',
    name: '',
    department: '',
    level: '100',
    email: ''
  }
  isStudentModalOpen.value = true
}

const editStudent = (student) => {
  editingStudentId.value = student._id
  studentForm.value = {
    matricNo: student.matricNo || '',
    name: student.name || '',
    department: student.department || '',
    level: String(student.level || '100').replace('L', ''),
    email: student.email || ''
  }
  isStudentModalOpen.value = true
}

const saveStudent = async () => {
  try {
    if (editingStudentId.value) {
      await api.put(`/api/admin/students/${editingStudentId.value}`, studentForm.value)
      showToast('Student record updated successfully!')
    } else {
      await api.post('/api/admin/students', studentForm.value)
      showToast('Student registered successfully!')
    }
    isStudentModalOpen.value = false
    await fetchStudents()
  } catch (err) {
    console.error('Failed to save student:', err)
    showToast(err?.response?.data?.message || 'Failed to save student record', 'error')
  }
}

// Delete Student
const deleteStudent = async (student) => {
  const confirmed = window.confirm(`Are you sure you want to delete student "${student.name}" (${student.matricNo})?`)
  if (!confirmed) return

  try {
    await api.delete(`/api/admin/students/${student._id}`)
    showToast('Student deleted successfully')
    await fetchStudents()
  } catch (err) {
    console.error('Failed to delete student:', err)
    showToast(err?.response?.data?.message || 'Failed to delete student', 'error')
  }
}

onMounted(() => {
  fetchStudents()
})
</script>
