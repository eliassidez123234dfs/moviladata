import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiClient } from '../../services/api'

export const fetchTraffic = createAsyncThunk('traffic/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/api/traffic')
    return response.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const initialState = {
  segments: [],
  summary: { velocidad_promedio: 0, vias_congestionadas: 0, peores_vias: [] },
  alerts: [],
  loading: false,
  error: null,
  lastUpdate: null,
  sourceStatus: 'ok'
}

const trafficSlice = createSlice({
  name: 'traffic',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchTraffic.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchTraffic.fulfilled, (state, action) => {
        state.loading = false
        state.segments = action.payload.segments || []
        state.summary = action.payload.summary || initialState.summary
        state.alerts = action.payload.alerts || []
        state.lastUpdate = action.payload.last_update
        state.sourceStatus = action.payload.source_status || 'ok'
      })
      .addCase(fetchTraffic.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.sourceStatus = 'degraded'
      })
  }
})

export default trafficSlice.reducer
