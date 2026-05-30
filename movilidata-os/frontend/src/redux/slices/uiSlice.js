import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeTab: 'dashboard',
  offlineMode: false,
  darkMode: false,
  sidebarOpen: false,
  notifications: []
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => { state.activeTab = action.payload },
    setOfflineMode: (state, action) => { state.offlineMode = action.payload },
    toggleDarkMode: (state) => { state.darkMode = !state.darkMode },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    addNotification: (state, action) => {
      const id = Date.now()
      state.notifications.push({ id, ...action.payload })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    }
  }
})

export const { setActiveTab, setOfflineMode, toggleDarkMode, toggleSidebar, addNotification, removeNotification, clearNotifications } = uiSlice.actions
export default uiSlice.reducer
