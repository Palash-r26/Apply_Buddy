chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_form") {
    const data = request.data || {};
    let filledCount = 0;
    let attemptedCount = 0;

    const inputs = document.querySelectorAll("input, textarea, select");

    const aliasMap = {
      "fullname": ["name", "full name", "fullname"],
      "email": ["email", "e-mail", "mail"],
      "phone": ["phone", "mobile", "contact"],
      "dob": ["dob", "date of birth"],
      "gender": ["gender"],
      "pan": ["pan"],
      "aadhaar": ["aadhaar", "aadhar", "uid"],
      "address": ["address"],
      "city": ["city", "town"],
      "state": ["state"],
      "pincode": ["pin", "pincode", "zip", "postal"],
      "country": ["country"],
      "username": ["username", "user"]
    };

    const normalizeText = (value) => (value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const tokenize = (value) => (value || '')
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    // Flatten data to lowercase keys and strip spaces for easier matching
    const flatData = {};
    const processData = (incomingData) => {
      if (Array.isArray(incomingData)) {
        // New array-based schema from dynamic section builder
        incomingData.forEach(section => {
          if (Array.isArray(section.fields)) {
            section.fields.forEach(field => {
              if (field.label && field.value && field.type !== 'file') {
                const normalKey = normalizeText(field.label);
                flatData[normalKey] = field.value;
              }
            });
          }
        });
      } else {
        // Fallback for old object-based schema
        const extract = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              extract(obj[key]);
            } else {
              const normalKey = normalizeText(key);
              flatData[normalKey] = obj[key];
            }
          }
        };
        extract(incomingData);
      }
    };
    processData(data);

    const scoreTokenOverlap = (leftTokens, rightTokens) => {
      if (!leftTokens.length || !rightTokens.length) return 0;
      const rightSet = new Set(rightTokens);
      const overlap = leftTokens.filter(token => rightSet.has(token)).length;
      return overlap / leftTokens.length;
    };

    const findValueForField = (fieldText) => {
      if (!fieldText) return null;
      const text = fieldText.toLowerCase();
      const normalizedText = normalizeText(text);
      const textTokens = tokenize(text);

      // 1) Alias-based quick matching.
      
      for (const [dataKey, aliases] of Object.entries(aliasMap)) {
        if (aliases.some(alias => text.includes(alias))) {
          // Check if we have this key mapped in our flatData
          if (flatData[dataKey]) return flatData[dataKey];
          
          // Also try direct aliases in flatData
          for (const alias of aliases) {
             const normalizedAlias = normalizeText(alias);
             if (flatData[normalizedAlias]) return flatData[normalizedAlias];
          }
        }
      }

      // 2) Direct + fuzzy matching against any stored profile key.
      let bestKey = null;
      let bestScore = 0;

      for (const key of Object.keys(flatData)) {
        const keyNorm = normalizeText(key);
        if (!keyNorm) continue;

        if (normalizedText.includes(keyNorm) || keyNorm.includes(normalizedText)) {
          const score = Math.min(keyNorm.length, normalizedText.length) / Math.max(keyNorm.length, normalizedText.length);
          if (score > bestScore) {
            bestScore = score;
            bestKey = key;
          }
        }

        const keyTokens = tokenize(keyNorm);
        const overlapScore = scoreTokenOverlap(keyTokens, textTokens);
        if (overlapScore > bestScore) {
          bestScore = overlapScore;
          bestKey = key;
        }
      }

      // Accept if at least half of the field name meaning matches.
      if (bestKey && bestScore >= 0.5) {
        return flatData[bestKey];
      }

      return null;
    };

    const getTextFromIds = (idsValue) => {
      if (!idsValue) return '';
      const ids = idsValue.split(/\s+/).filter(Boolean);
      return ids
        .map((refId) => {
          const node = document.getElementById(refId);
          return node ? (node.innerText || node.textContent || '') : '';
        })
        .join(' ')
        .trim();
    };

    const getNearbyQuestionText = (element) => {
      let current = element;
      let depth = 0;

      while (current && depth < 5) {
        const container = current.closest('[role="listitem"], [data-params], .freebirdFormviewerViewItemsItemItem') || current.parentElement;
        if (!container) break;

        const rawText = (container.innerText || container.textContent || '').trim();
        const cleaned = rawText
          .replace(/\bYour answer\b/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleaned.length > 0) {
          return cleaned.slice(0, 300);
        }

        current = container.parentElement;
        depth += 1;
      }

      return '';
    };

    const setNativeInputValue = (element, value) => {
      const stringValue = value == null ? '' : String(value);
      const prototype = Object.getPrototypeOf(element);
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (valueSetter) {
        valueSetter.call(element, stringValue);
      } else {
        element.value = stringValue;
      }
    };

    inputs.forEach(element => {
      // Don't fill hidden, submit, button, etc.
      if (element.tagName.toLowerCase() === 'input') {
        const type = element.type.toLowerCase();
        if (['hidden', 'submit', 'button', 'file', 'image', 'reset'].includes(type)) {
          return;
        }
      }

      const name = element.name || "";
      const id = element.id || "";
      const placeholder = element.placeholder || "";
      const ariaLabel = element.getAttribute("aria-label") || "";
      const ariaLabelledBy = getTextFromIds(element.getAttribute('aria-labelledby') || '');
      const describedBy = getTextFromIds(element.getAttribute('aria-describedby') || '');
      const labelNode = id ? document.querySelector(`label[for="${id}"]`) : null;
      const parentLabelNode = element.closest('label');
      const labelText = labelNode?.innerText || parentLabelNode?.innerText || '';
      const nearbyQuestionText = getNearbyQuestionText(element);

      const matchString = `${name} ${id} ${placeholder} ${ariaLabel} ${ariaLabelledBy} ${describedBy} ${labelText} ${nearbyQuestionText}`;
      const matchedValue = findValueForField(matchString);

      if (matchedValue) {
        attemptedCount++;
        let changed = false;
        
        if (element.tagName.toLowerCase() === 'select') {
           for (let i = 0; i < element.options.length; i++) {
             if (element.options[i].text.toLowerCase().includes(matchedValue.toString().toLowerCase()) || 
                 element.options[i].value.toLowerCase() === matchedValue.toString().toLowerCase()) {
               element.selectedIndex = i;
               changed = true;
               break;
             }
           }
           if (!changed) {
             element.value = matchedValue;
             changed = true;
           }
        } else if (element.type === 'checkbox' || element.type === 'radio') {
            // Value match check for radio/checkbox
            if (element.value.toLowerCase() === matchedValue.toString().toLowerCase()) {
                element.checked = true;
                changed = true;
            }
        } else {
           if (element.value !== matchedValue) {
             setNativeInputValue(element, matchedValue);
             changed = true;
           }
        }

        if (changed) {
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
        }
      }
    });

    sendResponse({ success: true, filledCount: filledCount, attemptedCount });
  }
  return true; // Keep the message channel open for async response if needed
});
