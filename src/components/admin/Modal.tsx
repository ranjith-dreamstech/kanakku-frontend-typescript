import type { ReactNode } from 'react';
import { XCircleIcon } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative z-50 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
