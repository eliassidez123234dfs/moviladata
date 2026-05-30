import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiClient } from '../../services/api'

export const fetchSafeRoute = createAsyncThunk('route/fetch', async ({ origen, destino }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/api/safe-route', { origen, destino })
    return response.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const initialState = {
  route: null,
  origen: '',
  destino: '',
  loading: false,
  error: null
}

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setOrigen: (state, action) => { state.origen = action.payload },
    setDestino: (state, action) => { state.destino = action.payload },
    clearRoute: (state) => { state.route = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSafeRoute.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchSafeRoute.fulfilled, (state, action) => {
        state.loading = false
        state.route = action.payload
      })
      .addCase(fetchSafeRoute.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setOrigen, setDestino, clearRoute } = routeSlice.actions
export default routeSlice.reducer
