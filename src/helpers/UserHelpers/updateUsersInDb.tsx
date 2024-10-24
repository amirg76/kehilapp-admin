import { handleRequest } from "@/services/handleRequest";
import { UPDATE_TABLE_ITEM_URL } from "@/api/apiConstants";
import moment from "moment";
import { useDispatch } from "react-redux";
import { usersActions } from "@/store/slices/usersSlice";

interface User {
  id: number;
  [key: string]: any;
}
interface UpdateUserData {
  id: string;
  updateData: Partial<User>;
}

const formatUserDates = (users: User[]): User[] => {
  return users.map((user) => ({
    ...user,
    createdAt: moment(user.createdAt).format("DD.MM.YYYY"),
  }));
};
export const updateUsersInDb = () => {
  const dispatch = useDispatch();
  const onUpdateUsersSuccess = (data: any): void => {
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
  const updateUsersHandler = handleRequest<User[], UpdateUserData>({
    url: UPDATE_TABLE_ITEM_URL,
    method: "post",
    handleSuccessCallback: onUpdateUsersSuccess,
    // onLoginError
  });

  const handleUpdateUsers = (itemUpdates: { id: string; updateData: {} }) => {
    updateUsersHandler.mutateAsync(itemUpdates);
  };

  return {
    handleUpdateUsers,
    isLoading: updateUsersHandler.isLoading,
    mutateAsync: updateUsersHandler.mutateAsync,
  };
};
