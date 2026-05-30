import { configureStore } from '@reduxjs/toolkit'
import dashboardReducer from './slices/dashboardSlice'
import accidentsReducer from './slices/accidentsSlice'
import trafficReducer from './slices/trafficSlice'
import predictionReducer from './slices/predictionSlice'
import routeReducer from './slices/routeSlice'
import alertsReducer from './slices/alertsSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    accidents: accidentsReducer,
    traffic: trafficReducer,
    prediction: predictionReducer,
    route: routeReducer,
    alerts: alertsReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['dashboard/setLastUpdate'],
        ignoredPaths: ['dashboard.timestamp']
      }
    })
})
