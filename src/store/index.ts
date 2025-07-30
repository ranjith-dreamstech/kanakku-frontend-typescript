// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice'; // Import your auth slice reducer

export const store = configureStore({
  reducer: {
    auth: authReducer, // Assign your auth slice to the 'auth' key in the state
    // Add other reducers here if you have more slices (e.g., products, orders)
  },
  // DevTools are enabled by default in development mode
  devTools: true,
});

// Define RootState and AppDispatch types for better TypeScript integration
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;