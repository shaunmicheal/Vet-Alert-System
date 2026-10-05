// Turns any API failure into a single friendly, human-readable message.
// The backend already sanitises its messages (no stack traces, no Prisma codes),
// so we prefer its message and fall back to a status-based one.
const STATUS_MESSAGES = {
  400: 'Please check the details you entered and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'We could not find what you were looking for.',
  409: 'That conflicts with something that already exists. Please refresh and try again.',
  422: 'Please check the details you entered and try again.',
  500: 'Something went wrong on our side. Please try again.',
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE =
  'Unable to reach the server. Please check your internet connection and try again.'

export const getApiErrorMessage = (error) => {
  const response = error && error.response

  // No response at all - offline, DNS failure or timeout.
  if (!response) return NETWORK_MESSAGE

  const serverMessage = typeof response.data?.message === 'string' ? response.data.message.trim() : ''
  if (serverMessage) return serverMessage

  return STATUS_MESSAGES[response.status] || GENERIC_MESSAGE
}