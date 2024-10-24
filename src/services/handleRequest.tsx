import { useMutation } from "react-query";
import { httpService } from "./httpService";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status: number;
  };
}
interface HandleRequestOptions<TData> {
  url: string;
  method: HttpMethod;
  handleSuccessCallback: (data: TData) => void | Promise<unknown>;
  // handleErrorCallback?: (error: any) => void;
}
export const handleRequest = <TData = any, TVariables = any>({
  url,
  method,
  handleSuccessCallback,
}: HandleRequestOptions<TData>) => {
  const {
    mutateAsync,
    isLoading,
    isError,
    error: authError,
  } = useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: (variables: TVariables) => httpService[method](url, variables),
    onSuccess: (data) => handleSuccessCallback(data),
    onError: (err) => {
      console.log(err);
      // updateErrorMessage(err, setErrorMessage);
    },
  });

  return { mutateAsync, isLoading, isError, authError };
};
