declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export const MAPS_ERROR_PARAM = "mapsError";

let authFailureHandlerInstalled = false;

export const handleMapsError = () => {
  if (typeof window === "undefined") return;
  window.location.href = `/?${MAPS_ERROR_PARAM}=1`;
};

// Google Maps calls window.gm_authFailure instead of rejecting the load
// promise when the API key is invalid, unbilled, or restricted, so it needs
// its own handler wired up before the script loads.
export const installMapsAuthFailureHandler = () => {
  if (typeof window === "undefined" || authFailureHandlerInstalled) return;
  authFailureHandlerInstalled = true;
  window.gm_authFailure = handleMapsError;
};
