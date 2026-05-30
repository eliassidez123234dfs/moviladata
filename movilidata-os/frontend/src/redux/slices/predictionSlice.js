import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiClient } from '../../services/api'

export const fetchPrediction = createAsyncThunk('prediction/fetch', async ({ fecha = '', hora = 12 }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/api/prediction', { params: { fecha, hora } })
    return response.data
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const initialState = {
  data: null,
  fecha: '',
  hora: 12,
  loading: false,
  error: null
}

const predictionSlice = createSlice({
  name: 'prediction',
  initialState,
  reducers: {
    setFecha: (state, action) => { state.fecha = action.payload },
    setHora: (state, action) => { state.hora = action.payload }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrediction.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchPrediction.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchPrediction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setFecha, setHora } = predictionSlice.actions
export default predictionSlice.reducer
