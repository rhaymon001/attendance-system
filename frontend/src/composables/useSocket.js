import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

export function useSocket() {
  const socket = ref(null)
  const isConnected = ref(false)

  const token = localStorage.getItem('token') || ''
  const socketUrl = import.meta.env.DEV ? '' : import.meta.env?.VITE_API_URL || ''

  socket.value = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling']
  })

  socket.value.on('connect', () => {
    isConnected.value = true
  })

  socket.value.on('disconnect', () => {
    isConnected.value = false
  })

  const join = (sessionId) => {
    if (socket.value && sessionId) {
      socket.value.emit('join', { sessionId })
    }
  }

  const onAttendanceNew = (callback) => {
    if (socket.value) {
      socket.value.on('attendance:new', callback)
    }
  }

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect()
    }
  })

  return {
    socket,
    isConnected,
    join,
    onAttendanceNew
  }
}
