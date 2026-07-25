/**
 * Normalizes API error responses into a human-readable message string.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Unable to send the password reset email."
): string {
  const responseData = (error as any)?.response?.data;

  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.error === "string") {
    return responseData.error;
  }

  if (Array.isArray(responseData?.email)) {
    return responseData.email[0];
  }

  if (Array.isArray(responseData?.errors?.email)) {
    return responseData.errors.email[0];
  }

  if (Array.isArray(responseData?.non_field_errors)) {
    return responseData.non_field_errors[0];
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  return fallback;
}
