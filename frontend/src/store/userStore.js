import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * User management store
 * Direktur bisa buat akun site_manager dan engineer
 * Setiap user punya assignedProjects: [projectId, ...]
 */
const useUserStore = create(
  persist(
    (set, get) => ({
      users: [
        // Default direktur — sesuai dengan seeder backend
        {
          id: 'direktur-1',
          name: 'Direktur Utama',
          email: 'direktur@ptamsar.co.id',
          password: 'password',
          role: 'direktur',
          assignedProjects: [], // direktur lihat semua, tidak perlu assign
        },
        {
          id: 'sm-1',
          name: 'Budi Santoso',
          email: 'budi@ptamsar.co.id',
          password: 'password',
          role: 'site_manager',
          assignedProjects: [],
        },
        {
          id: 'sm-2',
          name: 'Siti Rahayu',
          email: 'siti@ptamsar.co.id',
          password: 'password',
          role: 'site_manager',
          assignedProjects: [],
        },
        {
          id: 'eng-1',
          name: 'Ahmad Fauzi',
          email: 'ahmad@ptamsar.co.id',
          password: 'password',
          role: 'engineer',
          assignedProjects: [],
        }
      ],

      addUser: (userData) => {
        const newUser = {
          id: Date.now().toString(),
          ...userData,
          assignedProjects: userData.assignedProjects || [],
        }
        set(s => ({ users: [...s.users, newUser] }))
        return newUser
      },

      updateUser: (id, fields) =>
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...fields } : u) })),

      deleteUser: (id) =>
        set(s => ({ users: s.users.filter(u => u.id !== id) })),

      assignProject: (userId, projectId) =>
        set(s => ({
          users: s.users.map(u =>
            u.id === userId && !u.assignedProjects.includes(projectId)
              ? { ...u, assignedProjects: [...u.assignedProjects, projectId] }
              : u
          )
        })),

      unassignProject: (userId, projectId) =>
        set(s => ({
          users: s.users.map(u =>
            u.id === userId
              ? { ...u, assignedProjects: u.assignedProjects.filter(p => p !== projectId) }
              : u
          )
        })),

      getUserById: (id) => get().users.find(u => u.id === id),

      // Login check
      loginCheck: (email, password) =>
        get().users.find(u => u.email === email && u.password === password) || null,
    }),
    { name: 'amsar-users' }
  )
)

export default useUserStore
