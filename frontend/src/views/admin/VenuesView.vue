<template>
  <div class="w-full space-y-6">
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Venues</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Configure physical facilities, GPS coordinates, and proximity geofencing bounds
        </p>
      </div>
      <button
        type="button"
        class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        @click="openAddModal"
      >
        <span class="material-symbols-outlined text-lg">add_location_alt</span>
        <span>Add Venue</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md">
        <span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg pointer-events-none">search</span>
        <input
          v-model="searchQuery"
          class="w-full h-10 pl-9 pr-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="Search by venue name or building..."
          type="text"
        />
      </div>

      <div class="flex items-center gap-2 text-xs text-gray-500 self-end sm:self-auto">
        <span class="px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 font-medium">
          <strong class="text-primary">{{ filteredVenues.length }}</strong> Venues Active
        </span>
      </div>
    </div>

    <!-- Loading Skeleton Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="i in 6"
        :key="`skel-${i}`"
        class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse space-y-4"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-2 w-3/4">
            <div class="h-5 bg-gray-200 rounded w-4/5"></div>
            <div class="h-3.5 bg-gray-100 rounded w-3/5"></div>
          </div>
          <div class="h-6 w-16 bg-gray-100 rounded-full"></div>
        </div>
        <div class="h-10 bg-gray-50 rounded-lg"></div>
      </div>
    </div>

    <!-- Venues Cards Grid -->
    <div v-else-if="filteredVenues.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="venue in filteredVenues"
        :key="venue._id"
        class="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
      >
        <div class="space-y-3">
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <span class="material-symbols-outlined text-xl">location_city</span>
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900 leading-snug">
                  {{ venue.name }}
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ venue.building || 'Main Campus Facility' }}
                </p>
              </div>
            </div>

            <!-- Radius Badge -->
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 shrink-0">
              {{ venue.radiusMetres || 50 }}m Radius
            </span>
          </div>

          <!-- Coordinates Pill -->
          <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5 text-gray-600">
              <span class="material-symbols-outlined text-sm text-primary">pin_drop</span>
              <span class="font-mono">{{ venue.lat?.toFixed(5) }}, {{ venue.lng?.toFixed(5) }}</span>
            </div>
            <span class="text-gray-400 text-[11px]">WGS84 GPS</span>
          </div>
        </div>

        <!-- Footer / Meta -->
        <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Geofence Active</span>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
            title="Delete Venue"
            @click="deleteVenue(venue)"
          >
            <span class="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="py-16 px-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center"
    >
      <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
        <span class="material-symbols-outlined text-4xl">wrong_location</span>
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-1">No venues registered</h3>
      <p class="text-sm text-gray-500 max-w-sm mb-6">
        Register lecture halls, engineering laboratories, and auditoriums to enable geofenced biometric check-ins.
      </p>
      <button
        type="button"
        class="h-10 px-4 rounded-lg bg-primary hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        @click="openAddModal"
      >
        <span class="material-symbols-outlined text-lg">add_location_alt</span>
        <span>Add First Venue</span>
      </button>
    </div>

    <!-- Modal: Add Venue -->
    <AppModal
      v-model="isModalOpen"
      title="Register New Venue"
    >
      <template #icon>
        <span class="material-symbols-outlined text-primary text-xl">add_location_alt</span>
      </template>

      <form class="space-y-4" @submit.prevent="submitVenue">
        <!-- Venue Name -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" for="vname">
            Venue Name <span class="text-red-500">*</span>
          </label>
          <input
            id="vname"
            v-model="form.name"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="e.g. ETF Hall 2"
            required
            type="text"
          />
        </div>

        <!-- Building / Faculty -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" for="vbuilding">
            Building / Faculty
          </label>
          <input
            id="vbuilding"
            v-model="form.building"
            class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="e.g. Faculty of Engineering Complex"
            type="text"
          />
        </div>

        <!-- Latitude & Longitude -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider" for="vlat">
                Latitude <span class="text-red-500">*</span>
              </label>
              <button
                type="button"
                class="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
                :disabled="isDetectingGps"
                @click="autoDetectGps"
              >
                <span class="material-symbols-outlined text-xs">my_location</span>
                <span>{{ isDetectingGps ? 'Locating...' : 'Auto-Detect' }}</span>
              </button>
            </div>
            <input
              id="vlat"
              v-model.number="form.lat"
              class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. 11.1561"
              required
              step="any"
              type="number"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" for="vlng">
              Longitude <span class="text-red-500">*</span>
            </label>
            <input
              id="vlng"
              v-model.number="form.lng"
              class="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. 7.6228"
              required
              step="any"
              type="number"
            />
          </div>
        </div>

        <!-- Geofence Radius -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" for="vradius">
            Geofence Radius (metres) <span class="text-red-500">*</span>
          </label>
          <div class="relative flex items-center">
            <input
              id="vradius"
              v-model.number="form.radiusMetres"
              class="w-full h-10 pl-3 pr-18 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              max="500"
              min="10"
              placeholder="50"
              required
              type="number"
            />
            <span class="absolute right-2 px-2 py-0.5 rounded bg-gray-200 text-gray-600 text-xs font-medium pointer-events-none">
              metres
            </span>
          </div>
          <p class="text-[11px] text-gray-500 mt-1">
            Acceptable check-in radius around podium coordinates (default: 50m).
          </p>
        </div>

        <!-- Footer Actions -->
        <div class="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            class="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
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
            <span v-else class="material-symbols-outlined text-lg">save</span>
            <span>{{ isSubmitting ? 'Saving...' : 'Save Venue' }}</span>
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

// State
const venues = ref([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isDetectingGps = ref(false)
const isModalOpen = ref(false)
const searchQuery = ref('')

const form = ref({
  name: '',
  building: '',
  lat: null,
  lng: null,
  radiusMetres: 50
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

// Fetch Venues
const fetchVenues = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/api/admin/venues')
    const data = res.data?.data || res.data?.venues || res.data || []
    venues.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch venues:', err)
    showToast('Failed to load registered venues', 'error')
    venues.value = []
  } finally {
    isLoading.value = false
  }
}

// Computed Filtered Venues
const filteredVenues = computed(() => {
  if (!searchQuery.value.trim()) return venues.value
  const query = searchQuery.value.toLowerCase().trim()
  return venues.value.filter((v) => {
    const name = (v.name || '').toLowerCase()
    const building = (v.building || '').toLowerCase()
    return name.includes(query) || building.includes(query)
  })
})

// Modal Open & Reset
const openAddModal = () => {
  form.value = {
    name: '',
    building: '',
    lat: null,
    lng: null,
    radiusMetres: 50
  }
  isModalOpen.value = true
}

// Auto-detect GPS via Geolocation API
const autoDetectGps = () => {
  if (!('geolocation' in navigator)) {
    showToast('Geolocation is not supported by this browser', 'error')
    return
  }
  isDetectingGps.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.value.lat = Number(position.coords.latitude.toFixed(6))
      form.value.lng = Number(position.coords.longitude.toFixed(6))
      isDetectingGps.value = false
      showToast('GPS coordinates acquired successfully')
    },
    (err) => {
      isDetectingGps.value = false
      console.warn('Geolocation failed:', err)
      showToast('Could not acquire location. Please enter manually.', 'info')
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

// Submit Venue
const submitVenue = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  const payload = {
    name: form.value.name.trim(),
    building: form.value.building.trim(),
    lat: Number(form.value.lat),
    lng: Number(form.value.lng),
    radiusMetres: Number(form.value.radiusMetres) || 50
  }

  try {
    await api.post('/api/admin/venues', payload)
    showToast('Venue registered successfully!')
    isModalOpen.value = false
    await fetchVenues()
  } catch (err) {
    console.error('Failed to register venue:', err)
    showToast(err?.response?.data?.message || 'Failed to save venue', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Delete Venue
const deleteVenue = async (venue) => {
  const confirmed = window.confirm(`Are you sure you want to delete venue "${venue.name}"?`)
  if (!confirmed) return

  try {
    await api.delete(`/api/admin/venues/${venue._id}`)
    showToast('Venue deleted successfully')
    await fetchVenues()
  } catch (err) {
    console.error('Failed to delete venue:', err)
    showToast(err?.response?.data?.message || 'Failed to delete venue', 'error')
  }
}

onMounted(() => {
  fetchVenues()
})
</script>
