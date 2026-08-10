import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from './api.js';

const INITIAL_DATA = [
  {
    id: crypto.randomUUID(),
    title: 'Personal Info',
    fields: [
      { id: crypto.randomUUID(), label: 'Full Name', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Email', value: '', type: 'email' },
      { id: crypto.randomUUID(), label: 'Phone', value: '', type: 'tel' },
      { id: crypto.randomUUID(), label: 'Location', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Pincode', value: '', type: 'number' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Links',
    fields: [
      { id: crypto.randomUUID(), label: 'Portfolio', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'LinkedIn', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'GitHub', value: '', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Education',
    fields: [
      { id: crypto.randomUUID(), label: 'B.Tech College', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'B.Tech Degree', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'B.Tech CGPA', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'B.Tech Duration', value: '', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Experience',
    fields: [
      { id: crypto.randomUUID(), label: 'Role', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Focus', value: '', type: 'text' }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: 'Skills',
    fields: [
      { id: crypto.randomUUID(), label: 'Languages', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Frontend', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Backend', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'Database', value: '', type: 'text' }
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
      { id: crypto.randomUUID(), label: 'ApplyBuddy', value: '', type: 'text' },
      { id: crypto.randomUUID(), label: 'VedaAI', value: '', type: 'text' }
    ]
  }
];

const MOCK_VALUES_TO_BAN = new Set([
  'Alex Developer',
  'alex@example.com',
  '+1 234 567 8900',
  'San Francisco, CA',
  '94105',
  'https://alexdev.me/',
  'https://linkedin.com/in/alex-developer',
  'https://github.com/alex-dev',
  'University of Technology',
  'Computer Science',
  '3.8',
  '2020 - 2024',
  'Software Engineer',
  'Full Stack Development',
  'JavaScript, TypeScript, Python',
  'React.js, Node.js, HTML5, CSS3',
  'Node.js, Express.js, PostgreSQL',
  'MongoDB, PostgreSQL',
  'Chrome Extension Vault',
  'Assessment Engine'
]);

const sanitizeProfileData = (sections) => {
  if (!Array.isArray(sections)) return sections;
  return sections.map(s => {
    if (!s || typeof s !== 'object') return s;
    const fields = Array.isArray(s.fields)
      ? s.fields.map(f => {
          if (!f || typeof f !== 'object') return f;
          let val = f.value;
          if (typeof val === 'string' && MOCK_VALUES_TO_BAN.has(val.trim())) {
            val = '';
          } else if (typeof val === 'number' && MOCK_VALUES_TO_BAN.has(val.toString().trim())) {
            val = '';
          }
          return { ...f, value: val };
        })
      : [];
    return { ...s, fields };
  });
};

// Load cached data from localStorage as a fallback
const loadCachedData = () => {
  try {
    const saved = localStorage.getItem('applybuddy_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If cached data contains the old mock information, discard it
      const hasMockData = Array.isArray(parsed) && parsed.some(s => 
        s.fields && s.fields.some(f => f.value === 'Alex Developer' || f.value === 'alex@example.com')
      );
      
      if (hasMockData || (Array.isArray(parsed) && (!parsed.some(s => s.title === 'Experience') || !parsed.some(s => s.title === 'Education') || parsed.some(s => s.title === 'Address') || !parsed.some(s => s.title === 'Documents')))) {
        localStorage.setItem('applybuddy_data', JSON.stringify(INITIAL_DATA));
        return INITIAL_DATA;
      }
      return sanitizeProfileData(parsed);
    }
  } catch (err) {
    console.error('Failed to parse localStorage cache:', err);
  }
  return INITIAL_DATA;
};

export function useProfile(user) {
  const storageKey = user && user.username ? `applybuddy_data_${user.username}` : 'applybuddy_data';

  // Load cached data from localStorage based on active user context
  const loadCachedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If cached data contains the old mock information, discard it
        const hasMockData = Array.isArray(parsed) && parsed.some(s => 
          s.fields && s.fields.some(f => f.value === 'Alex Developer' || f.value === 'alex@example.com')
        );
        
        if (hasMockData || (Array.isArray(parsed) && (!parsed.some(s => s.title === 'Experience') || !parsed.some(s => s.title === 'Education') || parsed.some(s => s.title === 'Address') || !parsed.some(s => s.title === 'Documents')))) {
          localStorage.setItem(storageKey, JSON.stringify(INITIAL_DATA));
          return INITIAL_DATA;
        }
        return sanitizeProfileData(parsed);
      }
    } catch (err) {
      console.error('Failed to parse localStorage cache:', err);
    }
    return INITIAL_DATA;
  }, [storageKey]);

  const [data, setData] = useState(loadCachedData);
  const [toast, setToast] = useState({ visible: false, error: false, message: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
  const syncToBackend = useCallback(async (newData) => {
    if (!user) return;
    try {
      const response = await apiFetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: newData })
      });
      if (!response.ok) {
        throw new Error('Backend sync failed');
      }
    } catch (err) {
      console.error('Error syncing profile to backend:', err);
      showErrorToast();
    }
  }, [user, showErrorToast]);

  // Immediate save — localStorage + toast
  const saveImmediate = useCallback((newData) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    const sanitized = sanitizeProfileData(newData);
    // 1. Save to the active user's persistent scoped key
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    // 2. Also keep the active key synced so the Chrome extension sync.js reads the correct user
    localStorage.setItem('applybuddy_data', JSON.stringify(sanitized));
    
    // Alert the Chrome extension of real-time localStorage changes
    window.postMessage({ type: 'APPLYBUDDY_LOCAL_UPDATE' }, '*');
    
    if (user) {
      syncToBackend(sanitized);
    }
    
    showSuccessToast();
    setHasUnsavedChanges(false);
  }, [storageKey, showSuccessToast, user, syncToBackend]);

  // Explicit save for value edits (manual-save UX)
  const saveChanges = useCallback(() => {
    if (!hasUnsavedChanges) return;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    const sanitized = sanitizeProfileData(data);
    // 1. Save to the active user's persistent scoped key
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    // 2. Keep generic key synced for Chrome extension compatibility
    localStorage.setItem('applybuddy_data', JSON.stringify(sanitized));

    // Alert the Chrome extension of real-time localStorage changes
    window.postMessage({ type: 'APPLYBUDDY_LOCAL_UPDATE' }, '*');
    
    if (user) {
      syncToBackend(sanitized);
    }
    
    showSuccessToast();
    setHasUnsavedChanges(false);
  }, [data, hasUnsavedChanges, storageKey, showSuccessToast, user, syncToBackend]);

  // Load profile data from backend or fallback to localStorage
  const loadFromBackend = useCallback(async () => {
    setIsLoaded(false);
    let loadedData = null;
    
    if (user) {
      try {
        const response = await apiFetch('/api/profile');
        if (response.ok) {
          const dbData = await response.json();
          if (Array.isArray(dbData) && dbData.length > 0) {
            loadedData = dbData;
          }
        }
      } catch (err) {
        console.error('Failed to load profile from backend:', err);
      }
    }
    
    if (!loadedData) {
      loadedData = loadCachedData();
    }
    
    const sanitized = sanitizeProfileData(loadedData);
    setData(sanitized);
    
    // Make sure local storage is in sync
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    localStorage.setItem('applybuddy_data', JSON.stringify(sanitized));
    
    setHasUnsavedChanges(false);
    setIsLoaded(true);
  }, [loadCachedData, user, storageKey]);

  useEffect(() => {
    loadFromBackend();
  }, [user, loadFromBackend]);

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

      setHasUnsavedChanges(true);
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
    saveChanges,
    hasUnsavedChanges,
    toast,
    loadFromBackend,
    triggerToast
  };
}
