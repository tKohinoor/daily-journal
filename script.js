// Journal entries storage
let journalEntries = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set current date
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Set default date to today
    document.getElementById('entryDate').valueAsDate = today;

    // Character counter
    const textarea = document.getElementById('entryContent');
    const charCount = document.getElementById('charCount');
            
    textarea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });

    // Load existing entries
    loadEntries();
    displayEntries();
}

function saveEntry() {
    const date = document.getElementById('entryDate').value;
    const content = document.getElementById('entryContent').value.trim();

    if (!date || !content) {
        showNotification('Please fill in both date and content.', 'error');
        return;
    }

    // Check if entry for this date already exists
    const existingIndex = journalEntries.findIndex(entry => entry.date === date);
            
    if (existingIndex !== -1) {
        // Update existing entry
        journalEntries[existingIndex] = {
            date: date,
            content: content,
            timestamp: new Date().toISOString()
        };
        showNotification('Entry updated successfully!', 'success');
    } else {
        // Add new entry
        const entry = {
            id: Date.now(),
            date: date,
            content: content,
            timestamp: new Date().toISOString()
        };
        journalEntries.unshift(entry);
        showNotification('Entry saved successfully!', 'success');
    }

    saveEntries();
    displayEntries();
    clearForm();
}

function clearForm() {
    document.getElementById('entryContent').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('entryDate').valueAsDate = new Date();
}

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        journalEntries = journalEntries.filter(entry => entry.id !== id);
        saveEntries();
        displayEntries();
        showNotification('Entry deleted successfully!', 'success');
    }
}

function editEntry(id) {
    const entry = journalEntries.find(entry => entry.id === id);
    if (entry) {
        document.getElementById('entryDate').value = entry.date;
        document.getElementById('entryContent').value = entry.content;
        document.getElementById('charCount').textContent = entry.content.length;
                
        // Scroll to form
        document.querySelector('.entry-form').scrollIntoView({ behavior: 'smooth' });
    }
}

function displayEntries() {
    const entriesList = document.getElementById('entriesList');
            
    if (journalEntries.length === 0) {
        entriesList.innerHTML = '<div class="no-entries">No journal entries yet. Start writing your first entry above! ✨</div>';
        return;
    }

    // Sort entries by date (newest first)
    const sortedEntries = [...journalEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

    entriesList.innerHTML = sortedEntries.map(entry => `
        <div class="entry-card">
            <div class="entry-date">${formatDate(entry.date)}</div>
            <div class="entry-content">${entry.content.replace(/\n/g, '<br>')}</div>
            <div class="entry-actions">
                <button class="btn btn-secondary btn-small" onclick="editEntry(${entry.id})">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="deleteEntry(${entry.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function saveEntries() {
    // In a real application, this would save to a database
    // For now, we'll just keep them in memory during the session
}

function loadEntries() {
    // In a real application, this would load from a database
    // For now, we'll start with empty entries
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
