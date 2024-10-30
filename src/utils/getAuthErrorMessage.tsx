export const getAuthErrorMessage = (status: number): string => {
  const errorMessages: Record<number, string> = {
    403: "שם המשתמש אינו מנהל מערכת",
    404: "משתמש לא קיים במערכת",
    409: "משתמש זה כבר קיים במערכת",
    401: "סיסמא לא נכונה, נסה שוב",
  };

  return errorMessages[status] || "לא ניתן להתחבר, נסה שוב מאוחר יותר";
};
