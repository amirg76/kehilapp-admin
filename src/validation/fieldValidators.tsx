import { VALIDATION_RULES } from "./rules";
// Predefined field validators
export const FIELD_VALIDATORS = {
  email: [VALIDATION_RULES.required(), VALIDATION_RULES.email()],
  password: [
    VALIDATION_RULES.required(),
    VALIDATION_RULES.minLength(8, "הסיסמא צריכה להיות באורך של 8 תווים לפחות"),
    VALIDATION_RULES.maxLength(20, "הסיסמא יכולה להיות באורך של עד 20 תווים"),
  ],
};
