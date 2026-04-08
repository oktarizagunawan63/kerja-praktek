import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * User management store
 * Administrator bisa buat akun sales_manager dan engineer
 * Setiap user punya assignedProjects: [projectId, ...]
 */
const useUserStore = create(
  persist(
    (set, get) => ({
      users: [
        // Default administrator — sesuai dengan seeder backend
        {
          id: 'administrator-1',
          name: 'Admin',
          email: 'direktur@ptamsar.co.id',
          password: 'password',
          role: 'administrator',
          assignedProjects: [], // administrator lihat semua, tidak perlu assign
        },
        {
          id: 'sm-1',
          name: 'Sales Manager',
          email: 'budi@ptamsar.co.id',
          password: 'password',
          role: 'sales_manager',
          assignedProjects: [],
        },
        {
          id: 'sm-2',
          name: 'Sales Manager 2',
          email: 'siti@ptamsar.co.id',
          password: 'password',
          role: 'sales_manager',
          assignedProjects: [],
        },
        {
          id: 'eng-1',
          name: 'Ahmad Fauzi',
          email: 'ahmad@ptamsar.co.id',
          password: 'password',
          role: 'engineer',
          assignedProjects: [],
        },
        {
          id: 'sales-1',
          name: 'Sales 1',
          email: 'sales1@ptamsar.co.id',
          password: 'password',
          role: 'sales',
          assignedProjects: [],
        },
        {
          id: 'sales-2',
          name: 'Sales 2',
          email: 'sales2@ptamsar.co.id',
          password: 'password',
          role: 'sales',
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
