export const getToken = () => {
  const loggedInUser = sessionStorage.getItem("loggedInUser");
  if (loggedInUser) {
    const userData = JSON.parse(loggedInUser);
    // Now you can access the data as a JavaScript object
    console.log(userData);
  }
  return;
};
