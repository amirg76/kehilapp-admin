import { authActions } from "@store/slices/authSlice";

import { DASHBOARD } from "@routes/routeConstants";
import { updateErrorMessage } from "@features/authentication/helpers/authErrors";

// Define the structure of the data returned by your mutation
export interface AuthSuccessProps {
  data: {
    error?: {
      status: number;
    };
  };
  setErrorMessage: (errorMessage: string) => void;
  dispatch: (action: { type: string; payload: unknown }) => void;
  navigate: (to: string) => void;
  type: string;
}

export const handleSuccess = ({
  data,
  setErrorMessage,
  dispatch,
  navigate,
  type,
}: AuthSuccessProps) => {
  const status = data?.error?.status;

  const handleAuthError = (status: number) => {
    updateErrorMessage(status, setErrorMessage);
  };

  const handleNormalResponse = () => {
    sessionStorage.setItem("loggedInUser", JSON.stringify(data));
    dispatch(authActions[type as keyof typeof authActions](data));

    navigate(DASHBOARD);
  };

  if (status === 404 || status === 401 || status === 409) {
    handleAuthError(status);
  } else {
    handleNormalResponse();
  }
};
