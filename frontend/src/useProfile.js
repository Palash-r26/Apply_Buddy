import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from './api.js';

const INITIAL_DATA = [
  {
    id: crypto.randomUUID(),
    title: 'Personal Info',
    fields: [
      { id: crypto.randomUUID(), label: 'Full Name', value: 'Alex Developer', type: 'text' },
      { id: crypto.randomUUID(), label: 'Email', value: 'alex@example.com', type: 'email' },
      { id: crypto.randomUUID(), label: 'Phone', value: '+1 234 567 8900', type: 'tel' },
      { id: crypto.randomUUID(), label: 'Location', value: 'San Francisco, CA', type: 'text' },
      { id: crypto.randomUUID(), label: 'Pincode', value: '94105', type: 'number' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Links',
    fields: [
      { id: crypto.randomUUID(), label: 'Portfolio', value: 'https://alexdev.me/', type: 'text' },
      { id: crypto.randomUUID(), label: 'LinkedIn', value: 'https://linkedin.com/in/alex-developer', type: 'text' },
      { id: crypto.randomUUID(), label: 'GitHub', value: 'https://github.com/alex-dev', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Education',
    fields: [
      { id: crypto.randomUUID(), label: 'B.Tech College', value: 'University of Technology', type: 'text' },
      { id: crypto.randomUUID(), label: 'B.Tech Degree', value: 'Computer Science', type: 'text' },
      { id: crypto.randomUUID(), label: 'B.Tech CGPA', value: '3.8', type: 'text' },
      { id: crypto.randomUUID(), label: 'B.Tech Duration', value: '2020 - 2024', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Experience',
    fields: [
      { id: crypto.randomUUID(), label: 'Role', value: 'Software Engineer', type: 'text' },
      { id: crypto.randomUUID(), label: 'Focus', value: 'Full Stack Development', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Skills',
    fields: [
      { id: crypto.randomUUID(), label: 'Languages', value: 'JavaScript, TypeScript, Python', type: 'text' },
      { id: crypto.randomUUID(), label: 'Frontend', value: 'React.js, Node.js, HTML5, CSS3', type: 'text' },
      { id: crypto.randomUUID(), label: 'Backend', value: 'Node.js, Express.js, PostgreSQL', type: 'text' },
      { id: crypto.randomUUID(), label: 'Database', value: 'MongoDB, PostgreSQL', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Documents',
    fields: [
      { id: crypto.randomUUID(), label: 'Resume', value: '', type: 'file' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Projects',
    fields: [
      { id: crypto.randomUUID(), label: 'ApplyBuddy', value: 'Chrome Extension Vault', type: 'text' },
      { id: crypto.randomUUID(), label: 'VedaAI', value: 'Assessment Engine', type: 'text' }
    ]
  }
];

// Load cached data from localStorage as a fallback
const loadCachedData = () => {
  try {
    const saved = localStorage.getItem('applybuddy_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && (!parsed.some(s => s.title === 'Experience') || !parsed.some(s => s.title === 'Education') || parsed.some(s => s.title === 'Address') || !parsed.some(s => s.title === 'Documents'))) {
        localStorage.setItem('applybuddy_data', JSON.stringify(INITIAL_DATA));
        return INITIAL_DATA;
      }
      return parsed;
    }
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
  const syncToBackend = useCallback(function syncToBackendImpl(newData, retry = false) {
    // If not authenticated, the request will fail with 401, but we still try
    // If not authenticated, the request will fail with 401, but we still try
    // App.jsx will handle redirecting unauthenticated users
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch('/api/profile', {
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
            syncToBackendImpl(newData, true);
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
    try {
      const res = await apiFetch('/api/profile');

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
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
        } else {
          throw new Error('Backend returned a non-JSON response');
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
      let changed = false;
      const updated = prev.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            fields: s.fields.map(f => {
              if (f.id === fieldId) {
                if (f.value !== value) {
                  changed = true;
                  return { ...f, value };
                }
              }
              return f;
            })
          };
        }
        return s;
      });

      if (!changed) {
        return prev;
      }

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
    loadFromBackend,
    triggerToast
  };
}
