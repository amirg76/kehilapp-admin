import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpService } from "./httpService";

type HttpMethod = "post" | "put" | "delete";

interface MutationConfig<TData, TVariables> {
  url: string;
  method?: HttpMethod;
  queryKeysToInvalidate?: string[];
  onSuccessCallback?: (data: TData) => void;
  onErrorCallback?: (error: Error) => void;
}

export function useCustomMutation<TData = unknown, TVariables = unknown>({
  url,
  method = "post",
  queryKeysToInvalidate = [],
  onSuccessCallback,
  onErrorCallback,
}: MutationConfig<TData, TVariables>) {
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
    onError: (error: Error) => {
      // Call custom error callback if provided
      if (onErrorCallback) {
        onErrorCallback(error);
      }
    },
  });
}
