/**
 * Validates a password.
 *
 * @param {string} value - The password to validate.
 * @return {string} An error message if the password is invalid, otherwise an empty string.
 */
const validatePassword = (value) => {
  if (!value || !value.length) return "שדה חובה";
  if (!/^.{8,20}$/.test(value))
    return "הסיסמא צריכה להיות באורך של 8 תווים לפחות";
  // OPTIONAL: uncomment the following line to enable additional password validation
  // if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*\s).{8,20}$/.test(value)) return "הסיסמא צריכה להכיל לפחות מספר אחד, אות גדולה אחת ואות קטנה אחת";
  return "";
};

export default validatePassword;
