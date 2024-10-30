import { useEffect, useState } from "react";
import { ValidationError, FormErrors } from "@/types/auth.type";
import logoKisufim from "../img/logo-kibbuttz-transpert.png";
import InputCmp from "@/components/form/InputCmp";
import ButtonCmp from "@/components/form/ButtonCmp";
import ErrorMessage from "@/components/ui/ErrorMessage";

import Spinner from "@/components/ui/Spinner/Spinner";

import validateEmail from "../../hooks/validateEmail";
import validatePassword from "../../hooks/validatePassword";
import useButtonDisabled from "../../hooks/useButtonDisabled";

import "./authForm.scss";

import { useAuthMutation } from "../../helpers/useAuthMutation";
// Define the structure of the data returned by your mutation

const AuthForm = () => {
  const [userCredentials, setUserCredentials] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: null,
    password: null,
  });
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const {
    mutate: login,
    isLoading,
    error: loginError,
    reset: resetLoginError,
  } = useAuthMutation();

  useEffect(() => {
    useButtonDisabled(setIsButtonDisabled, formErrors);
  }, [formErrors]);

  // Reset login error when user starts typing
  useEffect(() => {
    if (loginError) {
      resetLoginError();
    }
  }, [userCredentials]);
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
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: errorMessages[name as keyof typeof errorMessages],
    }));
  };

  const handleSubmit = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    // login({
    //   email: "sss",
    //   password: "12345678",
    // });
    login(userCredentials);
  };

  // Get validation errors from backend if they exist
  const getFieldError = (
    fieldName: "email" | "password"
  ): string | undefined => {
    const backendError = loginError?.validationErrors?.find(
      (error: ValidationError) => error.field === fieldName
    );

    // Convert null to undefined and ensure string type
    const formError = formErrors[fieldName];
    return (formError || backendError?.message || undefined) as
      | string
      | undefined;
  };

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

          <ErrorMessage msg={getFieldError("email")} />

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

          <ErrorMessage msg={getFieldError("password")} />

          {/* Global error message */}

          {loginError && !loginError.validationErrors && (
            <ErrorMessage msg={loginError.message} />
          )}

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
