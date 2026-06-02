chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_form") {
    const data = request.data || {};
    let filledCount = 0;
    let attemptedCount = 0;

    const inputs = document.querySelectorAll("input, textarea, select");

    const aliasMap = {
      "fullname": ["fullname", "full name", "name", "first name", "last name", "given name", "family name", "applicant name", "candidate name", "student name"],
      "email": ["email", "e-mail", "mail", "email address", "contact email", "email id", "email-id", "mail id", "mail-id", "emailid", "mailid"],
      "phone": ["phone", "mobile", "contact number", "telephone", "cell", "phone number", "contact", "no.", "no", "number", "ph no", "mob no"],
      "dob": ["dob", "date of birth", "birth date", "birthday"],
      "gender": ["gender", "sex", "pronoun"],
      "pan": ["pan", "pan card", "pan number"],
      "aadhaar": ["aadhaar", "aadhar", "uid", "uidai", "aadhaar number", "aadhar number"],
      "address": ["address", "street", "location", "current address", "permanent address", "residential address"],
      "city": ["city", "town", "district"],
      "state": ["state", "province"],
      "pincode": ["pin", "pincode", "zip", "postal", "zip code", "zipcode", "postal code"],
      "country": ["country", "nation"],
      "username": ["username", "user id", "userid", "user"],
      
      // Additional Massive Job/College fields
      "college": ["college", "university", "institute", "institution", "school", "education", "degree from", "graduated from", "institution name", "college name", "university name"],
      "branch": ["branch", "major", "field of study", "specialization", "course", "program", "discipline", "department", "stream"],
      "degree": ["degree", "qualification", "level of education", "graduation", "highest degree", "educational qualification", "highest qualification"],
      "cgpa": ["cgpa", "gpa", "percentage", "score", "grade", "marks", "aggregate"],
      "experience": ["experience", "total experience", "years of experience", "work experience", "total work experience", "past experience"],
      "company": ["company", "current company", "employer", "organization", "current organization", "past company", "company name"],
      "linkedin": ["linkedin", "linkedin url", "linkedin profile", "linked in"],
      "github": ["github", "github url", "github profile", "git hub", "git"],
      "portfolio": ["portfolio", "website", "personal website", "link", "personal link", "portfolio url"],
      "resume": ["resume", "cv", "curriculum vitae", "upload resume", "upload cv"],
      "coverletter": ["cover letter", "coverletter", "covering letter"],
      "ctc": ["ctc", "current ctc", "expected ctc", "salary", "expected salary", "current salary", "compensation", "annual salary"],
      "noticeperiod": ["notice period", "notice", "joining time", "available to join", "availability"]
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
      return overlap / Math.max(leftTokens.length, rightTokens.length);
    };

    const findValueForField = (fieldText) => {
      if (!fieldText || fieldText.trim() === '') return null;
      
      const text = fieldText.toLowerCase();
      // Remove generic filler words for better matching
      const cleanedText = text.replace(/\b(enter|your|please|provide|the|a|an)\b/g, ' ').trim();
      
      const normalizedText = normalizeText(cleanedText);
      const textTokens = tokenize(cleanedText);

      if (!normalizedText) return null;

      // 1) Alias-based strict matching
      let bestAliasScore = 0;
      let bestAliasKey = null;

      for (const [dataKey, aliases] of Object.entries(aliasMap)) {
        for (const alias of aliases) {
          const normalizedAlias = normalizeText(alias);
          const aliasTokens = tokenize(alias);
          
          // Exact match
          if (normalizedText === normalizedAlias || textTokens.join(' ') === aliasTokens.join(' ')) {
             bestAliasScore = 1;
             bestAliasKey = dataKey;
             break;
          }

          // Very strong inclusion match (e.g. "enter your college name" includes "college name")
          if (cleanedText.includes(alias) || textTokens.join(' ').includes(aliasTokens.join(' '))) {
            const score = aliasTokens.length / textTokens.length;
            // Only accept if the alias forms a significant part of the field text (at least 30%)
            // and the alias isn't too short (like "no" for phone) unless it's a very exact match.
            if (score > bestAliasScore && (aliasTokens.length > 1 || alias.length > 3 || score > 0.8)) {
               bestAliasScore = score;
               bestAliasKey = dataKey;
            }
          }
        }
        if (bestAliasScore === 1) break;
      }

      if (bestAliasKey) {
         // Prioritize the standardized category key if available in user's profile
         if (flatData[bestAliasKey]) return flatData[bestAliasKey];
         
         // Try checking if any user key maps to this alias
         for (const [userKey, userValue] of Object.entries(flatData)) {
            const userKeyNormalized = normalizeText(userKey);
            if (aliasMap[bestAliasKey].some(a => normalizeText(a) === userKeyNormalized || userKeyNormalized.includes(normalizeText(a)))) {
               return userValue;
            }
         }
      }

      // 2) Direct token overlap matching against user's stored custom profile keys.
      // E.g., user created a field called "Father's Name" and form asks for "Father Name"
      let bestKey = null;
      let bestScore = 0;

      for (const key of Object.keys(flatData)) {
        const keyNorm = normalizeText(key);
        if (!keyNorm) continue;

        // Exact match
        if (keyNorm === normalizedText) {
          return flatData[key];
        }

        const keyTokens = tokenize(key);
        const overlapScore = scoreTokenOverlap(keyTokens, textTokens);
        
        // Strict threshold to prevent short values (like name) from matching unrelated fields
        if (overlapScore > bestScore && overlapScore > 0.6) {
          bestScore = overlapScore;
          bestKey = key;
        }
      }

      if (bestKey) {
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
