import { useEffect, useState } from "react";

import logoKisufim from "../img/logo-kibbuttz-transpert.png";
import InputCmp from "@/components/form/InputCmp";
import ButtonCmp from "@/components/form/ButtonCmp";
import ErrorMessage from "@/components/ui/ErrorMessage";

import Spinner from "@/components/ui/Spinner/Spinner";

import validateEmail from "../../hooks/validateEmail";
import validatePassword from "../../hooks/validatePassword";
import useButtonDisabled from "../../hooks/useButtonDisabled";

import "./authForm.scss";

import { useLogin } from "../../helpers/useLogin";
// Define the structure of the data returned by your mutation

const AuthForm = () => {
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
    handleLogin(userCredentials);
  };

  const { handleLogin, isLoading } = useLogin(setErrorMessage);
  const formTitle = "כניסה לאתר";
  const formSubtitle = "התחבר לחשבון שלך";
  const buttonLabel = "כניסה";

  return (
    <>
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
