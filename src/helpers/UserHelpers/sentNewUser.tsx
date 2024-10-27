import { ADD_USER_URL } from "@/api/apiConstants";
import { useCustomMutation } from "@/services/useMutationService";

export interface User {
  id?: string;
  name: string;
  email: string;
  // ... other user properties
}
// Specific mutation hooks using the generic hook
export const useAddUser = () => {
  return useCustomMutation<User, Partial<User>>({
    url: ADD_USER_URL,
    queryKeysToInvalidate: ["users"],
  });
};
