import type { ReactNode } from 'react';
import { XCircleIcon } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

const sizeClassMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'w-full max-w-none',
};

const Modal = ({ isOpen, onClose, title, children, size = '2xl' }: ModalProps) => {
    if (!isOpen) return null;

   return (
  <>
    {/* Fixed Backdrop */}
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

    {/* Scrollable Page Flow */}
    <div className="absolute left-0 top-0 z-50 flex w-full justify-center px-4 pt-5 pb-20">
      <div
        className={`w-full ${sizeClassMap[size ?? '2xl']} rounded-lg bg-white shadow-lg dark:bg-gray-900`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-2 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
            aria-label="Close modal"
          >
            <XCircleIcon size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-2">{children}</div>
      </div>
    </div>
  </>
);



};

export default Modal;
