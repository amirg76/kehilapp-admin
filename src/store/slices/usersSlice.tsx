import { createSlice } from "@reduxjs/toolkit";

const usersSlice = createSlice({
  name: "users",
  initialState: {
    usersData: [],
  },
  reducers: {
    setUsers(state, action) {
      state.usersData = action.payload;
    },
    refreshUsers(state) {
      state.usersData = []; // refresh users data
    },
  },
});

export const usersReducer = usersSlice.reducer;
export const usersActions = usersSlice.actions;

export default usersSlice;
