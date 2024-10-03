import { useMutation } from "react-query";
import { httpService } from "./httpService";
import { getToken } from "./getToken";
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface HandleRequestOptions<TData, TVariables> {
  url: string;
  method: HttpMethod;
  handleSuccessCallback: (data: TData) => void | Promise<unknown>;
  // handleErrorCallback?: (error: any) => void;
}
export const handleRequest = <TData = any, TVariables = any>({
  url,
  method,
  handleSuccessCallback,
}: HandleRequestOptions<TData, TVariables>) => {
  const {
    mutate,
    isLoading,
    isError,
    error: authError,
  } = useMutation({
    mutationFn: (variables: TVariables) => httpService[method](url, variables),
    //   const headers = isProtected
    //     ? { Authorization: `Bearer ${getToken()}` }
    //     : {};

    //   if (method.toLowerCase() === "get") {
    //     return httpService.get(url, { headers, params: variables });
    //   } else {
    //     return httpService[method.toLowerCase()](url, variables, { headers });
    //   }
    // },
    onSuccess: (data) => handleSuccessCallback(data),
    onError: (err) => {
      console.log(err);
      // updateErrorMessage(err, setErrorMessage);
    },
  });

  return { mutate, isLoading, isError, authError };
};
