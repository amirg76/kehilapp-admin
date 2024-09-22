import React from "react";
import "./ButtonCmp.scss";
interface ButtonCmpProps {
  label: React.ReactNode | string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isDisabled: boolean;
  style: string;
  [key: string]: any; // Add this to allow for additional props
}

const ButtonCmp: React.FC<ButtonCmpProps> = ({
  label,
  onClick,
  isDisabled,
  style,
  ...otherProps
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`buttonCmp-container 
        ${style} ${isDisabled && "opcity-05"}`}
      {...otherProps}
    >
      {label}
    </button>
  );
};

export default ButtonCmp;
