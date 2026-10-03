export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) return 'Could not reach the server. Check your connection and try again.'
  const status = error.response.status
  const message = error.response.data?.message

  if (status === 401) return message || 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return message || 'This item could not be found.'
  if (status === 409) return message || 'This change conflicts with an existing record.'
  if (status === 422 || status === 400) return message || 'Please check the submitted fields.'
  if (status >= 500) return 'The server could not complete that request. Try again shortly.'
  return message || fallback
}

export function getFieldErrors(error) {
  return error?.response?.data?.errors || {}
}