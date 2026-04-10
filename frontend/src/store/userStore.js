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
      users: [], // Users now fetched from backend API, no hardcoded data

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

      // Fetch users from backend API
      fetchUsers: async () => {
        try {
          const response = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const users = data.data || data;
            set({ users: Array.isArray(users) ? users : [] });
            return users;
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
        return [];
      },

      // Set users from external source (like API)
      setUsers: (users) => set({ users: Array.isArray(users) ? users : [] }),
    }),
    { name: 'amsar-users' }
  )
)

export default useUserStore
