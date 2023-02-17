export const formatFatalError = (message: string) =>
  JSON.stringify({
    errors: [
      {
        type: 'JSONError',
        component: 'solcjs',
        severity: 'error',
        message: message,
        formattedMessage: 'Error: ' + message,
      },
    ],
  })

export const isNil = (value: unknown) => value == null
