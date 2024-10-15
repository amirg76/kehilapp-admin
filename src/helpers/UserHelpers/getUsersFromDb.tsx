import { handleRequest } from "@/services/handleRequest";
import { USERS_URL } from "@/api/apiConstants";
import moment from "moment";
import { useDispatch } from "react-redux";
import { usersActions } from "@/store/slices/usersSlice";

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
  const dispatch = useDispatch();
  const onGetUsersSuccess = (data: User[]): void => {
    // const status = data?.error?.status;

    // if (status !== undefined) {
    //   updateErrorMessage(status, setErrorMessage);
    if (data.length > 0) {
      const formattedUsers = formatUserDates(data);
      console.log(formattedUsers);
      dispatch(usersActions.setUsers(formattedUsers));
    }
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
    handleGetUsers,
    ...getUsersHandler,
  };
};
