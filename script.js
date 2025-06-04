// Journal entries storage
        let journalEntries = [];
        const API_BASE_URL = '/api';

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

            // Load existing entries from backend
            loadEntries();
        }

        async function saveEntry() {
            const date = document.getElementById('entryDate').value;
            const content = document.getElementById('entryContent').value.trim();

            if (!date || !content) {
                showNotification('Please fill in both date and content.', 'error');
                return;
            }

            try {
                // Show loading state
                const saveBtn = document.querySelector('.btn-primary');
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;

                const response = await fetch(`${API_BASE_URL}/entries`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ date, content })
                });

                const result = await response.json();

                if (result.success) {
                    showNotification(result.message, 'success');
                    clearForm();
                    await loadEntries(); // Reload entries
                } else {
                    showNotification(result.message || 'Failed to save entry', 'error');
                }
            } catch (error) {
                console.error('Error saving entry:', error);
                showNotification('Failed to save entry. Please try again.', 'error');
            } finally {
                // Reset button state
                const saveBtn = document.querySelector('.btn-primary');
                saveBtn.textContent = 'Save Entry';
                saveBtn.disabled = false;
            }
        }

        function clearForm() {
            document.getElementById('entryContent').value = '';
            document.getElementById('charCount').textContent = '0';
            document.getElementById('entryDate').valueAsDate = new Date();
        }

        async function deleteEntry(id) {
            if (!confirm('Are you sure you want to delete this entry?')) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.success) {
                    showNotification(result.message, 'success');
                    await loadEntries(); // Reload entries
                } else {
                    showNotification(result.message || 'Failed to delete entry', 'error');
                }
            } catch (error) {
                console.error('Error deleting entry:', error);
                showNotification('Failed to delete entry. Please try again.', 'error');
            }
        }

        function editEntry(id) {
            const entry = journalEntries.find(entry => entry._id === id);
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

            entriesList.innerHTML = journalEntries.map(entry => `
                <div class="entry-card">
                    <div class="entry-date">${formatDate(entry.date)}</div>
                    <div class="entry-content">${entry.content.replace(/\n/g, '<br>')}</div>
                    <div class="entry-actions">
                        <button class="btn btn-secondary btn-small" onclick="editEntry('${entry._id}')">Edit</button>
                        <button class="btn btn-secondary btn-small" onclick="deleteEntry('${entry._id}')">Delete</button>
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

        async function loadEntries() {
            try {
                const response = await fetch(`${API_BASE_URL}/entries`);
                const result = await response.json();

                if (result.success) {
                    journalEntries = result.data;
                    displayEntries();
                } else {
                    console.error('Failed to load entries:', result.message);
                    showNotification('Failed to load entries', 'error');
                }
            } catch (error) {
                console.error('Error loading entries:', error);
                showNotification('Failed to connect to server', 'error');
            }
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