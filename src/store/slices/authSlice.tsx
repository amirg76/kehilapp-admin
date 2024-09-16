import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { currentUser: null, isAuthenticated: false },
  reducers: {
    login: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
    register: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
  },
});

export const authReducer = authSlice.reducer;
export const authActions = authSlice.actions;

export default authSlice;
