import { SetStateAction } from "react";

export const updateErrorMessage = (
  errStatus: number,
  setErrorMessage: {
    (value: SetStateAction<string>): void;
    (arg0: string): void;
  }
) => {
  if (errStatus) {
    if (errStatus === 403) setErrorMessage("שם המשתמש אינו מנהל מערכת");
    else if (errStatus === 404) setErrorMessage("משתמש לא קיים במערכת");
    else if (errStatus === 409) setErrorMessage("משתמש זה כבר קיים במערכת");
    else if (errStatus === 401) setErrorMessage("סיסמא לא נכונה, נסה שוב");
  } else setErrorMessage("לא ניתן להתחבר, נסה שוב מאוחר יותר");
};
