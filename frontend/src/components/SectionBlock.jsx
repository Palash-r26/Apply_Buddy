import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FieldRow from './FieldRow';
import AddFieldForm from './AddFieldForm';

// Child block animation variants to handle staggered mounting
const blockVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
    overflow: 'hidden',
    transition: { duration: 0.25 }
  }
};

export default function SectionBlock({
  section,
  onRename,
  onDelete,
  onAddField,
  onUpdateFieldMeta,
  onUpdateFieldValue,
  onDeleteField,
  flashKey
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(section.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const renameInputRef = useRef(null);

  // Trigger opacity flash animation when theme switches
  useEffect(() => {
    if (flashKey > 0) {
      setIsFlashActive(true);
      const timer = setTimeout(() => setIsFlashActive(false), 300);
      return () => clearTimeout(timer);
    }
  }, [flashKey]);

  // Focus rename input on entering edit mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = () => {
    if (!renameTitle.trim()) {
      setRenameTitle(section.title);
      setIsRenaming(false);
      return;
    }
    onRename(section.id, renameTitle.trim());
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setRenameTitle(section.title);
      setIsRenaming(false);
    }
  };

  return (
    <motion.div
      id={section.id}
      data-section-id={section.id}
      className="section-block"
      variants={blockVariants}
      animate={isFlashActive ? { opacity: 0.85 } : "visible"}
      exit="exit"
    >
      <div className="section-header">
        <div className="section-accent-bar" />
        
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            className="section-title-input interactive"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleRenameKeyDown}
          />
        ) : (
          <h2 className="section-title">{section.title}</h2>
        )}

        {!isRenaming && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="icon-btn interactive"
              title="Rename Section"
              onClick={() => setIsRenaming(true)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
            <button
              className="icon-btn interactive"
              title="Delete Section"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="delete-confirm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <span>Delete this section and all its fields?</span>
            <span className="yes interactive" onClick={() => onDelete(section.id)}>Yes</span>
            <span className="no interactive" onClick={() => setShowDeleteConfirm(false)}>No</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fields-list">
        <AnimatePresence>
          {section.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              sectionId={section.id}
              onUpdateMeta={onUpdateFieldMeta}
              onUpdateValue={onUpdateFieldValue}
              onDelete={onDeleteField}
            />
          ))}
        </AnimatePresence>

        {section.fields.length === 0 && (
          <div className="empty-fields-msg">
            No fields yet. Click + Add Field to start.
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showAddField ? (
          <AddFieldForm
            key="add-field-form"
            onAdd={(fieldObj) => {
              onAddField(section.id, fieldObj);
              setShowAddField(false);
            }}
            onCancel={() => setShowAddField(false)}
          />
        ) : (
          <motion.button
            key="add-field-trigger"
            className="add-field-trigger interactive"
            onClick={() => setShowAddField(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            + Add Field
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
