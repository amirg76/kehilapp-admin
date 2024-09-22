import { authActions } from "@store/slices/authSlice";
import { useDispatch } from "react-redux";
import { DASHBOARD } from "@routes/routeConstants";
import { updateErrorMessage } from "@features/authentication/helpers/authErrors";

/**
 * Handles the success response from the server.
 *
 * @param {Object} data - The data object containing information about the success response.
 * @param {Function} setErrorMessage - The function to update the error message.
 
 * @param {Function} navigate - The navigate function.
 * @param {String} type - The type of authentication.
 * @return {void}
 */
export interface AuthSuccessProps {
  data: {
    error?: {
      status: number;
    };
  };
  setErrorMessage: (errorMessage: string) => void;
  // dispatch: (action: { type: string; payload: unknown }) => void;
  navigate: (to: string) => void;
  type: string;
}

export const handleSuccess = ({
  data,
  setErrorMessage,

  navigate,
  type,
}: AuthSuccessProps) => {
  const dispatch = useDispatch();
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
