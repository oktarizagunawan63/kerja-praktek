import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set((state) => ({ ...state, user })),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'amsar-auth' }
  )
)

export default useAuthStore
