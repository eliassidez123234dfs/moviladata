import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiClient } from '../../services/api'

export const fetchAccidents = createAsyncThunk('accidents/fetch', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/api/accidents', { params })
    return response.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const initialState = {
  features: [],
  loading: false,
  error: null,
  filters: { comuna: 'Todas', fechaInicio: '', fechaFin: '', tipo: '', gravedad: '' }
}

const accidentsSlice = createSlice({
  name: 'accidents',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccidents.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchAccidents.fulfilled, (state, action) => {
        state.loading = false
        state.features = action.payload.features || []
      })
      .addCase(fetchAccidents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setFilters } = accidentsSlice.actions
export default accidentsSlice.reducer
