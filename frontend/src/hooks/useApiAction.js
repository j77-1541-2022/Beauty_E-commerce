import { useCallback, useState } from 'react'
import { useErrorHandler } from '../contexts/ErrorHandlerContext'
import { useNotification } from '../contexts/NotificationContext'

/**
 * Reusable async action helper wired to existing app-wide error/loading/notification systems.
 */
const useApiAction = (key, action, options = {}) => {
  const { handleError, setLoading } = useErrorHandler()
  const { showNotification } = useNotification()
  const [loading, setLocalLoading] = useState(false)

  const run = useCallback(
    async (...args) => {
      setLocalLoading(true)
      setLoading(key, true)

      if (options.startMessage) {
        showNotification(options.startMessage, 'info')
      }

      try {
        const result = await action(...args)

        if (options.successMessage) {
          showNotification(options.successMessage, 'success')
        }

        return { ok: true, result }
      } catch (error) {
        handleError(error, options.context || key)
        showNotification(options.errorMessage || 'Request failed', 'error')
        return { ok: false, error }
      } finally {
        setLocalLoading(false)
        setLoading(key, false)
      }
    },
    [action, handleError, key, options.context, options.errorMessage, options.startMessage, options.successMessage, setLoading, showNotification]
  )

  return { run, loading }
}

export default useApiAction
