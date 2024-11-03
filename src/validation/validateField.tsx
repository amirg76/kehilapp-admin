import { ValidationRule } from "./types";
import { FIELD_VALIDATORS } from "./fieldValidators";

export const validateField = (
  fieldName: string,
  value: any,
  customRules?: ValidationRule[]
): string => {
  const rules =
    customRules || FIELD_VALIDATORS[fieldName as keyof typeof FIELD_VALIDATORS];

  if (!rules) return "";

  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }

  return "";
};
