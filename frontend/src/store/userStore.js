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
      lastFetch: null, // Timestamp of last fetch

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
          const token = localStorage.getItem('token');
          if (!token) {
            console.warn('UserStore: No token found, cannot fetch users');
            return [];
          }

          console.log('UserStore: Fetching users with token:', token.substring(0, 20) + '...');

          const response = await fetch('http://127.0.0.1:8000/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const users = data.data || data;
            console.log('UserStore: Fetched users from API:', users);
            console.log('UserStore: Setting users in store...');
            
            // Force update the store
            set({ users: Array.isArray(users) ? users : [] });
            
            // Also trigger a re-render by updating a timestamp
            set(state => ({ ...state, lastFetch: Date.now() }));
            
            console.log('UserStore: Users set successfully, count:', users.length);
            return users;
          } else {
            console.error('UserStore: Failed to fetch users:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('UserStore: Error response:', errorText);
          }
        } catch (error) {
          console.error('UserStore: Error fetching users:', error);
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
