import "./errorMessage.scss";
interface ErrorMessageProps {
  msg: string;
  style?: string;
}
const ErrorMessage = ({ msg, style = "" }: ErrorMessageProps) => (
  <div className={`error-message ${style}`}>{msg && <span>{msg}</span>}</div>
);

export default ErrorMessage;
