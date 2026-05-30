let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
  const dataContainer = document.getElementById('dataContainer');
  const fillButton = document.getElementById('fillButton');
  const statusMessage = document.getElementById('statusMessage');

  // Load data from storage
  chrome.storage.local.get("applybuddy_data", (result) => {
    const data = result.applybuddy_data;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Provide a mock structure matching the new dynamic format for easy testing
      currentData = [
        {
          id: "mock-1",
          title: "Personal Info",
          fields: [
            { id: "f1", label: "Full Name", value: "John Doe", type: "text" },
            { id: "f2", label: "Email", value: "john@example.com", type: "email" }
          ]
        },
        {
          id: "mock-2",
          title: "Experience",
          fields: [
            { id: "f3", label: "Company", value: "Tech Corp", type: "text" }
          ]
        }
      ];
      
      // Save it back to simulate what the web app would do
      chrome.storage.local.set({ applybuddy_data: currentData });
      
      renderData(currentData);
    } else {
      currentData = data;
      renderData(currentData);
    }
  });
  
  // Listen for changes from background (live sync)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.applybuddy_data) {
      currentData = changes.applybuddy_data.newValue;
      renderData(currentData);
    }
  });

  function renderData(data) {
    dataContainer.innerHTML = '';
    
    if (Array.isArray(data)) {
      data.forEach(section => {
        renderSection(section.title, section.fields);
      });
    } else {
      // Fallback for old object-based data
      for (const [key, val] of Object.entries(data)) {
         if (typeof val === 'object' && val !== null) {
            // map old object structure to fields array
            const fieldsArray = Object.entries(val).map(([l, v]) => ({ label: l, value: v, type: 'text' }));
            renderSection(key, fieldsArray);
         }
      }
    }
  }

  function renderSection(title, fieldsArray) {
    if (!fieldsArray || fieldsArray.length === 0) return;
    
    const sectionEl = document.createElement('div');
    sectionEl.className = 'section';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'section-title';
    titleEl.textContent = title;
    sectionEl.appendChild(titleEl);
    
    fieldsArray.forEach(field => {
      // Skip file data URLs as they're too large and not useful to copy directly
      if (field.type === 'file' || (field.value && typeof field.value === 'string' && field.value.startsWith('data:'))) {
         return; 
      }
        
      const rowEl = document.createElement('div');
      rowEl.className = 'field-row';
      
      const infoEl = document.createElement('div');
      infoEl.className = 'field-info';
      
      const labelEl = document.createElement('div');
      labelEl.className = 'field-label';
      labelEl.textContent = field.label;
      
      const valueEl = document.createElement('div');
      valueEl.className = 'field-value';
      valueEl.textContent = field.value || '';
      
      infoEl.appendChild(labelEl);
      infoEl.appendChild(valueEl);
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        if (!field.value) return;
        navigator.clipboard.writeText(field.value.toString()).then(() => {
          copyBtn.textContent = 'Copied';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
          }, 2000);
        });
      });
      
      rowEl.appendChild(infoEl);
      rowEl.appendChild(copyBtn);
      
      sectionEl.appendChild(rowEl);
    });
    
    dataContainer.appendChild(sectionEl);
  }

  fillButton.addEventListener('click', async () => {
    if (!currentData) return;
    
    statusMessage.textContent = 'Scanning and filling...';
    statusMessage.style.color = 'var(--text-secondary)';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
         statusMessage.textContent = 'No active tab found';
         statusMessage.style.color = '#ef4444';
         return;
      }
      
      chrome.tabs.sendMessage(tab.id, { action: "fill_form", data: currentData }, (response) => {
        if (chrome.runtime.lastError) {
          statusMessage.textContent = 'Refresh page and try again.';
          statusMessage.style.color = '#ef4444';
          return;
        }
        
        if (response && response.success) {
          if (response.filledCount > 0) {
            statusMessage.textContent = `${response.filledCount} fields filled!`;
            statusMessage.style.color = 'var(--success-color)';
          } else {
            statusMessage.textContent = 'No fields matched';
            statusMessage.style.color = 'var(--text-secondary)';
          }
        }
      });
    } catch (err) {
      console.error(err);
      statusMessage.textContent = 'Error executing fill.';
      statusMessage.style.color = '#ef4444';
    }
  });
});
