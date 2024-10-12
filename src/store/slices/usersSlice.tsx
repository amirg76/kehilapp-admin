import { createSlice } from "@reduxjs/toolkit";

const usersSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
  },
  reducers: {
    setUsers(state, action) {
      state.users = action.payload;
    },
    refreshUsers(state) {
      state.users = []; // refresh users data
    },
  },
});

export const usersReducer = usersSlice.reducer;
export const usersActions = usersSlice.actions;

export default usersSlice;
