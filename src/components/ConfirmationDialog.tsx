'use client'
// src/components/ConfirmationDialog.tsx

import { X } from 'lucide-react'

interface ConfirmationDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmationDialog({ title, message, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}><X size={20} /></button>

        <div className="modal-header">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="confirmation-dialog-cancel" onClick={onCancel}>No</button>
          <button className="confirmation-dialog-confirm" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  )
}
