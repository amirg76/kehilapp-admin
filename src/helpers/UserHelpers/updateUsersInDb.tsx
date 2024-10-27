import { UPDATE_TABLE_ITEM_URL } from "@/api/apiConstants";
import { useCustomMutation } from "@/services/useMutationService";

export interface User {
  id?: string;
  name: string;
  email: string;
  // ... other user properties
}
interface UpdateUserData {
  id: string;
  updateData: Partial<User>;
}
export const useUpdateUser = () => {
  return useCustomMutation<UpdateUserData>({
    url: UPDATE_TABLE_ITEM_URL,
    method: "post",
    queryKeysToInvalidate: ["users"],
  });
};
