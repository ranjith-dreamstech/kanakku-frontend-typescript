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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:items-center sm:pt-4">

            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-50 flex w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg dark:bg-gray-900 max-h-[90vh]">
                <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        aria-label="Close modal"
                    >
                        <XCircleIcon size={24} />
                    </button>
                </div>
                <div className="overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;