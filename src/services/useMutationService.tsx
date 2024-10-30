import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpService } from "./httpService";

type HttpMethod = "post" | "put" | "delete";

interface AuthError {
  message: string;
  // ... other properties
}

interface MutationConfig<TData, TVariables, TError = AuthError> {
  url: string;
  method?: HttpMethod;
  queryKeysToInvalidate?: string[];
  onSuccessCallback?: (data: TData) => void;
  onErrorCallback?: (error: TError) => void;
}

export function useCustomMutation<
  TData = unknown,
  TVariables = unknown,
  TError = AuthError
>({
  url,
  method = "post",
  queryKeysToInvalidate = [],
  onSuccessCallback,
  onErrorCallback,
}: MutationConfig<TData, TVariables, TError>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      return httpService[method](url, variables) as Promise<TData>;
    },
    onSuccess: (data) => {
      // Invalidate specified queries
      queryKeysToInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Call custom success callback if provided
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
    onError: (error: TError) => {
      // Call custom error callback if provided
      if (onErrorCallback) {
        onErrorCallback(error);
      }
    },
  });
}
