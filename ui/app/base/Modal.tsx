import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }): React.ReactNode => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl mx-auto relative">
        <h2 id="modal-title" className="text-2xl absolute top-2">{title}</h2>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-700" aria-label="Close modal">
          Close
        </button>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal