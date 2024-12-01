import { useEffect, FC } from "react";

import { ValidationError, AuthFormProps } from "@/types/auth.type";
import { useFormValidation } from "@/validation/useFormValidation";
import logoKisufim from "../img/logo-kibbuttz-transpert.png";
import InputCmp from "@/components/form/InputCmp";
import ButtonCmp from "@/components/form/ButtonCmp";
import ErrorMessage from "@/components/ui/ErrorMessage";

import Spinner from "@/components/ui/Spinner/Spinner";

import "./authForm.scss";

import { useAuthMutation } from "../../helpers/useAuthMutation";
// Define the structure of the data returned by your mutation

const AuthForm: FC<AuthFormProps> = (
  {
    // formTitle,
    // formSubtitle,
    // buttonLabel,
    // onSubmit,
    // isLoading = false,
    // loginError,
  }
) => {
  const {
    mutate: login,
    isLoading,
    error: loginError,
    reset: resetLoginError,
  } = useAuthMutation();

  const onSubmit = async () => {
    // Your existing submit logic here
    // login({
    //   email: "sss@",
    //   password: "1234567",
    // });
    login(formData);
  };

  // Get validation errors from backend if they exist
  const getFieldError = (fieldName: "email" | "password"): string => {
    const backendError = loginError?.validationErrors?.find(
      (error: ValidationError) => error.field === fieldName
    );

    console.log("backendError:", backendError);

    // Convert null to undefined and ensure string type
    const formError = errors[fieldName];
    console.log("formError:", formError);

    return (
      (formError !== undefined && formError) || backendError?.message || ""
    );
  };

  const formTitle = "כניסה לאתר";
  const formSubtitle = "התחבר לחשבון שלך";
  const buttonLabel = "כניסה";

  const {
    formData, // Use formData instead of userCredentials
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormValidation({
    email: "",
    password: "",
  });
  const isButtonDisabled =
    isSubmitting || !formData.email || !formData.password;
  // useEffect(() => {
  //   useButtonDisabled(setIsButtonDisabled, formErrors);
  // }, [formErrors]);

  // Reset login error when user starts typing
  useEffect(() => {
    if (loginError) {
      resetLoginError();
    }
  }, [formData]);
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
            type="email"
            value={formData.email}
            onChange={handleChange}
            // onBlur={validateForm}
            onBlur={handleBlur}
            inputStyle="py-3"
            containerstyle="input-container"
            labelStyle="input-label"
          />

          <ErrorMessage msg={getFieldError("email")} />
          {/* <ErrorMessage msg={errors.email} /> */}

          <InputCmp
            label="סיסמא"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            // onBlur={validateForm}
            onBlur={handleBlur}
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
            // onClick={handleSubmit}
            onClick={(e: React.FormEvent) => handleSubmit(e, onSubmit)}
            style="button-container"
          />
        </form>
      </div>
    </>
  );
};

export default AuthForm;
