const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl mx-auto relative">
        <h2 className="text-2xl absolute top-2">{title}</h2>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-700">
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