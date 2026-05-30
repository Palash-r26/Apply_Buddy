let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
  const dataContainer = document.getElementById('dataContainer');
  const fillButton = document.getElementById('fillButton');
  const statusMessage = document.getElementById('statusMessage');

  // Load data from storage
  chrome.storage.local.get("applybuddy_data", (result) => {
    const data = result.applybuddy_data;
    
    if (!data || Object.keys(data).length === 0) {
      // Show mock data or message if empty, and write to storage so we can test easily
      currentData = {
        Personal: {
          "Full Name": "John Doe",
          "Email": "john.doe@example.com",
          "Phone": "9876543210",
          "DOB": "1995-05-15",
          "Gender": "Male"
        },
        Identity: {
          "PAN": "ABCDE1234F",
          "Aadhaar": "123456789012"
        },
        Address: {
          "Address": "123 ApplyBuddy Street",
          "City": "Mumbai",
          "State": "Maharashtra",
          "Pincode": "400001",
          "Country": "India"
        }
      };
      
      // Save it back to simulate what the web app would do
      chrome.storage.local.set({ applybuddy_data: currentData });
      
      renderData(currentData);
    } else {
      currentData = data;
      renderData(currentData);
    }
  });

  function renderData(data) {
    dataContainer.innerHTML = '';
    
    // Check if data is nested by section
    const isNested = Object.values(data).some(val => typeof val === 'object' && val !== null);
    
    if (isNested) {
      for (const [sectionName, sectionData] of Object.entries(data)) {
        renderSection(sectionName, sectionData);
      }
    } else {
      renderSection("Profile Data", data);
    }
  }

  function renderSection(title, fields) {
    if (!fields || Object.keys(fields).length === 0) return;
    
    const sectionEl = document.createElement('div');
    sectionEl.className = 'section';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'section-title';
    titleEl.textContent = title;
    sectionEl.appendChild(titleEl);
    
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'object') continue; // Skip deeply nested objects for now
      
      const rowEl = document.createElement('div');
      rowEl.className = 'field-row';
      
      const infoEl = document.createElement('div');
      infoEl.className = 'field-info';
      
      const labelEl = document.createElement('div');
      labelEl.className = 'field-label';
      labelEl.textContent = key;
      
      const valueEl = document.createElement('div');
      valueEl.className = 'field-value';
      valueEl.textContent = value;
      
      infoEl.appendChild(labelEl);
      infoEl.appendChild(valueEl);
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(value.toString()).then(() => {
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
    }
    
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
