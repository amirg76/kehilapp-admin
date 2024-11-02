export type ValidationRule = {
  validate: (value: any) => boolean;
  message: string;
};

export type FieldValidationRules = {
  [key: string]: ValidationRule[];
};

export type ValidationErrors = {
  [key: string]: string;
};
