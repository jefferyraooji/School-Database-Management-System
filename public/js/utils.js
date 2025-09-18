// Utility functions for the School Database Management System

// API Configuration
const API_BASE = '/api';

// Show/Hide loading overlay
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Alert system
function showAlert(message, type = 'info', duration = 5000) {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icon = getAlertIcon(type);
    alert.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button type="button" class="alert-close" onclick="closeAlert(this)">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(alert);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            closeAlert(alert.querySelector('.alert-close'));
        }, duration);
    }
}

function getAlertIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

function closeAlert(button) {
    const alert = button.closest('.alert');
    if (alert) {
        alert.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }
}

// HTTP request helper
async function makeRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
    };

    const config = { ...defaultOptions, ...options };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('Request error:', error);
        throw error;
    }
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateStudentId(studentId) {
    const re = /^\d{8}$/;
    return re.test(studentId);
}

function validateTeacherId(teacherId) {
    const re = /^T\d{6}$/;
    return re.test(teacherId);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.toggle-password');
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Form helpers
function getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }
    
    return data;
}

function resetForm(formElement) {
    formElement.reset();
    
    // Clear any error states
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

function setFormErrors(formElement, errors) {
    // Clear previous errors
    const errorElements = formElement.querySelectorAll('.error-message');
    errorElements.forEach(el => el.remove());
    
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.classList.remove('error'));

    // Set new errors
    Object.keys(errors).forEach(fieldName => {
        const field = formElement.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.add('error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errors[fieldName];
            errorDiv.style.color = '#dc3545';
            errorDiv.style.fontSize = '0.85rem';
            errorDiv.style.marginTop = '0.25rem';
            
            field.parentNode.appendChild(errorDiv);
        }
    });
}

// Date formatting
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    const config = { ...defaultOptions, ...options };
    return new Date(date).toLocaleDateString('en-US', config);
}

function formatDateTime(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const config = { ...defaultOptions, ...options };
    return new Date(date).toLocaleDateString('en-US', config);
}

// Grade formatting
function formatGrade(percentage) {
    if (percentage === null || percentage === undefined) return 'N/A';
    return `${percentage.toFixed(1)}%`;
}

function getLetterGrade(percentage) {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
}

function getGradeColor(percentage) {
    if (percentage >= 90) return '#28a745'; // Green
    if (percentage >= 80) return '#17a2b8'; // Blue
    if (percentage >= 70) return '#ffc107'; // Yellow
    if (percentage >= 60) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
}

// Modal helpers
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function createModal(title, content, actions = []) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button type="button" class="close-btn" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${actions.length > 0 ? `
                <div class="modal-footer" style="padding: 1rem 2rem; border-top: 1px solid #e1e5e9; display: flex; justify-content: flex-end; gap: 1rem;">
                    ${actions.join('')}
                </div>
            ` : ''}
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });

    return modal;
}

// Table helpers
function createTable(headers, data, options = {}) {
    const table = document.createElement('table');
    table.className = 'table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        row.forEach(cell => {
            const td = document.createElement('td');
            if (typeof cell === 'object') {
                td.innerHTML = cell.html || cell.text || '';
                if (cell.className) td.className = cell.className;
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    
    // Wrap in container if responsive
    if (options.responsive !== false) {
        const container = document.createElement('div');
        container.className = 'table-container';
        container.appendChild(table);
        return container;
    }
    
    return table;
}

// Search and filter helpers
function filterTable(tableId, searchTerm, columnIndex = -1) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let match = false;

        if (columnIndex >= 0 && columnIndex < cells.length) {
            // Search specific column
            match = cells[columnIndex].textContent.toLowerCase().includes(term);
        } else {
            // Search all columns
            match = Array.from(cells).some(cell => 
                cell.textContent.toLowerCase().includes(term)
            );
        }

        row.style.display = match ? '' : 'none';
    });
}

// Local storage helpers
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

// Session storage helpers
function setSessionStorage(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to sessionStorage:', error);
    }
}

function getSessionStorage(key, defaultValue = null) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from sessionStorage:', error);
        return defaultValue;
    }
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Copied to clipboard!', 'success', 2000);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        showAlert('Failed to copy to clipboard', 'error', 3000);
        return false;
    }
}

// Export data as CSV
function exportToCSV(data, filename = 'export.csv') {
    const csv = data.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await makeRequest(`${API_BASE}/auth/status`);
        return response.isAuthenticated ? response.user : null;
    } catch (error) {
        console.error('Auth check failed:', error);
        return null;
    }
}

// Logout function
async function logout() {
    try {
        showLoading();
        await makeRequest(`${API_BASE}/auth/logout`, { method: 'POST' });
        showAlert('Logged out successfully', 'success', 2000);
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout failed', 'error');
    } finally {
        hideLoading();
    }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Close alerts on click outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });

    // Handle escape key for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        }
    });
});

