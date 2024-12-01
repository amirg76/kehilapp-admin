import React from "react";
import { ValidationErrors, FieldValidationRules } from "./types";
import { validateField } from "./validateField";
import { FIELD_VALIDATORS } from "./fieldValidators";

// Form validation hook
export const useFormValidation = (
  initialValues: any,
  validationRules?: FieldValidationRules
) => {
  const [formData, setFormData] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (fieldName?: string, fieldValue?: any): boolean => {
    if (fieldName && fieldValue !== undefined) {
      // Single field validation
      const rules =
        validationRules?.[fieldName] ||
        FIELD_VALIDATORS[fieldName as keyof typeof FIELD_VALIDATORS];
      const error = validateField(fieldName, fieldValue, rules);

      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));

      return !error;
    } else {
      // Full form validation
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.keys(formData).forEach((key) => {
        const rules =
          validationRules?.[key] ||
          FIELD_VALIDATORS[key as keyof typeof FIELD_VALIDATORS];
        if (rules) {
          const error = validateField(key, formData[key], rules);
          if (error) {
            isValid = false;
            newErrors[key] = error;
          }
        }
      });

      setErrors(newErrors);
      return isValid;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    validateForm(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    validateForm(name, value);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit: (data: any) => Promise<void>
  ) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    }

    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    setFormData,
    setErrors,
  };
};
