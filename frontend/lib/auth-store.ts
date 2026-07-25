import { create } from "zustand"
import axios from "axios"
import apiClient from "@/lib/api-client"
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "@/lib/types"

interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAccessToken: (token: string | null) => void
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  updateUser: (user: UserResponse) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAccessToken: (token: string | null) => {
    set({ accessToken: token, isAuthenticated: !!token })
  },

  login: async (data: LoginRequest) => {
    const res = await apiClient.post<TokenResponse>("/auth/login", data)
    const { access_token, refresh_token } = res.data
    set({ accessToken: access_token, isAuthenticated: true })
    // fetch user
    const userRes = await apiClient.get<UserResponse>("/auth/me")
    set({ user: userRes.data })
  },

  register: async (data: RegisterRequest) => {
    const res = await apiClient.post<TokenResponse>("/auth/register", data)
    const { access_token } = res.data
    set({ accessToken: access_token, isAuthenticated: true })
    const userRes = await apiClient.get<UserResponse>("/auth/me")
    set({ user: userRes.data })
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout")
    } catch {
      // ignore
    }
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  hydrate: async () => {
    try {
      const res = await axios.get<TokenResponse>("/api/v1/auth/session", {
        withCredentials: true,
      })
      const { access_token } = res.data
      set({ accessToken: access_token, isAuthenticated: true })
      const userRes = await apiClient.get<UserResponse>("/auth/me")
      set({ user: userRes.data })
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  updateUser: (user: UserResponse) => {
    set({ user })
  },
}))
