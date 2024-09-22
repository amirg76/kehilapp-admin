import React, { Children } from "react";
import "./InputCmp.scss";
// Define Props interface for InputCmp
interface InputCmpProps {
  type?: string; // Type of input field
  label: string; // The label for the input field
  name: string; // Name of the input field, used for form control
  value: string; // Current value of the input field
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Event handler for onChange
  placeholder?: string; // Placeholder text for the input field
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void; // Event handler for onBlur (validation)
  inputStyle?: string; // Optional: Additional styles for the input field
  containerstyle?: string; // Optional: Styles for the container
  onContainerClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  labelStyle?: string; // Optional: Styles for the label
  maxLength?: number; // Optional: Maximum length of the input field
  children?: React.ReactNode; // Optional: Additional content to display next to the input field
}
const InputCmp: React.FC<InputCmpProps> = ({
  type = "text",
  label,
  labelStyle,
  name,
  value,
  onChange,
  placeholder,
  onBlur,
  inputStyle,
  maxLength,
  children,
  ...otherProps
}) => {
  const { containerstyle, onContainerClick } = otherProps;

  return (
    <div className={containerstyle} onClick={onContainerClick}>
      {label && (
        <label htmlFor={name} className={labelStyle}>
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="inputCmp-container"
        onBlur={onBlur}
        maxLength={maxLength}
        {...otherProps}
      />
      {children}
    </div>
  );
};

export default InputCmp;
