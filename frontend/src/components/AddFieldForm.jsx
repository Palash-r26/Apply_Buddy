import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AddFieldForm({ onAdd, onCancel }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [value, setValue] = useState('');
  const [shakeLabel, setShakeLabel] = useState(false);

  const handleAdd = () => {
    if (!label.trim()) {
      setShakeLabel(true);
      setTimeout(() => setShakeLabel(false), 500);
      return;
    }
    onAdd({
      id: crypto.randomUUID(),
      label: label.trim(),
      type,
      value
    });
    setLabel('');
    setType('text');
    setValue('');
  };

  return (
    <motion.div
      className="add-field-form"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      style={{ overflow: 'hidden' }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <div className="add-field-row">
        <motion.input
          type="text"
          className="add-field-input interactive"
          placeholder="e.g. LinkedIn URL"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          animate={shakeLabel ? { x: [0, -6, 6, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
        />
        
        <select
          className="add-field-select interactive"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="text">text</option>
          <option value="email">email</option>
          <option value="tel">tel</option>
          <option value="date">date</option>
          <option value="number">number</option>
          <option value="url">url</option>
          <option value="textarea">textarea</option>
          <option value="file">file</option>
        </select>

        {type === 'textarea' ? (
          <textarea
            className="add-field-input interactive"
            placeholder="Value..."
            rows={1}
            value={value}
            style={{ resize: 'none' }}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : type === 'file' ? (
          <input
            type="file"
            className="add-field-input interactive"
            onChange={(e) => {
               const file = e.target.files[0];
               if (file) {
                 if (file.size > 2 * 1024 * 1024) {
                   alert("File too large! Max 2MB.");
                   e.target.value = '';
                   return;
                 }
                 const reader = new FileReader();
                 reader.onloadend = () => setValue(reader.result);
                 reader.readAsDataURL(file);
               }
            }}
          />
        ) : (
          <input
            type={type}
            className="add-field-input interactive"
            placeholder="Value..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </div>

      <div className="add-field-actions">
        <button type="button" className="btn-ghost interactive" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary interactive" onClick={handleAdd}>
          Add
        </button>
      </div>
    </motion.div>
  );
}
