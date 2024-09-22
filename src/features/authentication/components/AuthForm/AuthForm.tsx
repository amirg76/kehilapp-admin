import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logoKisufim from "../img/logo-kibbuttz-transpert.png";
import InputCmp from "@/components/form/InputCmp";
import ButtonCmp from "@/components/form/ButtonCmp";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { LOGIN_URL, REGISTER_URL } from "@api/apiConstants";
import { httpService } from "@services/httpService";
import { useMutation } from "react-query";
import Spinner from "@/components/ui/Spinner/Spinner";

import validateEmail from "../../hooks/validateEmail";
import validatePassword from "../../hooks/validatePassword";
import useButtonDisabled from "../../hooks/useButtonDisabled";

import { handleSuccess } from "../../helpers/authSuccess";
import { updateErrorMessage } from "../../helpers/authErrors";
import "./authForm.scss";
// Define the structure of the data returned by your mutation
interface SuccessData {
  id: string;
  token: string;
  user: {
    name: string;
    email: string;
  };
}

const AuthForm = ({ type }: { type: string }) => {
  // const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userCredentials, setUserCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState({
    email: null as string | null,
    password: null as string | null,
  });

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    useButtonDisabled(setIsButtonDisabled, error);
  }, [error]);

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    setUserCredentials({ ...userCredentials, [name]: value });
    validateForm(ev);
  };

  const validateForm = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;

    // Ensure TypeScript knows name is either "email" or "password"
    if (name !== "email" && name !== "password") return;
    const errorMessages = {
      email: validateEmail(value),
      password: validatePassword(value),
    };
    setError((prevErrors) => ({ ...prevErrors, [name]: errorMessages[name] }));
  };

  const handleSubmit = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    mutate();
  };

  const handleSuccessCallback = useCallback(
    (data: SuccessData) => {
      handleSuccess({
        data: data as { error?: { status: number } },
        setErrorMessage,

        navigate,
        type,
      });
    },
    [navigate, type, setErrorMessage]
  );

  const {
    mutate,
    isLoading,
    isError,
    error: authError,
  } = useMutation({
    mutationFn: () =>
      httpService.post(
        type === "register" ? REGISTER_URL : LOGIN_URL,
        userCredentials
      ),
    onSuccess: (data: SuccessData) => handleSuccessCallback(data),
    onError: (err) => {
      console.log(err);

      updateErrorMessage(err, setErrorMessage);
    },
  });

  const formTitle = type === "register" ? "הרשמה לאתר" : "כניסה לאתר";
  const formSubtitle =
    type === "register" ? "פתיחת חשבון חדש" : "התחבר לחשבון שלך";
  const buttonLabel = type === "register" ? "תרשמו אותי" : "כניסה";

  return (
    <>
      {/* <div className="flex flex-col justify-center items-center h-[100vh] md:w-1/2">
        <img className="w-[11em] mb-2" src={logoKisufim} alt="Your Company" />
        <form
          className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-lg"
          // onSubmit={handleSubmit}
        >
          <h1 className="mb-3">{formTitle}</h1>
          <h2 className="text-xl font-bold mb-6">{formSubtitle}</h2>

          <InputCmp
            label="אימייל"
            name="email"
            value={userCredentials.email}
            onChange={handleChange}
            onBlur={validateForm}
            inputStyle="py-3"
            containerstyle="flex flex-col"
            labelStyle="relative w-fit bg-white top-[10px] right-[10px] px-2"
          />
          <ErrorMessage msg={error.email} style="h-[20px]  mr-3" />
          <InputCmp
            label="סיסמא"
            type="password"
            name="password"
            value={userCredentials.password}
            onChange={handleChange}
            onBlur={validateForm}
            inputStyle="py-3"
            containerstyle="flex flex-col"
            labelStyle="relative w-fit bg-white top-[10px] right-[10px] px-2"
          />
          <ErrorMessage msg={error.password} style="h-[20px] mb-6 mr-3" />
          <ErrorMessage
            msg={isLoading ? "" : errorMessage}
            style="h-[25px] mr-3 text-center"
          />
          <ButtonCmp
            label={isLoading ? <Spinner style="w-6 h-6" /> : buttonLabel}
            isDisabled={isButtonDisabled}
            onClick={handleSubmit}
            style="w-full py-3 h-[52px]"
          />
        </form>
      </div> */}
      <div className="login-flex-container">
        <img className="w-11 mb-05" src={logoKisufim} alt="Your Company" />
        <form className="form-container rtl">
          <h1 className="form-title">{formTitle}</h1>
          <h2 className="form-subtitle">{formSubtitle}</h2>
          <InputCmp
            label="אימייל"
            name="email"
            value={userCredentials.email}
            onChange={handleChange}
            onBlur={validateForm}
            inputStyle="py-3"
            containerstyle="input-container"
            labelStyle="input-label"
          />
          <ErrorMessage msg={error.email!} style="error-message" />
          <InputCmp
            label="סיסמא"
            type="password"
            name="password"
            value={userCredentials.password}
            onChange={handleChange}
            onBlur={validateForm}
            inputStyle="py-3"
            containerstyle="input-container"
            labelStyle="input-label"
          />
          <ErrorMessage msg={error.password!} style="error-message" />
          <ErrorMessage
            msg={isLoading ? "" : errorMessage}
            style="error-message"
          />
          <ButtonCmp
            label={isLoading ? <Spinner style="spinner" /> : buttonLabel}
            isDisabled={isButtonDisabled}
            onClick={handleSubmit}
            style="button-container"
          />
        </form>
      </div>
    </>
  );
};

export default AuthForm;
