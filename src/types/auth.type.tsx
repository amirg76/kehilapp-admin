export interface ValidationError {
  field: string;
  message: string;
}
export interface ErrorResponse {
  status: number;
  message: string;
  validationErrors?: ValidationError[]; // Changed from string[] to ValidationError[]
}
export interface AuthError {
  message: string;
  status: number;
  validationErrors?: ValidationError[];
}

export interface FormErrors {
  email: string | null;
  password: string | null;
  general?: string[];
}
export interface BackendResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      // ... other user properties
    };
  };
  error?: ErrorResponse;
}
