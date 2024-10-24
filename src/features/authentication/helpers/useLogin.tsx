import { authActions } from "@store/slices/authSlice";

import { DASHBOARD } from "@routes/routeConstants";
import { updateErrorMessage } from "@features/authentication/helpers/updateErrorMessage";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { handleRequest } from "@/services/handleRequest";
import { LOGIN_URL } from "@/api/apiConstants";
import { Dispatch, SetStateAction } from "react";

export const useLogin = (setErrorMessage: Dispatch<SetStateAction<string>>) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLoginSuccess = (data: { error: { status: any } }) => {
    const status = data?.error?.status;
    console.log(status);
    if (status !== undefined) {
      updateErrorMessage(status, setErrorMessage);

      return;
    }
    sessionStorage.setItem("loggedInUser", JSON.stringify(data));
    dispatch(authActions.login(data));
    navigate(DASHBOARD);
  };

  const loginHandler = handleRequest({
    url: LOGIN_URL,
    method: "post",
    handleSuccessCallback: onLoginSuccess,
    // onLoginError
  });

  const handleLogin = (userCredentials: {
    email: string;
    password: string;
  }) => {
    loginHandler.mutateAsync(userCredentials);
  };

  return { handleLogin, ...loginHandler };
};
