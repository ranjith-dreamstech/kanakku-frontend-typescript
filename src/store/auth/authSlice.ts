import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import Constants from "../../constants/api";

export interface AuthState {
    isAuthenticated: boolean;
    user: any;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

//define initial state
const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: '',
    isLoading: false,
    error: null
}

// This handles the asynchronous logic of making an API request
// and dispatches pending, fulfilled, and rejected actions automatically.
export const loginUser = createAsyncThunk(
    'auth/login', // Action type prefix
    async (credentials: { email: string; password: string }, { rejectWithValue }) => {
        try {
            // Replace with your actual Laravel API login endpoint
            const response = await axios.post(Constants.LOGIN_URL, {
                email: credentials.email,
                password: credentials.password,
            });

            // Assuming your backend returns a token and user data on successful login
            const { token, user } = response.data;

            // Store token and user data in local storage for persistence
            localStorage.setItem('authToken', token);
            localStorage.setItem('authUser', JSON.stringify(user));

            return { token, user }; // This will be the `payload` of the `fulfilled` action
        } catch (error: any) {
            // Handle different error types, e.g., network error, server error response
            let errorMessage = 'Login failed. Please try again.';
            if (axios.isAxiosError(error) && error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorMessage = error.response.data.message || error.response.statusText;
            } else if (error instanceof Error) {
                // Something else happened while setting up the request that triggered an Error
                errorMessage = error.message;
            }
            return rejectWithValue(errorMessage); // This will be the `payload` of the `rejected` action
        }
    }
);

// 5. Create the authentication slice
export const authSlice = createSlice({
    name: 'auth', // Name of the slice
    initialState,
    reducers: {
        // Synchronous reducers go here
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        },
        // Action to initialize state from localStorage on app load
        initializeAuth: (state) => {
            const token = localStorage.getItem('authToken');
            const user = localStorage.getItem('authUser');
            if (token && user) {
                try {
                    state.token = token;
                    state.user = JSON.parse(user);
                    state.isAuthenticated = true;
                } catch (e) {
                    // Handle corrupted data in localStorage
                    console.error("Failed to parse user data from localStorage", e);
                    state.isAuthenticated = false;
                    state.user = null;
                    state.token = null;
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authUser');
                }
            }
        },
    },
    // 6. Handle async thunk actions with extraReducers
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ token: string; user: any }>) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action: PayloadAction<any>) => { // 'any' for the rejected value
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.payload || 'Login failed.';
            });
    },
});

// Export the actions
export const { logout, initializeAuth } = authSlice.actions;

// Export the reducer
export default authSlice.reducer;