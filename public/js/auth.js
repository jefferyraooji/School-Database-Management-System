// Authentication functionality for the School Database Management System

// Show/hide authentication sections
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    resetForm(document.getElementById('loginForm'));
}

function showRegister() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    resetForm(document.getElementById('registerForm'));
}

// Toggle role-specific fields in registration
function toggleRoleFields() {
    const role = document.getElementById('registerRole').value;
    const studentFields = document.getElementById('studentFields');
    const teacherFields = document.getElementById('teacherFields');
    
    // Hide all role fields first
    studentFields.style.display = 'none';
    teacherFields.style.display = 'none';
    
    // Clear field requirements
    document.getElementById('registerStudentId').required = false;
    document.getElementById('registerTeacherId').required = false;
    
    // Show relevant fields and set requirements
    if (role === 'student') {
        studentFields.style.display = 'block';
        document.getElementById('registerStudentId').required = true;
    } else if (role === 'teacher') {
        teacherFields.style.display = 'block';
        document.getElementById('registerTeacherId').required = true;
    }
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Check if user is already logged in
    checkAuthStatus();
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleRegister();
        });
    }
});

async function handleLogin() {
    const form = document.getElementById('loginForm');
    const formData = getFormData(form);
    
    // Basic validation
    if (!formData.identifier || !formData.password || !formData.role) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: formData
        });
        
        showAlert(response.message, 'success');
        
        // Redirect based on role
        setTimeout(() => {
            window.location.href = response.redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister() {
    const form = document.getElementById('registerForm');
    const formData = getFormData(form);
    
    // Validate form
    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
        setFormErrors(form, validation.errors);
        showAlert('Please fix the form errors', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/auth/register`, {
            method: 'POST',
            body: formData
        });
        
        showAlert(response.message, 'success');
        
        // Clear form and switch to login
        resetForm(form);
        setTimeout(() => {
            showLogin();
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'Registration failed', 'error');
        
        // If server returns field-specific errors
        if (error.details && typeof error.details === 'object') {
            setFormErrors(form, error.details);
        }
    } finally {
        hideLoading();
    }
}

function validateRegistrationForm(data) {
    const errors = {};
    let isValid = true;
    
    // Required fields
    const requiredFields = ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword', 'role'];
    requiredFields.forEach(field => {
        if (!data[field]) {
            errors[field] = 'This field is required';
            isValid = false;
        }
    });
    
    // Email validation
    if (data.email && !validateEmail(data.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
    }
    
    // Username validation
    if (data.username && (data.username.length < 3 || data.username.length > 30)) {
        errors.username = 'Username must be between 3 and 30 characters';
        isValid = false;
    }
    
    // Password validation
    if (data.password && !validatePassword(data.password)) {
        errors.password = 'Password must be at least 6 characters long';
        isValid = false;
    }
    
    // Confirm password validation
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
    }
    
    // Role-specific validation
    if (data.role === 'student') {
        if (!data.studentId) {
            errors.studentId = 'Student ID is required';
            isValid = false;
        } else if (!validateStudentId(data.studentId)) {
            errors.studentId = 'Student ID must be 8 digits';
            isValid = false;
        }
    } else if (data.role === 'teacher') {
        if (!data.teacherId) {
            errors.teacherId = 'Teacher ID is required';
            isValid = false;
        } else if (!validateTeacherId(data.teacherId)) {
            errors.teacherId = 'Teacher ID must start with T followed by 6 digits';
            isValid = false;
        }
    }
    
    return { isValid, errors };
}

async function checkAuthStatus() {
    try {
        const user = await checkAuth();
        if (user) {
            // User is already logged in, redirect to appropriate dashboard
            const redirectUrl = user.role === 'teacher' ? '/teacher' : '/student';
            window.location.href = redirectUrl;
        }
    } catch (error) {
        // User is not logged in, stay on login page
        console.log('User not authenticated');
    }
}

// Handle URL parameters (like error messages)
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error) {
        let errorMessage = 'An error occurred';
        switch (error) {
            case 'login_required':
                errorMessage = 'Please log in to access that page';
                break;
            case 'session_expired':
                errorMessage = 'Your session has expired. Please log in again';
                break;
            case 'access_denied':
                errorMessage = 'Access denied. You do not have permission to access that resource';
                break;
            default:
                errorMessage = error;
        }
        showAlert(errorMessage, 'error');
    }
    
    if (message) {
        showAlert(message, 'info');
    }
    
    // Clean up URL
    if (error || message) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

// Initialize URL parameter handling
document.addEventListener('DOMContentLoaded', function() {
    handleUrlParameters();
});

// Forgot password functionality (placeholder)
function showForgotPassword() {
    const modal = createModal(
        'Reset Password',
        `
        <p>Password reset functionality is not implemented in this demo.</p>
        <p>Please contact your system administrator for password reset assistance.</p>
        <div class="form-group mt-3">
            <label for="resetEmail">Enter your email address:</label>
            <input type="email" id="resetEmail" class="form-control" placeholder="your.email@example.com" disabled>
        </div>
        `,
        [
            '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove(); document.body.style.overflow = \'auto\';">Close</button>'
        ]
    );
}

// Demo accounts information
function showDemoAccounts() {
    const modal = createModal(
        'Demo Accounts',
        `
        <p>You can use these demo accounts to test the system:</p>
        
        <h4><i class="fas fa-chalkboard-teacher"></i> Teacher Account</h4>
        <div class="demo-account">
            <p><strong>Email:</strong> teacher@demo.com</p>
            <p><strong>Username:</strong> teacher1</p>
            <p><strong>Teacher ID:</strong> T123456</p>
            <p><strong>Password:</strong> teacher123</p>
        </div>
        
        <h4><i class="fas fa-user-graduate"></i> Student Account</h4>
        <div class="demo-account">
            <p><strong>Email:</strong> student@demo.com</p>
            <p><strong>Username:</strong> student1</p>
            <p><strong>Student ID:</strong> 12345678</p>
            <p><strong>Password:</strong> student123</p>
        </div>
        
        <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle"></i>
            <span>Note: These are demo accounts for testing purposes only.</span>
        </div>
        `,
        [
            '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove(); document.body.style.overflow = \'auto\';">Close</button>'
        ]
    );
    
    // Add some styling for demo accounts
    const style = document.createElement('style');
    style.textContent = `
        .demo-account {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid #667eea;
        }
        .demo-account p {
            margin: 0.25rem 0;
            font-family: 'Courier New', monospace;
        }
        .demo-account strong {
            color: #333;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
}

// Add demo accounts link to login form
document.addEventListener('DOMContentLoaded', function() {
    const loginCard = document.querySelector('.auth-card');
    if (loginCard && window.location.pathname === '/') {
        const demoLink = document.createElement('div');
        demoLink.className = 'text-center mt-3';
        demoLink.innerHTML = `
            <button type="button" onclick="showDemoAccounts()" class="link-btn">
                <i class="fas fa-question-circle"></i> View Demo Accounts
            </button>
        `;
        loginCard.appendChild(demoLink);
    }
});

