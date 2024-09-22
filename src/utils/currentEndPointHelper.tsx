// export const currentEndPointHelper = () => {
//   // Get the current URL
//   const currentUrl = window.location.href;

//   // Extract the pathname from the URL
//   const pathname = new URL(currentUrl).pathname;

//   // Remove the leading '/' character
//   const endpoint = pathname.slice(1);

//   // If there are additional parameters, remove them
//   const endpointWithoutParams = endpoint.split("/")[0];

//   console.log(endpointWithoutParams);

//   // If the endpoint is 'login', return an empty string
//   return endpointWithoutParams === "login" ? "" : endpointWithoutParams;
//   // return endpointWithoutParams;
// };
export const currentEndPointHelper = () => {
  // Get the current URL
  const currentUrl = window.location.href;

  // Extract the hostname and port
  const { hostname, port } = new URL(currentUrl);

  // Construct the base URL
  const baseUrl = `${window.location.protocol}//${hostname}${
    port ? `:${port}` : ""
  }`;

  return baseUrl;
};
