export interface BaseUrlProps {
  varName: string;
}

const getEnvVariable = ({ varName }: BaseUrlProps) => {
  let value = import.meta.env[varName as keyof ImportMetaEnv];

  if (!value) {
    throw new Error(`${varName} is not defined in .env file`);
  }
  return value;
};

export const getBaseUrl = () => {
  console.log(import.meta.env.MODE);
  if (import.meta.env.MODE === "production") {
    return getEnvVariable({ varName: "VITE_REACT_APP_BASE_URL_DEV" });
  }
  return getEnvVariable({ varName: "VITE_REACT_APP_BASE_URL" });
};
