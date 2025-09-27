// Teacher dashboard functionality

let currentUser = null;
let dashboardData = null;
let courses = [];
let grades = [];
let students = [];

// Initialize teacher dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await initializeTeacherDashboard();
    setupEventListeners();
});

async function initializeTeacherDashboard() {
    try {
        showLoading();
        
        // Check authentication
        currentUser = await checkAuth();
        if (!currentUser || currentUser.role !== 'teacher') {
            window.location.href = '/?error=access_denied';
            return;
        }
        
        // Update user info in header
        updateUserInfo(currentUser);
        
        // Load dashboard data
        await loadDashboardData();
        
        // Show dashboard by default
        showSection('dashboard');
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Failed to load dashboard', 'error');
    } finally {
        hideLoading();
    }
}

function updateUserInfo(user) {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (userAvatar) {
        userAvatar.textContent = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    if (userName) {
        userName.textContent = user.fullName;
    }
    
    if (userRole) {
        userRole.textContent = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} • ${user.teacherId}`;
    }
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome back, ${user.firstName}!`;
    }
}

async function loadDashboardData() {
    try {
        const response = await makeRequest(`${API_BASE}/teacher/dashboard`);
        dashboardData = response.data;
        
        // Update dashboard components
        updateStatsGrid(dashboardData.statistics);
        updateRecentCourses(dashboardData.courses.slice(0, 3));
        updateRecentGrades(dashboardData.recentGrades.slice(0, 5));
        
        // Store data for other sections
        courses = dashboardData.courses;
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        throw error;
    }
}

function updateStatsGrid(stats) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card primary">
            <i class="fas fa-book"></i>
            <h3>${stats.totalCourses}</h3>
            <p>Active Courses</p>
        </div>
        <div class="stat-card success">
            <i class="fas fa-users"></i>
            <h3>${stats.totalStudents}</h3>
            <p>Total Students</p>
        </div>
        <div class="stat-card warning">
            <i class="fas fa-clock"></i>
            <h3>${stats.pendingGrades}</h3>
            <p>Pending Grades</p>
        </div>
        <div class="stat-card danger">
            <i class="fas fa-chart-line"></i>
            <h3>${stats.publishedGrades}</h3>
            <p>Published Grades</p>
        </div>
    `;
}

function updateRecentCourses(recentCourses) {
    const container = document.getElementById('recentCourses');
    if (!container) return;
    
    if (recentCourses.length === 0) {
        container.innerHTML = '<p class="text-center">No courses found. Create your first course!</p>';
        return;
    }
    
    container.innerHTML = recentCourses.map(course => `
        <div class="course-item" style="padding: 0.75rem 0; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h5 style="margin: 0; color: #333;">${course.courseCode} - ${course.courseName}</h5>
                    <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">
                        ${course.enrolledCount}/${course.maxStudents} students • ${course.credits} credits
                    </p>
                </div>
                <span class="badge badge-info">${course.semester} ${course.year}</span>
            </div>
        </div>
    `).join('');
}

function updateRecentGrades(recentGrades) {
    const container = document.getElementById('recentGrades');
    if (!container) return;
    
    if (recentGrades.length === 0) {
        container.innerHTML = '<p class="text-center">No grades found. Start grading assessments!</p>';
        return;
    }
    
    container.innerHTML = recentGrades.map(grade => `
        <div class="grade-item" style="padding: 0.75rem 0; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h6 style="margin: 0; color: #333;">${grade.student.firstName} ${grade.student.lastName}</h6>
                    <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">
                        ${grade.course.courseCode} - ${grade.assessmentName}
                    </p>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: bold; color: ${getGradeColor(grade.percentage)};">
                        ${formatGrade(grade.percentage)}
                    </span>
                    <br>
                    <span class="badge ${grade.isPublished ? 'badge-success' : 'badge-warning'}">
                        ${grade.isPublished ? 'Published' : 'Draft'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Section management
function showSection(sectionName) {
    // Hide all sections
    const sections = ['dashboard', 'courses', 'grades', 'students'];
    sections.forEach(section => {
        const element = document.getElementById(`${section}Section`);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}Section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Load section-specific data
        switch (sectionName) {
            case 'courses':
                loadCoursesSection();
                break;
            case 'grades':
                loadGradesSection();
                break;
            case 'students':
                loadStudentsSection();
                break;
        }
    }
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionName}`) {
            link.classList.add('active');
        }
    });
}

// Courses section
async function loadCoursesSection() {
    try {
        if (courses.length === 0) {
            const response = await makeRequest(`${API_BASE}/teacher/courses`);
            courses = response.courses;
        }
        
        displayCourses(courses);
    } catch (error) {
        console.error('Failed to load courses:', error);
        showAlert('Failed to load courses', 'error');
    }
}

function displayCourses(coursesToDisplay) {
    const container = document.getElementById('coursesContainer');
    if (!container) return;
    
    if (coursesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-book" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No courses found</h3>
                <p>Create your first course to get started!</p>
                <button type="button" class="btn btn-primary" onclick="showCreateCourseModal()">
                    <i class="fas fa-plus"></i> Create Course
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = coursesToDisplay.map(course => `
        <div class="card">
            <div class="card-header">
                <h4>${course.courseCode}</h4>
                <p>${course.courseName}</p>
            </div>
            <div class="card-body">
                <p><strong>Department:</strong> ${course.department}</p>
                <p><strong>Credits:</strong> ${course.credits}</p>
                <p><strong>Semester:</strong> ${course.semester} ${course.year}</p>
                <p><strong>Students:</strong> ${course.enrolledCount}/${course.maxStudents}</p>
                ${course.description ? `<p><strong>Description:</strong> ${course.description}</p>` : ''}
            </div>
            <div class="card-footer">
                <button type="button" class="btn btn-primary btn-sm" onclick="viewCourseDetails('${course._id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="manageCourseStudents('${course._id}')">
                    <i class="fas fa-users"></i> Manage Students
                </button>
            </div>
        </div>
    `).join('');
}

// Grades section
async function loadGradesSection() {
    try {
        showLoading();
        
        const [gradesResponse, coursesResponse] = await Promise.all([
            makeRequest(`${API_BASE}/teacher/grades`),
            courses.length > 0 ? Promise.resolve({ courses }) : makeRequest(`${API_BASE}/teacher/courses`)
        ]);
        
        grades = gradesResponse.grades;
        if (coursesResponse.courses) {
            courses = coursesResponse.courses;
        }
        
        // Populate course filter
        populateCourseFilter();
        
        // Display grades
        displayGrades(grades);
        
    } catch (error) {
        console.error('Failed to load grades:', error);
        showAlert('Failed to load grades', 'error');
    } finally {
        hideLoading();
    }
}

function populateCourseFilter() {
    const courseFilter = document.getElementById('courseFilter');
    if (!courseFilter || courses.length === 0) return;
    
    courseFilter.innerHTML = '<option value="">All Courses</option>' +
        courses.map(course => 
            `<option value="${course._id}">${course.courseCode} - ${course.courseName}</option>`
        ).join('');
}

function displayGrades(gradesToDisplay) {
    const container = document.getElementById('gradesTableContainer');
    if (!container) return;
    
    if (gradesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <i class="fas fa-chart-line" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No grades found</h3>
                <p>Start grading your students' assessments!</p>
                <button type="button" class="btn btn-primary" onclick="showAddGradeModal()">
                    <i class="fas fa-plus"></i> Add Grade
                </button>
            </div>
        `;
        return;
    }
    
    const headers = ['Student', 'Course', 'Assessment', 'Score', 'Grade', 'Status', 'Date', 'Actions'];
    const data = gradesToDisplay.map(grade => [
        `${grade.student.firstName} ${grade.student.lastName}`,
        grade.course.courseCode,
        `${grade.assessmentType.charAt(0).toUpperCase() + grade.assessmentType.slice(1)}: ${grade.assessmentName}`,
        `${grade.score}/${grade.maxScore}`,
        {
            html: `<span style="color: ${getGradeColor(grade.percentage)}; font-weight: bold;">${formatGrade(grade.percentage)} (${grade.letterGrade})</span>`
        },
        {
            html: `<span class="badge ${grade.isPublished ? 'badge-success' : 'badge-warning'}">${grade.isPublished ? 'Published' : 'Draft'}</span>`
        },
        formatDate(grade.gradedDate),
        {
            html: `
                <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="editGrade('${grade._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm ${grade.isPublished ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleGradePublication('${grade._id}', ${!grade.isPublished})" 
                            title="${grade.isPublished ? 'Unpublish' : 'Publish'}">
                        <i class="fas ${grade.isPublished ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteGrade('${grade._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `
        }
    ]);
    
    const table = createTable(headers, data);
    container.innerHTML = '';
    container.appendChild(table);
}

function filterGrades() {
    const courseFilter = document.getElementById('courseFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredGrades = grades;
    
    if (courseFilter) {
        filteredGrades = filteredGrades.filter(grade => grade.course._id === courseFilter);
    }
    
    if (statusFilter) {
        const isPublished = statusFilter === 'published';
        filteredGrades = filteredGrades.filter(grade => grade.isPublished === isPublished);
    }
    
    displayGrades(filteredGrades);
}

function searchGrades(searchTerm) {
    if (!searchTerm.trim()) {
        filterGrades();
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const filteredGrades = grades.filter(grade => {
        const studentName = `${grade.student.firstName} ${grade.student.lastName}`.toLowerCase();
        const assessmentName = grade.assessmentName.toLowerCase();
        const courseCode = grade.course.courseCode.toLowerCase();
        
        return studentName.includes(term) || assessmentName.includes(term) || courseCode.includes(term);
    });
    
    displayGrades(filteredGrades);
}

// Students section
async function loadStudentsSection() {
    try {
        showLoading();
        
        // Get all students from teacher's courses
        const uniqueStudents = new Map();
        
        for (const course of courses) {
            if (course.students) {
                course.students.forEach(student => {
                    if (!uniqueStudents.has(student._id)) {
                        uniqueStudents.set(student._id, {
                            ...student,
                            courses: [course]
                        });
                    } else {
                        uniqueStudents.get(student._id).courses.push(course);
                    }
                });
            }
        }
        
        students = Array.from(uniqueStudents.values());
        displayStudents(students);
        
    } catch (error) {
        console.error('Failed to load students:', error);
        showAlert('Failed to load students', 'error');
    } finally {
        hideLoading();
    }
}

function displayStudents(studentsToDisplay) {
    const container = document.getElementById('studentsContainer');
    if (!container) return;
    
    if (studentsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No students found</h3>
                <p>Students will appear here once they enroll in your courses.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="grid grid-3">
            ${studentsToDisplay.map(student => `
                <div class="card">
                    <div class="card-header">
                        <h4>${student.firstName} ${student.lastName}</h4>
                        <p>ID: ${student.studentId}</p>
                    </div>
                    <div class="card-body">
                        <p><strong>Email:</strong> ${student.email}</p>
                        <p><strong>Department:</strong> ${student.department || 'Not specified'}</p>
                        <p><strong>Enrolled Courses:</strong></p>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            ${student.courses.map(course => `<li>${course.courseCode}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn btn-primary btn-sm" onclick="viewStudentGrades('${student._id}')">
                            <i class="fas fa-chart-line"></i> View Grades
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="contactStudent('${student._id}')">
                            <i class="fas fa-envelope"></i> Contact
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function searchStudents(searchTerm) {
    if (!searchTerm.trim()) {
        displayStudents(students);
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const filteredStudents = students.filter(student => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const studentId = student.studentId.toLowerCase();
        const email = student.email.toLowerCase();
        
        return fullName.includes(term) || studentId.includes(term) || email.includes(term);
    });
    
    displayStudents(filteredStudents);
}

// Modal functions
function showCreateCourseModal() {
    showModal('createCourseModal');
}

function showAddGradeModal() {
    // Populate course dropdown
    const courseSelect = document.getElementById('gradeCourseId');
    courseSelect.innerHTML = '<option value="">Select Course</option>' +
        courses.map(course => 
            `<option value="${course._id}">${course.courseCode} - ${course.courseName}</option>`
        ).join('');
    
    // Reset form
    resetForm(document.getElementById('addGradeForm'));
    document.getElementById('gradeModalTitle').textContent = 'Add New Grade';
    
    showModal('addGradeModal');
}

function updateStudentList() {
    const courseId = document.getElementById('gradeCourseId').value;
    const studentSelect = document.getElementById('gradeStudentId');
    
    if (!courseId) {
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        return;
    }
    
    const selectedCourse = courses.find(course => course._id === courseId);
    if (!selectedCourse || !selectedCourse.students) {
        studentSelect.innerHTML = '<option value="">No students enrolled</option>';
        return;
    }
    
    studentSelect.innerHTML = '<option value="">Select Student</option>' +
        selectedCourse.students.map(student => 
            `<option value="${student._id}">${student.firstName} ${student.lastName} (${student.studentId})</option>`
        ).join('');
}

// Event listeners
function setupEventListeners() {
    // Create course form
    const createCourseForm = document.getElementById('createCourseForm');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', handleCreateCourse);
    }
    
    // Add grade form
    const addGradeForm = document.getElementById('addGradeForm');
    if (addGradeForm) {
        addGradeForm.addEventListener('submit', handleAddGrade);
    }
}

async function handleCreateCourse(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = getFormData(form);
    
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/teacher/courses`, {
            method: 'POST',
            body: formData
        });
        
        showAlert('Course created successfully!', 'success');
        hideModal('createCourseModal');
        resetForm(form);
        
        // Refresh courses data
        courses.push(response.course);
        if (document.getElementById('coursesSection').style.display !== 'none') {
            displayCourses(courses);
        }
        
        // Refresh dashboard if visible
        if (document.getElementById('dashboardSection').style.display !== 'none') {
            await loadDashboardData();
        }
        
    } catch (error) {
        console.error('Create course error:', error);
        showAlert(error.message || 'Failed to create course', 'error');
    } finally {
        hideLoading();
    }
}

async function handleAddGrade(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = getFormData(form);
    
    // Convert string numbers to actual numbers
    formData.score = parseFloat(formData.score);
    formData.maxScore = parseFloat(formData.maxScore);
    if (formData.weight) formData.weight = parseFloat(formData.weight);
    
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/teacher/grades`, {
            method: 'POST',
            body: formData
        });
        
        showAlert('Grade saved successfully!', 'success');
        hideModal('addGradeModal');
        resetForm(form);
        
        // Refresh grades data
        await loadGradesSection();
        
        // Refresh dashboard if visible
        if (document.getElementById('dashboardSection').style.display !== 'none') {
            await loadDashboardData();
        }
        
    } catch (error) {
        console.error('Add grade error:', error);
        showAlert(error.message || 'Failed to save grade', 'error');
    } finally {
        hideLoading();
    }
}

// Grade management functions
async function toggleGradePublication(gradeId, publish) {
    try {
        showLoading();
        
        await makeRequest(`${API_BASE}/teacher/grades/${gradeId}/publish`, {
            method: 'PATCH',
            body: { publish }
        });
        
        showAlert(`Grade ${publish ? 'published' : 'unpublished'} successfully!`, 'success');
        
        // Update local data
        const grade = grades.find(g => g._id === gradeId);
        if (grade) {
            grade.isPublished = publish;
        }
        
        // Refresh display
        filterGrades();
        
    } catch (error) {
        console.error('Toggle publication error:', error);
        showAlert(error.message || 'Failed to update grade publication', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteGrade(gradeId) {
    if (!confirm('Are you sure you want to delete this grade? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        
        await makeRequest(`${API_BASE}/teacher/grades/${gradeId}`, {
            method: 'DELETE'
        });
        
        showAlert('Grade deleted successfully!', 'success');
        
        // Remove from local data
        grades = grades.filter(g => g._id !== gradeId);
        
        // Refresh display
        filterGrades();
        
    } catch (error) {
        console.error('Delete grade error:', error);
        showAlert(error.message || 'Failed to delete grade', 'error');
    } finally {
        hideLoading();
    }
}

// Utility functions
function viewCourseDetails(courseId) {
    const course = courses.find(c => c._id === courseId);
    if (!course) return;
    
    const modal = createModal(
        `${course.courseCode} - ${course.courseName}`,
        `
        <div class="course-details">
            <p><strong>Department:</strong> ${course.department}</p>
            <p><strong>Credits:</strong> ${course.credits}</p>
            <p><strong>Semester:</strong> ${course.semester} ${course.year}</p>
            <p><strong>Students:</strong> ${course.enrolledCount}/${course.maxStudents}</p>
            ${course.description ? `<p><strong>Description:</strong> ${course.description}</p>` : ''}
            ${course.schedule ? `
                <p><strong>Schedule:</strong></p>
                <ul>
                    ${course.schedule.days ? `<li>Days: ${course.schedule.days.join(', ')}</li>` : ''}
                    ${course.schedule.startTime && course.schedule.endTime ? 
                        `<li>Time: ${course.schedule.startTime} - ${course.schedule.endTime}</li>` : ''}
                    ${course.schedule.room ? `<li>Room: ${course.schedule.room}</li>` : ''}
                </ul>
            ` : ''}
        </div>
        `,
        [
            '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove(); document.body.style.overflow = \'auto\';">Close</button>'
        ]
    );
}

function manageCourseStudents(courseId) {
    // This would open a modal to manage course enrollment
    showAlert('Student management feature coming soon!', 'info');
}

function editGrade(gradeId) {
    const grade = grades.find(g => g._id === gradeId);
    if (!grade) {
        showAlert('Grade not found', 'error');
        return;
    }
    
    const modal = createModal(
        `Edit Grade - ${grade.assessmentName}`,
        `
        <form id="editGradeForm">
            <div class="form-group">
                <label for="editAssessmentName">Assessment Name</label>
                <input type="text" id="editAssessmentName" name="assessmentName" 
                       value="${grade.assessmentName}" required class="form-control">
            </div>
            
            <div class="form-group">
                <label for="editPercentage">Percentage Score</label>
                <input type="number" id="editPercentage" name="percentage" 
                       value="${grade.percentage}" min="0" max="100" step="0.1" 
                       required class="form-control" onchange="updateLetterGrade()">
            </div>
            
            <div class="form-group">
                <label for="editLetterGrade">Letter Grade</label>
                <select id="editLetterGrade" name="letterGrade" class="form-control">
                    <option value="A+" ${grade.letterGrade === 'A+' ? 'selected' : ''}>A+ (97-100)</option>
                    <option value="A" ${grade.letterGrade === 'A' ? 'selected' : ''}>A (93-96)</option>
                    <option value="A-" ${grade.letterGrade === 'A-' ? 'selected' : ''}>A- (90-92)</option>
                    <option value="B+" ${grade.letterGrade === 'B+' ? 'selected' : ''}>B+ (87-89)</option>
                    <option value="B" ${grade.letterGrade === 'B' ? 'selected' : ''}>B (83-86)</option>
                    <option value="B-" ${grade.letterGrade === 'B-' ? 'selected' : ''}>B- (80-82)</option>
                    <option value="C+" ${grade.letterGrade === 'C+' ? 'selected' : ''}>C+ (77-79)</option>
                    <option value="C" ${grade.letterGrade === 'C' ? 'selected' : ''}>C (73-76)</option>
                    <option value="C-" ${grade.letterGrade === 'C-' ? 'selected' : ''}>C- (70-72)</option>
                    <option value="D+" ${grade.letterGrade === 'D+' ? 'selected' : ''}>D+ (67-69)</option>
                    <option value="D" ${grade.letterGrade === 'D' ? 'selected' : ''}>D (63-66)</option>
                    <option value="D-" ${grade.letterGrade === 'D-' ? 'selected' : ''}>D- (60-62)</option>
                    <option value="F" ${grade.letterGrade === 'F' ? 'selected' : ''}>F (0-59)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="editFeedback">Feedback</label>
                <textarea id="editFeedback" name="feedback" rows="3" 
                          class="form-control" placeholder="Enter feedback for the student...">${grade.feedback || ''}</textarea>
            </div>
            
            <div class="form-group">
                <div class="form-check">
                    <input type="checkbox" id="editIsPublished" name="isPublished" 
                           class="form-check-input" ${grade.isPublished ? 'checked' : ''}>
                    <label for="editIsPublished" class="form-check-label">
                        Publish grade (make visible to student)
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label>Student Information</label>
                <p class="text-muted">
                    <strong>Student:</strong> ${grade.student.firstName} ${grade.student.lastName} (${grade.student.studentId})<br>
                    <strong>Course:</strong> ${grade.course.courseCode} - ${grade.course.courseName}
                </p>
            </div>
        </form>
        `,
        [
            '<button type="button" class="btn btn-primary" onclick="saveGradeEdit(\'' + gradeId + '\')">Save Changes</button>',
            '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove(); document.body.style.overflow = \'auto\';">Cancel</button>'
        ]
    );
}

function updateLetterGrade() {
    const percentage = parseFloat(document.getElementById('editPercentage').value);
    const letterGradeSelect = document.getElementById('editLetterGrade');
    
    if (isNaN(percentage)) return;
    
    let letterGrade = 'F';
    if (percentage >= 97) letterGrade = 'A+';
    else if (percentage >= 93) letterGrade = 'A';
    else if (percentage >= 90) letterGrade = 'A-';
    else if (percentage >= 87) letterGrade = 'B+';
    else if (percentage >= 83) letterGrade = 'B';
    else if (percentage >= 80) letterGrade = 'B-';
    else if (percentage >= 77) letterGrade = 'C+';
    else if (percentage >= 73) letterGrade = 'C';
    else if (percentage >= 70) letterGrade = 'C-';
    else if (percentage >= 67) letterGrade = 'D+';
    else if (percentage >= 63) letterGrade = 'D';
    else if (percentage >= 60) letterGrade = 'D-';
    
    letterGradeSelect.value = letterGrade;
}

async function saveGradeEdit(gradeId) {
    try {
        const form = document.getElementById('editGradeForm');
        const formData = new FormData(form);
        
        const updateData = {
            assessmentName: formData.get('assessmentName'),
            percentage: parseFloat(formData.get('percentage')),
            letterGrade: formData.get('letterGrade'),
            feedback: formData.get('feedback'),
            isPublished: formData.has('isPublished')
        };
        
        // Validate
        if (!updateData.assessmentName.trim()) {
            showAlert('Assessment name is required', 'error');
            return;
        }
        
        if (isNaN(updateData.percentage) || updateData.percentage < 0 || updateData.percentage > 100) {
            showAlert('Percentage must be between 0 and 100', 'error');
            return;
        }
        
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/teacher/grades/${gradeId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        showAlert(response.message, 'success');
        
        // Close modal
        document.querySelector('.modal').remove();
        document.body.style.overflow = 'auto';
        
        // Refresh grades data
        await loadGradesSection();
        
        // Update dashboard if visible
        if (document.getElementById('dashboardSection').style.display !== 'none') {
            await loadDashboardData();
        }
        
    } catch (error) {
        console.error('Save grade edit error:', error);
        showAlert(error.message || 'Failed to update grade', 'error');
    } finally {
        hideLoading();
    }
}

function viewStudentGrades(studentId) {
    const student = students.find(s => s._id === studentId);
    if (!student) return;
    
    const studentGrades = grades.filter(g => g.student._id === studentId);
    
    const modal = createModal(
        `Grades for ${student.firstName} ${student.lastName}`,
        `
        <div class="student-grades">
            ${studentGrades.length === 0 ? 
                '<p>No grades found for this student.</p>' :
                studentGrades.map(grade => `
                    <div class="grade-item" style="padding: 1rem; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <h5 style="margin: 0;">${grade.course.courseCode} - ${grade.assessmentName}</h5>
                            <span style="color: ${getGradeColor(grade.percentage)}; font-weight: bold; font-size: 1.2rem;">
                                ${formatGrade(grade.percentage)}
                            </span>
                        </div>
                        <p style="margin: 0; color: #666;">
                            ${grade.assessmentType.charAt(0).toUpperCase() + grade.assessmentType.slice(1)} • 
                            Score: ${grade.score}/${grade.maxScore} • 
                            Grade: ${grade.letterGrade} • 
                            ${grade.isPublished ? 'Published' : 'Draft'}
                        </p>
                        ${grade.feedback ? `<p style="margin: 0.5rem 0 0 0; font-style: italic;">"${grade.feedback}"</p>` : ''}
                    </div>
                `).join('')
            }
        </div>
        `,
        [
            '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove(); document.body.style.overflow = \'auto\';">Close</button>'
        ]
    );
}

function contactStudent(studentId) {
    const student = students.find(s => s._id === studentId);
    if (!student) return;
    
    // Open email client
    window.location.href = `mailto:${student.email}?subject=Regarding your courses`;
}

function exportGrades() {
    if (grades.length === 0) {
        showAlert('No grades to export', 'warning');
        return;
    }
    
    const csvData = [
        ['Student Name', 'Student ID', 'Course', 'Assessment Type', 'Assessment Name', 'Score', 'Max Score', 'Percentage', 'Letter Grade', 'Status', 'Date']
    ];
    
    grades.forEach(grade => {
        csvData.push([
            `${grade.student.firstName} ${grade.student.lastName}`,
            grade.student.studentId,
            grade.course.courseCode,
            grade.assessmentType,
            grade.assessmentName,
            grade.score,
            grade.maxScore,
            grade.percentage.toFixed(2),
            grade.letterGrade,
            grade.isPublished ? 'Published' : 'Draft',
            formatDate(grade.gradedDate)
        ]);
    });
    
    exportToCSV(csvData, `grades_${new Date().toISOString().split('T')[0]}.csv`);
    showAlert('Grades exported successfully!', 'success');
}

