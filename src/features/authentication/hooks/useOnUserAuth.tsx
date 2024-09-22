import { MESSAGES } from "@routes/routeConstants";
import { useDispatch } from "react-redux";
// redux
import { authActions } from "@store/slices/authSlice";
import { useCallback } from "react";
export const useOnUserAuth = ({ type, user }) => {
  const dispatch = useDispatch();
  const handleAuth = useCallback(
    (type, user) => {
      if (type === "register") {
        // Set user information in session storage
        sessionStorage.setItem("loggedInUser", JSON.stringify(user));
        dispatch(authActions.register(user));
      } else {
        dispatch(authActions.login(user));
      }
      navigate(MESSAGES);
    },
    [type, user]
  );
  //   console.log(user);
  //   // Set user information in session storage
  //   sessionStorage.setItem("loggedInUser", JSON.stringify(user));
  //   // Dispatch the register action with user information
  //   dispatch(
  //     type === "register" ? authActions.register(user) : authActions.login(user)
  //   );
  //   // Navigate to main page
  //   navigate(MESSAGES);
};
