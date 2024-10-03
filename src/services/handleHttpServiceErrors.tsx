interface ErrorResponse {
  isError: boolean;
  status: number;
  message: string;
}
export const handleHttpServiceErrors = (err: unknown): ErrorResponse => {
  if (err && typeof err === "object" && "error" in err) {
    const errorObj = err as { error: { status?: number; message?: string } };
    return {
      isError: true,
      status: errorObj.error.status ?? 500,
      message: errorObj.error.message ?? "An unknown error occurred",
    };
  }

  if (err instanceof Error) {
    return {
      isError: true,
      status: 500,
      message: err.message,
    };
  }

  return {
    isError: true,
    status: 500,
    message: "An unknown error occurred",
  };
};
