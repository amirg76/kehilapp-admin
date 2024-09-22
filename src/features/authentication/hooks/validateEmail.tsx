/**
 * Validates an email address.
 *
 * @param {string} value - The email address to validate.
 * @return {string} An error message if the email is invalid, otherwise an empty string.
 */
const validateEmail = (value) => {
  if (!value || !value.length) return "שדה חובה";
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value))
    return "כתובת המייל אינה תקינה";
  return "";
};
export default validateEmail;
