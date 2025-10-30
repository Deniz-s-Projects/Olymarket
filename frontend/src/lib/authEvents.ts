const unauthorizedListeners = new Set<() => void>()

export const subscribeToUnauthorized = (listener: () => void) => {
  unauthorizedListeners.add(listener)
}

export const unsubscribeFromUnauthorized = (listener: () => void) => {
  unauthorizedListeners.delete(listener)
}

export const emitUnauthorized = () => {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener()
    } catch (error) {
      console.error('Error handling unauthorized listener', error)
    }
  })
}
