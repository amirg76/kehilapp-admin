import { handleRequest } from "@/services/handleRequest";
import { ADD_USER_URL } from "@/api/apiConstants";

export const sentNewUser = () => {
  const onSentNewUserSuccess = (data: { error: { status: any } }) => {
    // const status = data?.error?.status;
    console.log("onSentNewUserSuccess");
    // if (status !== undefined) {
    //   updateErrorMessage(status, setErrorMessage);

    //   return;
    // }
    console.log(data);
  };

  const sentNewUserHandler = handleRequest({
    url: ADD_USER_URL,
    method: "post",
    handleSuccessCallback: onSentNewUserSuccess,
    // onLoginError
  });

  const handleSentNewUser = (newUser: Record<string, string | boolean>) => {
    console.log(newUser);

    sentNewUserHandler.mutateAsync(newUser);
  };

  return {
    handleSentNewUser,
    ...sentNewUserHandler,
  };
};
