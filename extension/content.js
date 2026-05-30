chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_form") {
    const data = request.data || {};
    let filledCount = 0;

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

    // Flatten data to lowercase keys and strip spaces for easier matching
    const flatData = {};
    const processData = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          processData(obj[key]);
        } else {
          // Normalize key: lower case and remove spaces (e.g. "Full Name" -> "fullname")
          const normalKey = key.toLowerCase().replace(/\s+/g, '');
          flatData[normalKey] = obj[key];
        }
      }
    };
    processData(data);

    const findValueForField = (fieldText) => {
      if (!fieldText) return null;
      const text = fieldText.toLowerCase();
      
      for (const [dataKey, aliases] of Object.entries(aliasMap)) {
        if (aliases.some(alias => text.includes(alias))) {
          // Check if we have this key mapped in our flatData
          if (flatData[dataKey]) return flatData[dataKey];
          
          // Also try direct aliases in flatData
          for (const alias of aliases) {
             const normalizedAlias = alias.replace(/\s+/g, '');
             if (flatData[normalizedAlias]) return flatData[normalizedAlias];
          }
        }
      }
      return null;
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

      const matchString = `${name} ${id} ${placeholder} ${ariaLabel}`;
      const matchedValue = findValueForField(matchString);

      if (matchedValue) {
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
             element.value = matchedValue;
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

    sendResponse({ success: true, filledCount: filledCount });
  }
  return true; // Keep the message channel open for async response if needed
});
