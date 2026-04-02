import { create } from 'zustand'
import { authService, AuthUser } from '../services/authService'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null

  // Actions
  signup: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const { user, token } = await authService.signup(email, password, name)
      authService.setToken(token)
      set({ user, token, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { user, token } = await authService.login(email, password)
      authService.setToken(token)
      set({ user, token, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    authService.removeToken()
    set({ user: null, token: null })
  },

  initialize: async () => {
    set({ isLoading: true })
    try {
      const token = authService.getToken()
      if (token) {
        try {
          const user = await authService.getMe(token)
          set({ user, token, isLoading: false })
        } catch {
          authService.removeToken()
          set({ user: null, token: null, isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
