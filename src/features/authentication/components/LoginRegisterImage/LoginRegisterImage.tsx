import React from "react";
import "./LoginRegisterImage.scss";
// import leftImg from "../../img/image1.png";
interface LoginRegisterImageProps {
  img: string;
}
const LoginRegisterImage: React.FC<LoginRegisterImageProps> = ({ img }) => {
  {
    /* Image on the Left */
  }
  return (
    <div
      className="bg-image"
      style={{ "--img-url": `url(${img})` } as any}
    ></div>
  );
};

export default LoginRegisterImage;
