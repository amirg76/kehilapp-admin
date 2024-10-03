import { handleRequest } from "@/services/handleRequest";
import { USERS_URL } from "@/api/apiConstants";
import { useState } from "react";

export const getUsersFromDb = () => {
  const [users, setUsers] = useState<any[]>([]);
  const onGetUsersSuccess = (data: any) => {
    // const status = data?.error?.status;

    // if (status !== undefined) {
    //   updateErrorMessage(status, setErrorMessage);
    console.log(data);
    setUsers(data);
    return data;
    // }
  };

  const getUsersHandler = handleRequest({
    url: USERS_URL,
    method: "get",
    handleSuccessCallback: onGetUsersSuccess,
    // onLoginError
  });

  const handleGetUsers = () => {
    getUsersHandler.mutate({});
  };

  return {
    users,
    handleGetUsers,
    ...getUsersHandler,
  };
};
