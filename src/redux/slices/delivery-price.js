import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import deliveryPriceService from 'services/delivery-price';

const initialState = {
  loading: false,
  deliveryPrice: [],
  error: '',
  params: {
    page: 1,
    perPage: 10,
  },
  meta: {},
};

export const fetchDeliveryPrice = createAsyncThunk(
  'price/fetchDeliveryPrice',
  (params = {}) => {
    return deliveryPriceService
      .get({ ...initialState.params, ...params })
      .then((res) => res);
  }
);

const deliveryPrice = createSlice({
  name: 'deliveryPrice',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(fetchDeliveryPrice.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchDeliveryPrice.fulfilled, (state, action) => {
      const { payload } = action;
      state.loading = false;
      state.deliveryPrice = payload.data;
      state.meta = payload.meta;
      state.error = '';
    });
    builder.addCase(fetchDeliveryPrice.rejected, (state, action) => {
      state.loading = false;
      state.deliveryPrice = [];
      state.error = action.error.message;
    });
  },
});

export default deliveryPrice.reducer;
