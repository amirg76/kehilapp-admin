//smart component

import leftImg from "@features/authentication/components/img/image1.png";
import LoginRegisterImage from "@features/authentication/components/LoginRegisterImage";
import AuthForm from "@features/authentication/components/AuthForm";
import "./login.scss";
const Login: React.FC = () => {
  return (
    <>
      <div className="flex-container rtl">
        <AuthForm />
        <LoginRegisterImage img={leftImg} />
      </div>
    </>
  );
};

export default Login;
