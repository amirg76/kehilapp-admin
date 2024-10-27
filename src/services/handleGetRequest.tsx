import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpService } from "./httpService";
import { USERS_URL, DELETE_TABALE_ITEM_URL } from "@/api/apiConstants";
// Query hook for fetching users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await httpService.get(USERS_URL, null);

      if (!response || !response.data) {
        throw new Error("Failed to fetch users data.");
      }

      return response.data;
    },
    // Enable automatic fetching when component mounts
    enabled: true,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });
}

// Mutation hook for deleting users
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      httpService.delete(DELETE_TABALE_ITEM_URL, { id }),
    onSuccess: () => {
      // Invalidate and refetch users query after successful deletion
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
