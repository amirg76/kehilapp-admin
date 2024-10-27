// import { handleRequest } from "@/services/handleRequest";
// import { DELETE_TABALE_ITEM_URL } from "@/api/apiConstants";

// export const deleteItemFromTable = () => {
//   const onDeleteItemSuccess = (data: { error: { status: any } }) => {
//     // const status = data?.error?.status;
//     console.log("onDeleteItemSuccess");
//     // if (status !== undefined) {
//     //   updateErrorMessage(status, setErrorMessage);

//     //   return;
//     // }
//     console.log(data);
//   };

//   const deleteItemHandler = handleRequest({
//     url: DELETE_TABALE_ITEM_URL,
//     method: "post",
//     handleSuccessCallback: onDeleteItemSuccess,
//     // onLoginError
//   });

//   const handleDeleteItem = (id: string) => {
//     deleteItemHandler.mutateAsync({ id });
//   };

//   return {
//     handleDeleteItem,
//     ...deleteItemHandler,
//   };
// };

import { useDeleteUser } from "@/services/handleGetRequest";

export const deleteItemFromTable = () => {
  const deleteUser = useDeleteUser();

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete user:", error);
      // Handle error appropriately
    }
  };

  return { handleDeleteItem, isDeleting: deleteUser.isLoading };
};
