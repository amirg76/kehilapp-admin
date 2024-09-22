import "./spinner.scss";

interface SpinnerProps {
  style?: string;
}

const Spinner = ({ style }: SpinnerProps) => {
  return <div className={`spinner ${style}`} role="status"></div>;
};

export default Spinner;
