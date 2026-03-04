import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
};

const STYLES: Record<ToastType, string> = {
    success: 'bg-green-900/90 border-green-600 text-green-200',
    error: 'bg-red-900/90 border-red-600 text-red-200',
    warning: 'bg-yellow-900/90 border-yellow-600 text-yellow-200',
    info: 'bg-blue-900/90 border-blue-600 text-blue-200',
};

const ICON_COLORS: Record<ToastType, string> = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-xl min-w-[320px] max-w-[480px] transition-all duration-300 ${STYLES[toast.type]} ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <span className={ICON_COLORS[toast.type]}>{ICONS[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => { setIsLeaving(true); setTimeout(() => onDismiss(toast.id), 300); }}
                className="text-slate-400 hover:text-white transition-colors p-0.5"
            >
                <X size={14} />
            </button>
        </div>
    );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
        </div>
    );
};

export default ToastContainer;
