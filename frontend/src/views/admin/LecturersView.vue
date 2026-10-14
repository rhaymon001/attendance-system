<template>
  <div class="w-full space-y-6">
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Lecturers</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Manage academic staff accounts and their course assignments
        </p>
      </div>
      <button
        type="button"
        class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        @click="openAddModal"
      >
        <span class="material-symbols-outlined text-lg">person_add</span>
        <span>Add Lecturer</span>
      </button>
    </div>

    <!-- Lecturers Table Card -->
    <div class="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div v-if="isLoading" class="p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-100 rounded w-full"></div>
          <div v-for="i in 6" :key="`skel-${i}`" class="h-12 bg-gray-50 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="lecturers.length > 0" class="w-full overflow-x-auto">
        <AppTable>
          <template #header>
            <th class="px-4 py-3">Full Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Courses Assigned</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </template>

          <tr
            v-for="lecturer in lecturers"
            :key="lecturer._id"
            class="h-13 hover:bg-gray-50/75 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-sm text-gray-900">
              {{ lecturer.name }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ lecturer.email }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ lecturer.department || '—' }}
            </td>
            <td class="px-4 py-3">
              <AppBadge variant="info">{{ courseCount(lecturer) }} Courses</AppBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                  title="Edit Lecturer"
                  @click="openEditModal(lecturer)"
                >
                  <span class="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Lecturer"
                  @click="deleteLecturer(lecturer)"
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
          <span class="material-symbols-outlined text-4xl">badge</span>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">No lecturers yet</h3>
        <p class="text-sm text-gray-500 max-w-sm mb-6">Add a lecturer to get started.</p>
        <button
          type="button"
          class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          @click="openAddModal"
        >
          <span class="material-symbols-outlined text-lg">person_add</span>
          <span>Add Lecturer</span>
        </button>
      </div>
    </div>

    <!-- Add / Edit Lecturer Modal -->
    <AppModal
      v-model="isModalOpen"
      :title="editingId ? 'Edit Lecturer Record' : 'Register New Lecturer'"
    >
      <template #icon>
        <span class="material-symbols-outlined text-primary text-xl">
          {{ editingId ? 'edit' : 'person_add' }}
        </span>
      </template>

      <form class="space-y-4" @submit.prevent="saveLecturer">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            v-model="form.name"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Surname Firstname Middlename"
            required
            type="text"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Institutional Email
          </label>
          <input
            v-model="form.email"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="lecturer.name@futo.edu.ng"
            required
            type="email"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Department
          </label>
          <input
            v-model="form.department"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="e.g. Computer Science"
            type="text"
          />
        </div>

        <div v-if="!editingId">
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Temporary Password
            </label>
            <span class="text-[11px] font-medium text-amber-600">Shown once</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="form.password"
              class="flex-1 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm font-mono outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              readonly
              type="text"
            />
            <button
              type="button"
              class="h-10 px-3 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              title="Regenerate password"
              @click="form.password = generatePassword()"
            >
              <span class="material-symbols-outlined text-lg">autorenew</span>
            </button>
          </div>
          <p class="text-[11px] text-gray-500 mt-1">
            Share this temporary credential with the lecturer. They should change it after first login.
          </p>
        </div>

        <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            :disabled="isSubmitting"
            @click="isModalOpen = false"
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
            <span>{{ isSubmitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Lecturer Record' }}</span>
          </button>
        </div>
      </form>
    </AppModal>

    <AppToast
      v-model="toast.show"
      :message="toast.message"
      :type="toast.type"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import AppToast from '@/components/ui/AppToast.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const lecturers = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)

const isModalOpen = ref(false)
const editingId = ref(null)
const form = ref({
  name: '',
  email: '',
  department: '',
  password: ''
})

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
}

const courseCount = (lecturer) => {
  return (
    lecturer.coursesAssigned?.length ??
    lecturer.courses?.length ??
    lecturer.coursesCount ??
    0
  )
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = 'Tmp@'
  for (let i = 0; i < 5; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

const fetchLecturers = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/api/admin/lecturers')
    const data = res.data?.data || res.data?.lecturers || res.data || []
    lecturers.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch lecturers:', err)
    lecturers.value = []
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  editingId.value = null
  form.value = {
    name: '',
    email: '',
    department: '',
    password: generatePassword()
  }
  isModalOpen.value = true
}

const openEditModal = (lecturer) => {
  editingId.value = lecturer._id
  form.value = {
    name: lecturer.name || '',
    email: lecturer.email || '',
    department: lecturer.department || '',
    password: ''
  }
  isModalOpen.value = true
}

const saveLecturer = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await api.put(`/api/admin/lecturers/${editingId.value}`, {
        name: form.value.name,
        email: form.value.email,
        department: form.value.department
      })
      showToast('Lecturer record updated successfully!')
    } else {
      await api.post('/api/admin/lecturers', {
        name: form.value.name,
        email: form.value.email,
        department: form.value.department,
        password: form.value.password
      })
      showToast('Lecturer registered successfully!')
    }
    isModalOpen.value = false
    await fetchLecturers()
  } catch (err) {
    console.error('Failed to save lecturer:', err)
    showToast(err?.response?.data?.message || 'Failed to save lecturer record', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const deleteLecturer = async (lecturer) => {
  const confirmed = window.confirm(`Are you sure you want to delete lecturer "${lecturer.name}"?`)
  if (!confirmed) return

  try {
    await api.delete(`/api/admin/lecturers/${lecturer._id}`)
    showToast('Lecturer deleted successfully')
    await fetchLecturers()
  } catch (err) {
    console.error('Failed to delete lecturer:', err)
    showToast(err?.response?.data?.message || 'Failed to delete lecturer', 'error')
  }
}

onMounted(() => {
  fetchLecturers()
})
</script>
