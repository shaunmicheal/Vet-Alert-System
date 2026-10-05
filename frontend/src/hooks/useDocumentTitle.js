import { useEffect } from 'react'

const BASE_TITLE = 'VetAlert Zimbabwe'

// Keeps document.title in sync with the current page ("Sign in · VetAlert Zimbabwe").
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE
  }, [title])
}