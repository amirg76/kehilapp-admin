import { handleRequest } from "@/services/handleRequest";
import { USERS_URL } from "@/api/apiConstants";
import { useState } from "react";
import moment from "moment";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  // Add other user properties as needed
}
const formatUserDates = (users: User[]): User[] => {
  return users.map((user) => ({
    ...user,
    createdAt: moment(user.createdAt).format("DD.MM.YYYY"),
  }));
};
export const getUsersFromDb = () => {
  const [users, setUsers] = useState<User[]>([]);
  const onGetUsersSuccess = (data: User[]): void => {
    // const status = data?.error?.status;

    // if (status !== undefined) {
    //   updateErrorMessage(status, setErrorMessage);
    const formattedUsers = formatUserDates(data);
    console.log(formattedUsers);
    setUsers(formattedUsers);

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
