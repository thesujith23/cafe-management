import { useState } from 'react';
import Modal from '../common/Modal';

/**
 * One small dialog for the console's "are you sure" moments: a message, optional
 * fields, and a confirm button. Mount it with a key so its inputs reset per question.
 *
 * dialog: { title, message?, confirmLabel?, fields?: [{ key, label, defaultValue?, type?, required? }] }
 */
const ActionDialog = ({ dialog, onClose, onConfirm }) => {
  const [values, setValues] = useState(() =>
    Object.fromEntries((dialog.fields || []).map((field) => [field.key, field.defaultValue ?? '']))
  );

  const missingRequired = (dialog.fields || []).some(
    (field) => field.required && !String(values[field.key] ?? '').trim()
  );

  return (
    <Modal isOpen onClose={onClose} title={dialog.title} maxWidth="max-w-sm">
      <div className="space-y-3 font-futura">
        {dialog.message && (
          <p className="text-xs text-space_indigo-200 font-aleo">{dialog.message}</p>
        )}
        {(dialog.fields || []).map((field) => (
          <label
            key={field.key}
            className="block text-[11px] font-bold uppercase tracking-wider text-thistle-400 font-aleo"
          >
            {field.label}
            <input
              type={field.type || 'text'}
              value={values[field.key] ?? ''}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-thistle-700 bg-white text-sm font-normal normal-case tracking-normal text-space_indigo outline-none focus:border-dusty_mauve"
            />
          </label>
        ))}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-thistle-700 text-space_indigo-200 hover:bg-lavender_blush-900/40 font-bold text-xs transition-colors cursor-pointer"
          >
            {dialog.cancelLabel || 'Keep as is'}
          </button>
          <button
            onClick={() => onConfirm(values)}
            disabled={missingRequired}
            className="px-3.5 py-2 rounded-xl bg-space_indigo hover:bg-space_indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            {dialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ActionDialog;
