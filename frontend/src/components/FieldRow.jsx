import { useState } from 'react';
import { motion } from 'framer-motion';

export default function FieldRow({ field, sectionId, onUpdateMeta, onUpdateValue, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(field.label);
  const [editType, setEditType] = useState(field.type);

  const handleSaveMeta = () => {
    if (!editLabel.trim()) return;
    onUpdateMeta(sectionId, field.id, {
      label: editLabel.trim(),
      type: editType
    });
    setIsEditing(false);
  };

  const handleCancelMeta = () => {
    setEditLabel(field.label);
    setEditType(field.type);
    setIsEditing(false);
  };

  return (
    <motion.div
      className="field-row"
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      style={{ overflow: 'hidden' }}
    >
      <div className="field-accent-bar" />

      {isEditing ? (
        <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center', padding: '6px 0' }}>
          <input
            type="text"
            className="add-field-input interactive"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            style={{ flex: 2, height: '32px' }}
          />
          <select
            className="add-field-select interactive"
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            style={{ flex: 1, height: '32px', padding: '4px 8px' }}
          >
            <option value="text">text</option>
            <option value="email">email</option>
            <option value="tel">tel</option>
            <option value="date">date</option>
            <option value="number">number</option>
            <option value="url">url</option>
            <option value="textarea">textarea</option>
          </select>
          <button className="btn-primary interactive" onClick={handleSaveMeta} style={{ padding: '6px 12px' }}>
            Save
          </button>
          <button className="btn-ghost interactive" onClick={handleCancelMeta} style={{ padding: '6px 12px' }}>
            Cancel
          </button>
        </div>
      ) : (
        <>
          <span className="field-label">{field.label}</span>

          {field.type === 'textarea' ? (
            <textarea
              className="field-value-input interactive"
              value={field.value}
              onChange={(e) => onUpdateValue(sectionId, field.id, e.target.value)}
              rows={3}
              placeholder="Empty"
            />
          ) : (
            <input
              type={field.type}
              className="field-value-input interactive"
              value={field.value}
              onChange={(e) => onUpdateValue(sectionId, field.id, e.target.value)}
              placeholder="Empty"
            />
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="icon-btn interactive"
              title="Edit label/type"
              onClick={() => setIsEditing(true)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
            <button
              className="icon-btn interactive"
              title="Delete field"
              onClick={() => onDelete(sectionId, field.id)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
