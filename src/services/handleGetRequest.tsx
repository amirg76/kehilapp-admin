import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpService } from "./httpService";
import { USERS_URL } from "@/api/apiConstants";
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
