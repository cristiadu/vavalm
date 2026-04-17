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
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl mx-auto relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <h2 id="modal-title" className="text-2xl">{title}</h2>
          <button onClick={onClose} className="text-gray-700" aria-label="Close modal">
            Close
          </button>
        </div>
        <div className="mt-4 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal