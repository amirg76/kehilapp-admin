import { ValidationRule } from "./types";
// Validation rules for the form
export const VALIDATION_RULES = {
  required: (message: string = "שדה חובה"): ValidationRule => ({
    validate: (value: any) =>
      value !== undefined &&
      value !== null &&
      value.toString().trim().length > 0,
    message,
  }),

  email: (message: string = "כתובת המייל אינה תקינה"): ValidationRule => ({
    validate: (value: string) =>
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
    message,
  }),

  minLength: (
    length: number,
    message: string = `אורך מינימלי נדרש הוא ${length} תווים`
  ): ValidationRule => ({
    validate: (value: string) => value.length >= length,
    message,
  }),

  maxLength: (
    length: number,
    message: string = `אורך מקסימלי מותר הוא ${length} תווים`
  ): ValidationRule => ({
    validate: (value: string) => value.length <= length,
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  number: (message: string = "חייב להיות מספר"): ValidationRule => ({
    validate: (value: any) =>
      !isNaN(value) && typeof Number(value) === "number",
    message,
  }),
};
