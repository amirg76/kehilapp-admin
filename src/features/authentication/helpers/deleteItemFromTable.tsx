import { handleRequest } from "@/services/handleRequest";
import { DELETE_TABALE_ITEM_URL } from "@/api/apiConstants";

export const deleteItemFromTable = () => {
  const onDeleteItemSuccess = (data: { error: { status: any } }) => {
    // const status = data?.error?.status;
    console.log("onDeleteItemSuccess");
    // if (status !== undefined) {
    //   updateErrorMessage(status, setErrorMessage);

    //   return;
    // }
    console.log(data);
  };

  const deleteItemHandler = handleRequest({
    url: DELETE_TABALE_ITEM_URL,
    method: "post",
    handleSuccessCallback: onDeleteItemSuccess,
    // onLoginError
  });

  const handleDeleteItem = (id: string) => {
    deleteItemHandler.mutate({ id });
  };

  return {
    handleDeleteItem,
    ...deleteItemHandler,
  };
};
