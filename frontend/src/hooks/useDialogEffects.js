import { useEffect, useRef } from 'react'

// Shared modal behaviour for the animal dialogs:
// - Escape closes the dialog
// - background scrolling is locked while it is open
// The latest onClose callback is kept in a ref so the effect runs only once.
export default function useDialogEffects(onClose) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    const previousOverflow = document.body.style.overflow
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [])
}