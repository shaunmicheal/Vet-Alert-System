import { AiOutlineLoading3Quarters } from 'react-icons/ai'

export default function Spinner({ className = 'h-5 w-5' }) {
  return (
    <AiOutlineLoading3Quarters
      className={`animate-spin ${className}`}
      aria-hidden="true"
      focusable="false"
    />
  )
}
