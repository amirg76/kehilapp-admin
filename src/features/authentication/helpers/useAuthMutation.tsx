import { AuthError, BackendResponse, ValidationError } from "@/types/auth.type";
import { useCustomMutation } from "@services/useMutationService";
import { authActions } from "@store/slices/authSlice";
import { DASHBOARD } from "@routes/routeConstants";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LOGIN_URL } from "@/api/apiConstants";
import { getAuthErrorMessage } from "@/utils/getAuthErrorMessage";
interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthMutation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useCustomMutation<BackendResponse, LoginCredentials, AuthError>({
    url: LOGIN_URL,
    method: "post",
    onSuccessCallback: (response) => {
      if (!response.success) {
        const validationErrors = response.error?.validationErrors?.map(
          (error: ValidationError) => ({
            field: error.field || "general", // Default to 'general' if field is missing
            message: error.message || "Unknown validation error", // Default message
          })
        );

        const error: AuthError = {
          message: getAuthErrorMessage(response.error?.status || 500),
          status: response.error?.status || 500,
          validationErrors: validationErrors,
        };
        throw error;
      }

      if (response.data) {
        sessionStorage.setItem("loggedInUser", JSON.stringify(response));
        dispatch(authActions.login(response));
        navigate(DASHBOARD);
      }
    },
    onErrorCallback: (error) => {
      console.error("Authentication error:", {
        status: error.status,
        message: error.message,
        validationErrors: error.validationErrors,
      });
    },
  });
};
