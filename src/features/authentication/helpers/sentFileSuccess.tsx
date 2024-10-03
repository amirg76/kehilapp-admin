import { handleRequest } from "@/services/handleRequest";
import { ADD_MANY_USERS_URL } from "@/api/apiConstants";

export const sentFileSuccess = () => {
  const onSentFileSuccess = (data: { error: { status: any } }) => {
    // const status = data?.error?.status;
    console.log("onSentFileSuccess");
    // if (status !== undefined) {
    //   updateErrorMessage(status, setErrorMessage);

    //   return;
    // }
    console.log(data);
  };

  const sentFileHandler = handleRequest({
    url: ADD_MANY_USERS_URL,
    method: "post",
    handleSuccessCallback: onSentFileSuccess,
    // onLoginError
  });

  const handleSentFile = (file: any) => {
    sentFileHandler.mutate(file);
  };

  return {
    handleSentFile,
    ...sentFileHandler,
  };
};
