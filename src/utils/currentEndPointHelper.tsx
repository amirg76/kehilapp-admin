export const currentEndPointHelper = () => {
  // Get the current URL
  const currentUrl = window.location.href;

  // Extract the pathname from the URL
  const pathname = new URL(currentUrl).pathname;

  // Remove the leading '/' character
  const endpoint = pathname.slice(1);

  // If there are additional parameters, remove them
  const endpointWithoutParams = endpoint.split("/")[0];

  return endpointWithoutParams;
};
