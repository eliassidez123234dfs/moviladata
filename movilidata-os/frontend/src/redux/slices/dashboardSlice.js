import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiClient } from '../../services/api'

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    const [accidents, traffic, weather, alerts, prediction] = await Promise.all([
      apiClient.get('/api/accidents'),
      apiClient.get('/api/traffic'),
      apiClient.get('/api/weather'),
      apiClient.get('/api/alerts'),
      apiClient.get('/api/prediction')
    ])
    return {
      accidentCount: accidents.data.features?.length ?? 0,
      trafficCount: traffic.data.segments?.length ?? 0,
      congestionLevel: traffic.data.segments?.filter(s => s.color === 'red').length ?? 0,
      weather: weather.data,
      alertCount: alerts.data.alerts?.length ?? 0,
      prediction: prediction.data
    }
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const initialState = {
  data: {
    accidentCount: 0,
    trafficCount: 0,
    congestionLevel: 0,
    weather: null,
    alertCount: 0,
    prediction: null
  },
  loading: false,
  error: null,
  lastUpdate: null,
  dataFreshness: 'ok'
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
        state.lastUpdate = new Date().toISOString()
        state.dataFreshness = 'ok'
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.dataFreshness = 'degraded'
      })
  }
})

export default dashboardSlice.reducer
