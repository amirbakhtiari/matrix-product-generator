import React from 'react';
import { useUiStore } from '../../stores/ui-store.ts';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { AlertTriangle } from 'lucide-react';

export const ConfirmationModal: React.FC = () => {
  const { confirmationModal, closeConfirmation } = useUiStore();

  if (!confirmationModal) return null;

  const handleConfirm = async () => {
    try {
      await confirmationModal.onConfirm();
    } finally {
      closeConfirmation();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={closeConfirmation}
      title={confirmationModal.title}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={closeConfirmation}>
            {confirmationModal.cancelText || 'انصراف'}
          </Button>
          <Button
            variant={confirmationModal.isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
          >
            {confirmationModal.confirmText || 'تأیید'}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {confirmationModal.isDestructive && (
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-slate-600 leading-relaxed pt-1">
          {confirmationModal.message}
        </p>
      </div>
    </Modal>
  );
};
