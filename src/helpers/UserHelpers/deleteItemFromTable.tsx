// import { useDeleteUser } from "@/services/handleGetRequest";

import { DELETE_TABLE_ITEM_URL } from "@/api/apiConstants";
import { useCustomMutation } from "@/services/useMutationService";
export interface DeleteParams {
  id: string;
}
// export const deleteItemFromTable = () => {
//   const deleteUser = useDeleteUser();

//   const handleDeleteItem = async (id: string) => {
//     try {
//       await deleteUser.mutateAsync(id);
//     } catch (error) {
//       console.error("Failed to delete user:", error);
//       // Handle error appropriately
//     }
//   };

//   return { handleDeleteItem };
// };

export const useDeleteUser = () => {
  return useCustomMutation<void, DeleteParams>({
    url: DELETE_TABLE_ITEM_URL,
    method: "delete",
    queryKeysToInvalidate: ["users"],
  });
};
