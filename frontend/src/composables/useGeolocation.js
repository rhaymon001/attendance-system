import { ref } from 'vue'

export function useGeolocation() {
  const coords = ref({ lat: null, lng: null })
  const error = ref(null)
  const isLocating = ref(false)

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const err = new Error('Geolocation is not supported by your browser')
        error.value = err.message
        reject(err)
        return
      }

      isLocating.value = true
      error.value = null

      navigator.geolocation.getCurrentPosition(
        (position) => {
          isLocating.value = false
          coords.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          resolve(coords.value)
        },
        (err) => {
          isLocating.value = false
          let msg = 'Failed to acquire location'
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'User denied Geolocation access'
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location position unavailable'
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out'
          }
          error.value = msg
          reject(new Error(msg))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  return {
    coords,
    error,
    isLocating,
    getCurrentPosition
  }
}
