import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, HelpCircle, Check, Info } from 'lucide-react';

const PRESETS = {
  techJob: {
    name: 'Tech Job Application',
    fields: [
      { id: 'job_name', label: 'Applicant Full Name', type: 'text', placeholder: 'e.g. John Doe' },
      { id: 'job_email', label: 'Contact Email Address', type: 'email', placeholder: 'e.g. john@example.com' },
      { id: 'job_phone', label: 'Mobile Number', type: 'tel', placeholder: 'e.g. +1 234 567 890' },
      { id: 'job_linkedin', label: 'LinkedIn Profile URL', type: 'text', placeholder: 'e.g. linkedin.com/in/username' },
      { id: 'job_github', label: 'GitHub Profile link', type: 'text', placeholder: 'e.g. github.com/username' },
      { id: 'job_portfolio', label: 'Personal Website / Portfolio', type: 'text', placeholder: 'e.g. myportfolio.com' },
      { id: 'job_experience', label: 'Years of Experience', type: 'number', placeholder: 'e.g. 3' }
    ]
  },
  startupRegister: {
    name: 'Startup Registration Form',
    fields: [
      { id: 'startup_founder', label: 'Founder Name', type: 'text', placeholder: 'e.g. Jane Smith' },
      { id: 'startup_email', label: 'Business Email', type: 'email', placeholder: 'e.g. founder@startup.co' },
      { id: 'startup_phone', label: 'Contact Number', type: 'tel', placeholder: 'e.g. +1 987 654 321' },
      { id: 'startup_username', label: 'Choose Username', type: 'text', placeholder: 'e.g. janesmith99' },
      { id: 'startup_address', label: 'Company Headquarters Address', type: 'text', placeholder: 'e.g. 123 Innovation Way' }
    ]
  },
  generalForm: {
    name: 'Standard Registration Profile',
    fields: [
      { id: 'gen_name', label: 'Full Name', type: 'text', placeholder: 'e.g. Alex Johnson' },
      { id: 'gen_email', label: 'Email', type: 'email', placeholder: 'e.g. alex@example.com' },
      { id: 'gen_phone', label: 'Phone', type: 'tel', placeholder: 'e.g. +1 555 123 456' },
      { id: 'gen_dob', label: 'Date of Birth', type: 'text', placeholder: 'e.g. YYYY-MM-DD' },
      { id: 'gen_gender', label: 'Gender', type: 'text', placeholder: 'e.g. Male/Female/Other' }
    ]
  }
};

const ALIAS_MAP = {
  "fullname": ["fullname", "full name", "name", "first name", "last name", "given name", "family name", "applicant name", "candidate name", "student name", "founder name", "applicant full name"],
  "email": ["email", "e-mail", "mail", "email address", "contact email", "email id", "email-id", "mail id", "mail-id", "emailid", "mailid", "business email", "contact email address"],
  "phone": ["phone", "mobile", "contact number", "telephone", "cell", "phone number", "contact", "no.", "no", "number", "ph no", "mob no", "mobile number"],
  "dob": ["dob", "date of birth", "birth date", "birthday"],
  "gender": ["gender", "sex", "pronoun"],
  "address": ["address", "street", "location", "current address", "permanent address", "residential address", "company headquarters address"],
  "username": ["username", "user id", "userid", "user", "choose username"],
  "linkedin": ["linkedin", "linkedin url", "linkedin profile", "linked in", "linkedin profile url"],
  "github": ["github", "github url", "github profile", "git hub", "git", "github profile link"],
  "portfolio": ["portfolio", "website", "personal website", "link", "personal link", "portfolio url"],
  "experience": ["experience", "total experience", "years of experience", "work experience", "total work experience", "past experience"],
};

export default function SandboxLab({ data }) {
  const [selectedPreset, setSelectedPreset] = useState('techJob');
  const [formValues, setFormValues] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [matchLogs, setMatchLogs] = useState([]);
  const [autofilledFields, setAutofilledFields] = useState(new Set());

  // Reset form when preset changes
  useEffect(() => {
    const emptyValues = {};
    PRESETS[selectedPreset].fields.forEach(f => {
      emptyValues[f.id] = '';
    });
    setFormValues(emptyValues);
    setMatchLogs([]);
    setAutofilledFields(new Set());
  }, [selectedPreset]);

  // Flatten the user vault data
  const getFlattenedVaultData = () => {
    const flatData = {};
    if (Array.isArray(data)) {
      data.forEach(section => {
        if (Array.isArray(section.fields)) {
          section.fields.forEach(field => {
            if (field.label && field.value && field.type !== 'file') {
              const normalKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
              flatData[normalKey] = field.value;
            }
          });
        }
      });
    }
    return flatData;
  };

  const normalizeText = (value) => (value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const tokenize = (value) => (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const scoreTokenOverlap = (leftTokens, rightTokens) => {
    if (!leftTokens.length || !rightTokens.length) return 0;
    const rightSet = new Set(rightTokens);
    const overlap = leftTokens.filter(token => rightSet.has(token)).length;
    return overlap / Math.max(leftTokens.length, rightTokens.length);
  };

  const findValueForField = (fieldText, flatData) => {
    if (!fieldText || fieldText.trim() === '') return { value: null, matchType: 'None', score: 0 };
    
    const text = fieldText.toLowerCase();
    const cleanedText = text.replace(/\b(enter|your|please|provide|the|a|an)\b/g, ' ').trim();
    const normalizedText = normalizeText(cleanedText);
    const textTokens = tokenize(cleanedText);

    if (!normalizedText) return { value: null, matchType: 'None', score: 0 };

    // 1) Alias-based strict matching
    let bestAliasScore = 0;
    let bestAliasKey = null;

    for (const [dataKey, aliases] of Object.entries(ALIAS_MAP)) {
      for (const alias of aliases) {
        const normalizedAlias = normalizeText(alias);
        const aliasTokens = tokenize(alias);
        
        if (normalizedText === normalizedAlias || textTokens.join(' ') === aliasTokens.join(' ')) {
           bestAliasScore = 1;
           bestAliasKey = dataKey;
           break;
        }

        if (cleanedText.includes(alias) || textTokens.join(' ').includes(aliasTokens.join(' '))) {
          const score = aliasTokens.length / textTokens.length;
          if (score > bestAliasScore && (aliasTokens.length > 1 || alias.length > 3 || score > 0.8)) {
             bestAliasScore = score;
             bestAliasKey = dataKey;
          }
        }
      }
      if (bestAliasScore === 1) break;
    }

    if (bestAliasKey) {
       // Check if this exact canonical key exists in user's profile
       if (flatData[bestAliasKey]) {
         return { value: flatData[bestAliasKey], matchType: 'Alias Match', score: bestAliasScore, vaultKey: bestAliasKey };
       }
       
       // Try checking if any user key maps to this alias
       for (const [userKey, userValue] of Object.entries(flatData)) {
          const userKeyNormalized = normalizeText(userKey);
          if (ALIAS_MAP[bestAliasKey].some(a => normalizeText(a) === userKeyNormalized || userKeyNormalized.includes(normalizeText(a)))) {
             return { value: userValue, matchType: 'Alias Match (Mapped)', score: bestAliasScore, vaultKey: userKey };
          }
       }
    }

    // 2) Direct token overlap matching against user's custom profile keys
    let bestKey = null;
    let bestScore = 0;

    for (const key of Object.keys(flatData)) {
      const keyNorm = normalizeText(key);
      if (!keyNorm) continue;

      if (keyNorm === normalizedText) {
        return { value: flatData[key], matchType: 'Exact Match', score: 1.0, vaultKey: key };
      }

      const keyTokens = tokenize(key);
      const overlapScore = scoreTokenOverlap(keyTokens, textTokens);
      
      if (overlapScore > bestScore && overlapScore > 0.6) {
        bestScore = overlapScore;
        bestKey = key;
      }
    }

    if (bestKey) {
      return { value: flatData[bestKey], matchType: 'Fuzzy Match', score: parseFloat(bestScore.toFixed(2)), vaultKey: bestKey };
    }

    return { value: null, matchType: 'None', score: 0 };
  };

  const handleAutofillSimulation = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setMatchLogs([]);
    setAutofilledFields(new Set());
    
    const flatData = getFlattenedVaultData();
    const fields = PRESETS[selectedPreset].fields;
    const logs = [];

    // Simulate page scanning with intervals
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      
      // Delay for cool visual mapping
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const match = findValueForField(field.label, flatData);
      
      if (match.value !== null) {
        setFormValues(prev => ({ ...prev, [field.id]: match.value }));
        setAutofilledFields(prev => {
          const next = new Set(prev);
          next.add(field.id);
          return next;
        });
        logs.push({
          fieldLabel: field.label,
          vaultKey: match.vaultKey,
          status: 'success',
          type: match.matchType,
          score: match.score,
          value: match.value
        });
      } else {
        logs.push({
          fieldLabel: field.label,
          vaultKey: 'Not Found',
          status: 'failed',
          type: 'No Match',
          score: 0,
          value: ''
        });
      }
      
      setMatchLogs([...logs]);
      setScanProgress(((i + 1) / fields.length) * 100);
    }
    
    setIsScanning(false);
  };

  const handleReset = () => {
    const emptyValues = {};
    PRESETS[selectedPreset].fields.forEach(f => {
      emptyValues[f.id] = '';
    });
    setFormValues(emptyValues);
    setMatchLogs([]);
    setAutofilledFields(new Set());
    setScanProgress(0);
    setIsScanning(false);
  };

  return (
    <div className="sandbox-lab">
      <div className="sandbox-header-group">
        <h1 className="sandbox-title">✦ Autofill Sandbox Lab</h1>
        <p className="sandbox-subtitle">
          Test and preview how ApplyBuddy's smart matching engine detects, scans, and fills form inputs on websites using your vault data.
        </p>
      </div>

      <div className="sandbox-controls">
        <div className="preset-selector-group">
          <label className="sandbox-control-label">Select Form Template</label>
          <select 
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            disabled={isScanning}
            className="sandbox-select interactive"
          >
            {Object.entries(PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.name}</option>
            ))}
          </select>
        </div>

        <div className="sandbox-actions">
          <button 
            className="btn-primary interactive sandbox-run-btn" 
            onClick={handleAutofillSimulation}
            disabled={isScanning}
          >
            <Play size={14} className={isScanning ? 'animate-pulse' : ''} />
            {isScanning ? 'Autofilling...' : 'Autofill Sandbox'}
          </button>
          <button 
            className="btn-ghost interactive sandbox-reset-btn" 
            onClick={handleReset}
            disabled={isScanning}
          >
            <RotateCcw size={14} />
            Reset Form
          </button>
        </div>
      </div>

      <div className="sandbox-workspace">
        {/* Mock Web Browser Container */}
        <div className="mock-browser">
          <div className="browser-header">
            <div className="browser-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-url-bar">
              https://example-careers.com/apply
            </div>
          </div>
          
          <div className="browser-content">
            <div className="sandbox-form">
              <h2 className="form-title">{PRESETS[selectedPreset].name}</h2>
              <p className="form-subtitle">Please enter your application details below.</p>
              
              <div className="form-fields">
                {PRESETS[selectedPreset].fields.map((field) => {
                  const isAutofilled = autofilledFields.has(field.id);
                  return (
                    <div 
                      key={field.id} 
                      className={`form-group ${isAutofilled ? 'field-autofilled' : ''}`}
                    >
                      <label className="form-label-tag">
                        {field.label}
                      </label>
                      <div className="input-wrapper">
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formValues[field.id] || ''}
                          onChange={(e) => setFormValues({ ...formValues, [field.id]: e.target.value })}
                          disabled={isScanning}
                          className="form-input-box"
                        />
                        <AnimatePresence>
                          {isAutofilled && (
                            <motion.span 
                              className="fill-badge"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                            >
                              <Check size={10} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Laser Scanning Effect */}
              {isScanning && (
                <motion.div 
                  className="scan-radar-line"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Real-time Autofill Log / Insights */}
        <div className="match-insights">
          <div className="insights-header">
            <Info size={16} className="insights-icon" />
            <h3>autofill matching logs</h3>
          </div>

          <div className="insights-content">
            {matchLogs.length === 0 ? (
              <div className="insights-empty">
                <HelpCircle size={32} className="help-icon" />
                <p>Click <strong>Autofill Sandbox</strong> to run the matching engine and analyze logs in real time.</p>
              </div>
            ) : (
              <div className="insights-logs-list">
                {matchLogs.map((log, index) => (
                  <motion.div 
                    key={index} 
                    className={`insight-log-card ${log.status === 'success' ? 'log-success' : 'log-failed'}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="log-row-main">
                      <span className="log-label">{log.fieldLabel}</span>
                      <span className={`log-badge-status ${log.status}`}>
                        {log.status === 'success' ? 'Filled' : 'No Match'}
                      </span>
                    </div>

                    {log.status === 'success' ? (
                      <div className="log-details">
                        <div className="log-detail-item">
                          <span className="detail-title">Vault Key:</span>
                          <span className="detail-value">{log.vaultKey}</span>
                        </div>
                        <div className="log-detail-item">
                          <span className="detail-title">Match Rule:</span>
                          <span className="detail-value highlight-accent">{log.type}</span>
                        </div>
                        <div className="log-detail-item">
                          <span className="detail-title">Confidence:</span>
                          <span className="detail-value">{(log.score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="log-detail-item value-preview">
                          <span className="detail-title">Filled Value:</span>
                          <span className="detail-value truncate">{log.value}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="log-failed-text">
                        No matching field or alias found in your vault. Try adding a field labeled <strong>"{log.fieldLabel}"</strong> to your vault.
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
