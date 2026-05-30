import { useState, useRef, useEffect, useCallback } from 'react';

// Default dataset generated at module level with stable UUIDs
const INITIAL_DATA = [
  {
    id: crypto.randomUUID(),
    title: 'Personal Info',
    fields: [
      { id: crypto.randomUUID(), label: 'Full Name', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Email', value: '', type: 'email' },
      { id: crypto.randomUUID(), label: 'Phone', value: '', type: 'tel' },
      { id: crypto.randomUUID(), label: 'Date of Birth', value: '', type: 'date' },
      { id: crypto.randomUUID(), label: 'Gender', value: '', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Government IDs',
    fields: [
      { id: crypto.randomUUID(), label: 'PAN', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Aadhaar', value: '', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Address',
    fields: [
      { id: crypto.randomUUID(), label: 'Address Line 1', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Address Line 2', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'City', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'State', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Pincode', value: '', type: 'number' },
      { id: crypto.randomUUID(), label: 'Country', value: '', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Online Accounts',
    fields: [
      { id: crypto.randomUUID(), label: 'Username', value: '', type: 'text' }
    ]
  }
];

// Load cached data from localStorage as a fallback
const loadCachedData = () => {
  try {
    const saved = localStorage.getItem('applybuddy_data');
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Failed to parse localStorage cache:', err);
  }
  return INITIAL_DATA;
};

export function useProfile() {
  const [data, setData] = useState(loadCachedData);
  const [toast, setToast] = useState({ visible: false, error: false, message: '' });
  const [isLoaded, setIsLoaded] = useState(false);

  const debounceTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  const triggerToast = useCallback((message, error = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ visible: true, error, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, error ? 3000 : 1500); // Errors stay a bit longer
  }, []);

  const showSuccessToast = useCallback(() => triggerToast('✦ saved', false), [triggerToast]);
  const showErrorToast = useCallback(() => triggerToast('Sync failed — data saved locally', true), [triggerToast]);

  // Sync data to backend API
  const syncToBackend = useCallback((newData, retry = false) => {
    return; // Temporarily disabled to bypass login
    // If not authenticated, the request will fail with 401, but we still try
    // App.jsx will handle redirecting unauthenticated users
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // No Authorization header needed, httpOnly cookie handles it
          body: JSON.stringify({ data: newData })
        });

        if (!res.ok) {
          throw new Error('Sync failed');
        }
        // If it was a retry and succeeded, optionally we could show a "Sync recovered" toast
      } catch (err) {
        console.error('Backend sync error:', err);
        showErrorToast();
        
        if (!retry) {
          // Retry once after 3 seconds
          setTimeout(() => {
            syncToBackend(newData, true);
          }, 3000);
        }
      }
    }, 300);
  }, [showErrorToast]);

  // Immediate save — localStorage + backend sync + toast
  const saveImmediate = useCallback((newData) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    localStorage.setItem('applybuddy_data', JSON.stringify(newData));
    syncToBackend(newData);
    showSuccessToast();
  }, [syncToBackend, showSuccessToast]);

  // Debounced save (typing in value fields)
  const saveDebounced = useCallback((newData) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('applybuddy_data', JSON.stringify(newData));
      syncToBackend(newData);
      showSuccessToast();
    }, 800);
  }, [syncToBackend, showSuccessToast]);

  // Load profile data from backend on mount
  const loadFromBackend = useCallback(async () => {
    setIsLoaded(true);
    return; // Temporarily disabled to bypass login
    try {
      const res = await fetch('/api/profile'); // credentials are sent via cookies automatically by Vite proxy

      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          setData(serverData);
          localStorage.setItem('applybuddy_data', JSON.stringify(serverData));
        } else {
          // Server has no data — push the local/default data to server
          const localData = loadCachedData();
          setData(localData);
          syncToBackend(localData);
        }
      }
    } catch (err) {
      console.error('Failed to load from backend, using cache:', err);
    }
    setIsLoaded(true);
  }, [syncToBackend]);

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  // CRUD handlers
  const addSection = (title) => {
    const newSection = { id: crypto.randomUUID(), title, fields: [] };
    setData(prev => {
      const updated = [...prev, newSection];
      saveImmediate(updated);
      return updated;
    });
  };

  const renameSection = (sectionId, newTitle) => {
    setData(prev => {
      const updated = prev.map(s => s.id === sectionId ? { ...s, title: newTitle } : s);
      saveImmediate(updated);
      return updated;
    });
  };

  const deleteSection = (sectionId) => {
    setData(prev => {
      const updated = prev.filter(s => s.id !== sectionId);
      saveImmediate(updated);
      return updated;
    });
  };

  const addField = (sectionId, fieldObj) => {
    setData(prev => {
      const updated = prev.map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, fieldObj] } : s
      );
      saveImmediate(updated);
      return updated;
    });
  };

  const updateFieldMeta = (sectionId, fieldId, { label, type }) => {
    setData(prev => {
      const updated = prev.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            fields: s.fields.map(f => {
              if (f.id === fieldId) {
                const value = f.type === type ? f.value : '';
                return { ...f, label, type, value };
              }
              return f;
            })
          };
        }
        return s;
      });
      saveImmediate(updated);
      return updated;
    });
  };

  const updateFieldValue = (sectionId, fieldId, value) => {
    setData(prev => {
      const updated = prev.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            fields: s.fields.map(f => f.id === fieldId ? { ...f, value } : f)
          };
        }
        return s;
      });
      saveDebounced(updated);
      return updated;
    });
  };

  const deleteField = (sectionId, fieldId) => {
    setData(prev => {
      const updated = prev.map(s => {
        if (s.id === sectionId) {
          return { ...s, fields: s.fields.filter(f => f.id !== fieldId) };
        }
        return s;
      });
      saveImmediate(updated);
      return updated;
    });
  };

  return {
    data,
    isLoaded,
    addSection,
    renameSection,
    deleteSection,
    addField,
    updateFieldMeta,
    updateFieldValue,
    deleteField,
    toast,
    loadFromBackend
  };
}
