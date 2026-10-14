import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role || null)

  const setSession = (nextToken, nextUser) => {
    token.value = nextToken || null
    user.value = nextUser || null

    if (nextToken) {
      localStorage.setItem('token', nextToken)
    } else {
      localStorage.removeItem('token')
    }

    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser))
    } else {
      localStorage.removeItem('user')
    }
  }

  const initAuth = async () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null')

    if (!savedToken) {
      setSession(null, null)
      return null
    }

    try {
      const res = await api.get('/api/auth/me')
      const data = res.data?.data || res.data?.user || res.data
      const nextUser = data || savedUser

      if (!nextUser) {
        setSession(null, null)
        return null
      }

      setSession(savedToken, nextUser)
      return nextUser
    } catch (error) {
      setSession(null, null)
      return null
    }
  }

  const login = async (credentials) => {
    try {
      const res = await api.post('/api/auth/login', credentials)
      const data = res.data?.data || res.data

      const nextUser = data.user || {
        _id: data._id || data.id,
        name: data.name,
        email: data.email,
        role: data.role
      }

      setSession(data.token, nextUser)
      return data
    } catch (err) {
      setSession(null, null)
      throw err
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await api.post('/api/auth/logout').catch(() => null)
      }
    } finally {
      setSession(null, null)
    }
  }

  const fetchMe = async () => {
    if (!token.value) return null
    try {
      const res = await api.get('/api/auth/me')
      const data = res.data?.data || res.data?.user || res.data
      user.value = data
      localStorage.setItem('user', JSON.stringify(user.value))
      return data
    } catch (err) {
      logout()
      throw err
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    role,
    initAuth,
    login,
    logout,
    fetchMe
  }
})
