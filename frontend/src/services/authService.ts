const API_BASE = 'http://localhost:3000'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export const authService = {
  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }

    return response.json()
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    return response.json()
  },

  async getMe(token: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    return response.json()
  },

  setToken(token: string) {
    localStorage.setItem('auth_token', token)
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  },

  removeToken() {
    localStorage.removeItem('auth_token')
  },
}
