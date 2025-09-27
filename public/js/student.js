// Student dashboard functionality

let currentUser = null;
let dashboardData = null;
let courses = [];
let grades = [];
let analytics = null;
let transcript = null;
let availableCourses = [];
let filteredAvailableCourses = [];

// Initialize student dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await initializeStudentDashboard();
});

async function initializeStudentDashboard() {
    try {
        showLoading();
        
        // Check authentication
        currentUser = await checkAuth();
        if (!currentUser || currentUser.role !== 'student') {
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
        userRole.textContent = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} • ${user.studentId}`;
    }
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome back, ${user.firstName}!`;
    }
}

async function loadDashboardData() {
    try {
        const response = await makeRequest(`${API_BASE}/student/dashboard`);
        dashboardData = response.data;
        
        // Update dashboard components
        updateStatsGrid(dashboardData.statistics);
        updateDashboardCourses(dashboardData.courses.slice(0, 3));
        updateDashboardGrades(dashboardData.recentGrades.slice(0, 5));
        updateCoursePerformance(dashboardData.courseAverages);
        
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
            <p>Enrolled Courses</p>
        </div>
        <div class="stat-card success">
            <i class="fas fa-credit-card"></i>
            <h3>${stats.totalCredits}</h3>
            <p>Total Credits</p>
        </div>
        <div class="stat-card warning">
            <i class="fas fa-star"></i>
            <h3>${stats.overallGPA}</h3>
            <p>Overall GPA</p>
        </div>
        <div class="stat-card danger">
            <i class="fas fa-chart-line"></i>
            <h3>${stats.totalGrades}</h3>
            <p>Graded Items</p>
        </div>
    `;
}

function updateDashboardCourses(dashboardCourses) {
    const container = document.getElementById('dashboardCourses');
    if (!container) return;
    
    if (dashboardCourses.length === 0) {
        container.innerHTML = '<p class="text-center">No courses enrolled. Contact your advisor for enrollment.</p>';
        return;
    }
    
    container.innerHTML = dashboardCourses.map(course => `
        <div class="course-item" style="padding: 0.75rem 0; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h5 style="margin: 0; color: #333;">${course.courseCode} - ${course.courseName}</h5>
                    <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">
                        ${course.teacher.firstName} ${course.teacher.lastName} • ${course.credits} credits
                    </p>
                </div>
                <span class="badge badge-info">${course.semester} ${course.year}</span>
            </div>
        </div>
    `).join('');
}

function updateDashboardGrades(recentGrades) {
    const container = document.getElementById('dashboardGrades');
    if (!container) return;
    
    if (recentGrades.length === 0) {
        container.innerHTML = '<p class="text-center">No grades available yet.</p>';
        return;
    }
    
    container.innerHTML = recentGrades.map(grade => `
        <div class="grade-item" style="padding: 0.75rem 0; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h6 style="margin: 0; color: #333;">${grade.course.courseCode} - ${grade.assessmentName}</h6>
                    <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">
                        ${grade.assessmentType.charAt(0).toUpperCase() + grade.assessmentType.slice(1)} • ${formatDate(grade.gradedDate)}
                    </p>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: bold; color: ${getGradeColor(grade.percentage)};">
                        ${formatGrade(grade.percentage)}
                    </span>
                    <br>
                    <span class="badge badge-success">${grade.letterGrade}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCoursePerformance(courseAverages) {
    const container = document.getElementById('coursePerformance');
    if (!container) return;
    
    if (courseAverages.length === 0) {
        container.innerHTML = '<p class="text-center">No course performance data available yet.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="course-performance-grid" style="display: grid; gap: 1rem;">
            ${courseAverages.map(course => `
                <div class="performance-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div>
                        <h5 style="margin: 0; color: #333;">${course.course} - ${course.courseName}</h5>
                        <p style="margin: 0.25rem 0 0 0; color: #666;">${course.credits} credits</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${getGradeColor(course.average)};">
                            ${formatGrade(course.average)}
                        </div>
                        <div class="badge badge-${getGradeBadgeClass(course.average)}" style="margin-top: 0.25rem;">
                            ${getLetterGrade(course.average)}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getGradeBadgeClass(percentage) {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'danger';
}

// Section management
function showSection(sectionName) {
    // Hide all sections
    const sections = ['dashboard', 'courses', 'enrollment', 'grades', 'analytics', 'transcript'];
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
            case 'enrollment':
                loadEnrollmentSection();
                break;
            case 'grades':
                loadGradesSection();
                break;
            case 'analytics':
                loadAnalyticsSection();
                break;
            case 'transcript':
                loadTranscriptSection();
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
            const response = await makeRequest(`${API_BASE}/student/courses`);
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
                <p>You are not enrolled in any courses yet. Contact your advisor for enrollment assistance.</p>
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
                <p><strong>Teacher:</strong> ${course.teacher.firstName} ${course.teacher.lastName}</p>
                <p><strong>Department:</strong> ${course.department}</p>
                <p><strong>Credits:</strong> ${course.credits}</p>
                <p><strong>Semester:</strong> ${course.semester} ${course.year}</p>
                ${course.average !== null ? `
                    <p><strong>Current Grade:</strong> 
                        <span style="color: ${getGradeColor(course.average)}; font-weight: bold;">
                            ${formatGrade(course.average)} (${course.letterGrade})
                        </span>
                    </p>
                ` : '<p><strong>Current Grade:</strong> No grades yet</p>'}
                ${course.description ? `<p><strong>Description:</strong> ${course.description}</p>` : ''}
            </div>
            <div class="card-footer">
                <button type="button" class="btn btn-primary btn-sm" onclick="viewCourseDetails('${course._id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="viewCourseGrades('${course._id}')">
                    <i class="fas fa-chart-line"></i> View Grades
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="withdrawFromCourse('${course._id}', '${course.courseCode}', '${course.courseName}')">
                    <i class="fas fa-times-circle"></i> Withdraw
                </button>
            </div>
        </div>
    `).join('');
}

function searchCourses(searchTerm) {
    if (!searchTerm.trim()) {
        displayCourses(courses);
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const filteredCourses = courses.filter(course => {
        const courseCode = course.courseCode.toLowerCase();
        const courseName = course.courseName.toLowerCase();
        const teacherName = `${course.teacher.firstName} ${course.teacher.lastName}`.toLowerCase();
        
        return courseCode.includes(term) || courseName.includes(term) || teacherName.includes(term);
    });
    
    displayCourses(filteredCourses);
}

// Grades section
async function loadGradesSection() {
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/student/grades`);
        grades = response.grades;
        
        // Populate filters
        populateGradeFilters();
        
        // Display grades
        displayStudentGrades(grades);
        
    } catch (error) {
        console.error('Failed to load grades:', error);
        showAlert('Failed to load grades', 'error');
    } finally {
        hideLoading();
    }
}

function populateGradeFilters() {
    const courseFilter = document.getElementById('courseGradeFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    
    if (courseFilter && courses.length > 0) {
        courseFilter.innerHTML = '<option value="">All Courses</option>' +
            courses.map(course => 
                `<option value="${course._id}">${course.courseCode} - ${course.courseName}</option>`
            ).join('');
    }
    
    if (semesterFilter && grades.length > 0) {
        const semesters = [...new Set(grades.map(grade => `${grade.course.semester} ${grade.course.year}`))];
        semesterFilter.innerHTML = '<option value="">All Semesters</option>' +
            semesters.map(semester => `<option value="${semester}">${semester}</option>`).join('');
    }
}

function displayStudentGrades(gradesToDisplay) {
    const container = document.getElementById('gradesTableContainer');
    if (!container) return;
    
    if (gradesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <i class="fas fa-chart-line" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No grades found</h3>
                <p>No published grades available yet. Check back later!</p>
            </div>
        `;
        return;
    }
    
    const headers = ['Course', 'Assessment', 'Type', 'Score', 'Grade', 'Teacher', 'Date'];
    const data = gradesToDisplay.map(grade => [
        grade.course.courseCode,
        grade.assessmentName,
        grade.assessmentType.charAt(0).toUpperCase() + grade.assessmentType.slice(1),
        `${grade.score}/${grade.maxScore}`,
        {
            html: `<span style="color: ${getGradeColor(grade.percentage)}; font-weight: bold;">${formatGrade(grade.percentage)} (${grade.letterGrade})</span>`
        },
        `${grade.teacher.firstName} ${grade.teacher.lastName}`,
        formatDate(grade.gradedDate)
    ]);
    
    const table = createTable(headers, data);
    container.innerHTML = '';
    container.appendChild(table);
}

function filterStudentGrades() {
    const courseFilter = document.getElementById('courseGradeFilter').value;
    const semesterFilter = document.getElementById('semesterFilter').value;
    
    let filteredGrades = grades;
    
    if (courseFilter) {
        filteredGrades = filteredGrades.filter(grade => grade.course._id === courseFilter);
    }
    
    if (semesterFilter) {
        filteredGrades = filteredGrades.filter(grade => 
            `${grade.course.semester} ${grade.course.year}` === semesterFilter
        );
    }
    
    displayStudentGrades(filteredGrades);
}

function searchStudentGrades(searchTerm) {
    if (!searchTerm.trim()) {
        filterStudentGrades();
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const filteredGrades = grades.filter(grade => {
        const assessmentName = grade.assessmentName.toLowerCase();
        const courseCode = grade.course.courseCode.toLowerCase();
        const assessmentType = grade.assessmentType.toLowerCase();
        
        return assessmentName.includes(term) || courseCode.includes(term) || assessmentType.includes(term);
    });
    
    displayStudentGrades(filteredGrades);
}

// Analytics section
async function loadAnalyticsSection() {
    try {
        showLoading();
        
        if (!analytics) {
            const response = await makeRequest(`${API_BASE}/student/analytics`);
            analytics = response.analytics;
        }
        
        displayAnalytics(analytics);
        
    } catch (error) {
        console.error('Failed to load analytics:', error);
        showAlert('Failed to load analytics', 'error');
    } finally {
        hideLoading();
    }
}

function displayAnalytics(analyticsData) {
    displayGradeDistribution(analyticsData.gradeDistribution);
    displayPerformanceByType(analyticsData.performanceByType);
    displayPerformanceTrend(analyticsData.improvementTrend);
}

function displayGradeDistribution(distribution) {
    const container = document.getElementById('gradeDistribution');
    if (!container) return;
    
    const grades = Object.keys(distribution).sort();
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        container.innerHTML = '<p class="text-center">No grade data available</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="grade-distribution-chart">
            ${grades.map(grade => {
                const count = distribution[grade];
                const percentage = ((count / total) * 100).toFixed(1);
                return `
                    <div class="grade-bar" style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span class="badge badge-${getGradeBadgeClass(getGradePercentage(grade))}">${grade}</span>
                            <span>${count} (${percentage}%)</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function displayPerformanceByType(performanceData) {
    const container = document.getElementById('performanceByType');
    if (!container) return;
    
    const types = Object.keys(performanceData);
    
    if (types.length === 0) {
        container.innerHTML = '<p class="text-center">No performance data available</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="performance-by-type">
            ${types.map(type => {
                const data = performanceData[type];
                const average = parseFloat(data.average);
                return `
                    <div class="type-performance" style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span style="font-weight: 500; text-transform: capitalize;">${type}</span>
                            <span style="color: ${getGradeColor(average)}; font-weight: bold;">
                                ${formatGrade(average)} (${data.count} items)
                            </span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${average}%; background-color: ${getGradeColor(average)};"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function displayPerformanceTrend(trendData) {
    const container = document.getElementById('performanceTrend');
    if (!container) return;
    
    if (trendData.length === 0) {
        container.innerHTML = '<p class="text-center">Not enough data for trend analysis</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="performance-trend">
            <div class="trend-chart" style="display: flex; align-items: end; height: 200px; gap: 0.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                ${trendData.map((item, index) => {
                    const height = (item.score / 100) * 160; // Max height 160px
                    return `
                        <div class="trend-bar" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="background: ${getGradeColor(item.score)}; width: 100%; height: ${height}px; border-radius: 4px 4px 0 0; margin-bottom: 0.5rem;"></div>
                            <div style="font-size: 0.8rem; text-align: center; color: #666;">
                                <div style="font-weight: bold;">${formatGrade(item.score)}</div>
                                <div>${item.assessment.length > 10 ? item.assessment.substring(0, 10) + '...' : item.assessment}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <p style="text-align: center; margin-top: 1rem; color: #666;">
                Recent ${trendData.length} assessments showing performance trend
            </p>
        </div>
    `;
}

// Transcript section
async function loadTranscriptSection() {
    try {
        showLoading();
        
        if (!transcript) {
            const response = await makeRequest(`${API_BASE}/student/transcript`);
            transcript = response.transcript;
        }
        
        displayTranscript(transcript);
        
    } catch (error) {
        console.error('Failed to load transcript:', error);
        showAlert('Failed to load transcript', 'error');
    } finally {
        hideLoading();
    }
}

function displayTranscript(transcriptData) {
    const container = document.getElementById('transcriptContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="transcript">
            <div class="transcript-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem; background: #f8f9fa; border-radius: 10px;">
                <h2>Official Academic Transcript</h2>
                <div style="margin-top: 1rem;">
                    <p><strong>Student:</strong> ${transcriptData.student.name}</p>
                    <p><strong>Student ID:</strong> ${transcriptData.student.studentId}</p>
                    <p><strong>Department:</strong> ${transcriptData.student.department || 'Not specified'}</p>
                </div>
            </div>

            <div class="transcript-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="summary-card" style="text-align: center; padding: 1.5rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color: #667eea;">${transcriptData.summary.totalCredits}</h3>
                    <p>Total Credits</p>
                </div>
                <div class="summary-card" style="text-align: center; padding: 1.5rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color: #28a745;">${transcriptData.summary.cumulativeGPA}</h3>
                    <p>Cumulative GPA</p>
                </div>
                <div class="summary-card" style="text-align: center; padding: 1.5rem; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color: #17a2b8;">${transcriptData.summary.totalCourses}</h3>
                    <p>Courses Completed</p>
                </div>
            </div>

            <div class="transcript-courses">
                ${transcriptData.courses.length === 0 ? 
                    '<p class="text-center">No completed courses found.</p>' :
                    generateTranscriptTable(transcriptData.courses)
                }
            </div>
        </div>
    `;
}

function generateTranscriptTable(courses) {
    // Group courses by semester and year
    const groupedCourses = courses.reduce((groups, course) => {
        const key = `${course.semester} ${course.year}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(course);
        return groups;
    }, {});

    const sortedSemesters = Object.keys(groupedCourses).sort((a, b) => {
        const [semesterA, yearA] = a.split(' ');
        const [semesterB, yearB] = b.split(' ');
        
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        
        const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
        return semesterOrder[semesterA] - semesterOrder[semesterB];
    });

    return `
        <div class="transcript-table">
            ${sortedSemesters.map(semester => `
                <div class="semester-section" style="margin-bottom: 2rem;">
                    <h4 style="background: #667eea; color: white; padding: 0.75rem; margin: 0; border-radius: 8px 8px 0 0;">
                        ${semester}
                    </h4>
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 0 0 8px 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e1e5e9;">Course Code</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e1e5e9;">Course Name</th>
                                <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #e1e5e9;">Credits</th>
                                <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #e1e5e9;">Grade</th>
                                <th style="padding: 1rem; text-align: center; border-bottom: 2px solid #e1e5e9;">Points</th>
                                <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e1e5e9;">Teacher</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupedCourses[semester].map(course => `
                                <tr>
                                    <td style="padding: 1rem; border-bottom: 1px solid #e1e5e9;">${course.courseCode}</td>
                                    <td style="padding: 1rem; border-bottom: 1px solid #e1e5e9;">${course.courseName}</td>
                                    <td style="padding: 1rem; text-align: center; border-bottom: 1px solid #e1e5e9;">${course.credits}</td>
                                    <td style="padding: 1rem; text-align: center; border-bottom: 1px solid #e1e5e9;">
                                        <span class="badge badge-${getGradeBadgeClass(course.percentage)}">${course.grade}</span>
                                    </td>
                                    <td style="padding: 1rem; text-align: center; border-bottom: 1px solid #e1e5e9;">${course.gradePoints}</td>
                                    <td style="padding: 1rem; border-bottom: 1px solid #e1e5e9;">${course.teacher}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>
    `;
}

// Utility functions
function viewCourseDetails(courseId) {
    const course = courses.find(c => c._id === courseId);
    if (!course) return;
    
    const modal = document.getElementById('courseDetailsModal');
    const title = document.getElementById('courseDetailsTitle');
    const body = document.getElementById('courseDetailsBody');
    
    title.textContent = `${course.courseCode} - ${course.courseName}`;
    
    body.innerHTML = `
        <div class="course-details">
            <div class="row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h5>Course Information</h5>
                    <p><strong>Department:</strong> ${course.department}</p>
                    <p><strong>Credits:</strong> ${course.credits}</p>
                    <p><strong>Semester:</strong> ${course.semester} ${course.year}</p>
                    <p><strong>Teacher:</strong> ${course.teacher.firstName} ${course.teacher.lastName}</p>
                    <p><strong>Email:</strong> ${course.teacher.email}</p>
                </div>
                <div>
                    <h5>Performance</h5>
                    ${course.average !== null ? `
                        <p><strong>Current Grade:</strong> 
                            <span style="color: ${getGradeColor(course.average)}; font-weight: bold;">
                                ${formatGrade(course.average)} (${course.letterGrade})
                            </span>
                        </p>
                    ` : '<p><strong>Current Grade:</strong> No grades yet</p>'}
                    <p><strong>Students Enrolled:</strong> ${course.enrolledCount}</p>
                </div>
            </div>
            ${course.description ? `
                <div>
                    <h5>Description</h5>
                    <p>${course.description}</p>
                </div>
            ` : ''}
            ${course.schedule ? `
                <div>
                    <h5>Schedule</h5>
                    <ul>
                        ${course.schedule.days ? `<li><strong>Days:</strong> ${course.schedule.days.join(', ')}</li>` : ''}
                        ${course.schedule.startTime && course.schedule.endTime ? 
                            `<li><strong>Time:</strong> ${course.schedule.startTime} - ${course.schedule.endTime}</li>` : ''}
                        ${course.schedule.room ? `<li><strong>Room:</strong> ${course.schedule.room}</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    showModal('courseDetailsModal');
}

function viewCourseGrades(courseId) {
    // Filter grades for this course and show in grades section
    showSection('grades');
    
    // Wait for grades to load, then filter
    setTimeout(() => {
        const courseFilter = document.getElementById('courseGradeFilter');
        if (courseFilter) {
            courseFilter.value = courseId;
            filterStudentGrades();
        }
    }, 500);
}

function exportStudentGrades() {
    if (grades.length === 0) {
        showAlert('No grades to export', 'warning');
        return;
    }
    
    const csvData = [
        ['Course Code', 'Course Name', 'Assessment Type', 'Assessment Name', 'Score', 'Max Score', 'Percentage', 'Letter Grade', 'Teacher', 'Date']
    ];
    
    grades.forEach(grade => {
        csvData.push([
            grade.course.courseCode,
            grade.course.courseName,
            grade.assessmentType,
            grade.assessmentName,
            grade.score,
            grade.maxScore,
            grade.percentage.toFixed(2),
            grade.letterGrade,
            `${grade.teacher.firstName} ${grade.teacher.lastName}`,
            formatDate(grade.gradedDate)
        ]);
    });
    
    exportToCSV(csvData, `student_grades_${currentUser.studentId}_${new Date().toISOString().split('T')[0]}.csv`);
    showAlert('Grades exported successfully!', 'success');
}

function exportTranscript() {
    if (!transcript || transcript.courses.length === 0) {
        showAlert('No transcript data to export', 'warning');
        return;
    }
    
    const csvData = [
        ['Student Name', 'Student ID', 'Department'],
        [transcript.student.name, transcript.student.studentId, transcript.student.department || 'Not specified'],
        [],
        ['Semester', 'Course Code', 'Course Name', 'Credits', 'Grade', 'Grade Points', 'Teacher'],
    ];
    
    transcript.courses.forEach(course => {
        csvData.push([
            `${course.semester} ${course.year}`,
            course.courseCode,
            course.courseName,
            course.credits,
            course.grade,
            course.gradePoints,
            course.teacher
        ]);
    });
    
    csvData.push([]);
    csvData.push(['Summary']);
    csvData.push(['Total Credits', transcript.summary.totalCredits]);
    csvData.push(['Cumulative GPA', transcript.summary.cumulativeGPA]);
    csvData.push(['Total Courses', transcript.summary.totalCourses]);
    
    exportToCSV(csvData, `transcript_${currentUser.studentId}_${new Date().toISOString().split('T')[0]}.csv`);
    showAlert('Transcript exported successfully!', 'success');
}

function printTranscript() {
    if (!transcript) {
        showAlert('No transcript data to print', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Academic Transcript - ${transcript.student.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 2rem; }
                .header { text-align: center; margin-bottom: 2rem; }
                .student-info { margin-bottom: 2rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                th, td { padding: 0.5rem; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f5f5f5; }
                .summary { margin-top: 2rem; }
                @media print { body { margin: 1rem; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Official Academic Transcript</h1>
                <p>School Database Management System</p>
            </div>
            
            <div class="student-info">
                <p><strong>Student Name:</strong> ${transcript.student.name}</p>
                <p><strong>Student ID:</strong> ${transcript.student.studentId}</p>
                <p><strong>Department:</strong> ${transcript.student.department || 'Not specified'}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Semester</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th>Grade Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${transcript.courses.map(course => `
                        <tr>
                            <td>${course.semester} ${course.year}</td>
                            <td>${course.courseCode}</td>
                            <td>${course.courseName}</td>
                            <td>${course.credits}</td>
                            <td>${course.grade}</td>
                            <td>${course.gradePoints}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <p><strong>Total Credits:</strong> ${transcript.summary.totalCredits}</p>
                <p><strong>Cumulative GPA:</strong> ${transcript.summary.cumulativeGPA}</p>
                <p><strong>Total Courses:</strong> ${transcript.summary.totalCourses}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function getGradePercentage(letterGrade) {
    const gradeMap = {
        'A+': 98, 'A': 95, 'A-': 92,
        'B+': 88, 'B': 85, 'B-': 82,
        'C+': 78, 'C': 75, 'C-': 72,
        'D+': 68, 'D': 65, 'D-': 62,
        'F': 50
    };
    return gradeMap[letterGrade] || 0;
}

// Course Enrollment Section
async function loadEnrollmentSection() {
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/student/available-courses`);
        availableCourses = response.courses;
        filteredAvailableCourses = [...availableCourses];
        
        // Populate department filter
        populateDepartmentFilter();
        
        // Display available courses
        displayAvailableCourses(filteredAvailableCourses);
        
    } catch (error) {
        console.error('Failed to load available courses:', error);
        showAlert('Failed to load available courses', 'error');
    } finally {
        hideLoading();
    }
}

function populateDepartmentFilter() {
    const departmentFilter = document.getElementById('departmentFilter');
    if (!departmentFilter || availableCourses.length === 0) return;
    
    const departments = [...new Set(availableCourses.map(course => course.department))];
    departmentFilter.innerHTML = '<option value="">All Departments</option>' +
        departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
}

function displayAvailableCourses(coursesToDisplay) {
    const container = document.getElementById('availableCoursesContainer');
    if (!container) return;
    
    if (coursesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Available Courses</h3>
                <p>No courses match your current filters, or you're already enrolled in all available courses.</p>
                <button type="button" class="btn btn-secondary" onclick="refreshAvailableCourses()">
                    <i class="fas fa-sync-alt"></i> Refresh Courses
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
                <p><strong>Teacher:</strong> ${course.teacher.firstName} ${course.teacher.lastName}</p>
                <p><strong>Department:</strong> ${course.department}</p>
                <p><strong>Credits:</strong> ${course.credits}</p>
                <p><strong>Semester:</strong> ${course.semester} ${course.year}</p>
                <p><strong>Enrollment:</strong> ${course.enrolledCount}/${course.maxStudents} students</p>
                <div class="progress" style="margin: 0.5rem 0;">
                    <div class="progress-bar" style="width: ${(course.enrolledCount/course.maxStudents)*100}%;"></div>
                </div>
                <p><strong>Available Spots:</strong> <span class="badge badge-success">${course.availableSpots}</span></p>
                ${course.description ? `<p><strong>Description:</strong> ${course.description}</p>` : ''}
                ${course.schedule ? `
                    <p><strong>Schedule:</strong></p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; font-size: 0.9rem;">
                        ${course.schedule.days ? `<li>Days: ${course.schedule.days.join(', ')}</li>` : ''}
                        ${course.schedule.startTime && course.schedule.endTime ? 
                            `<li>Time: ${course.schedule.startTime} - ${course.schedule.endTime}</li>` : ''}
                        ${course.schedule.room ? `<li>Room: ${course.schedule.room}</li>` : ''}
                    </ul>
                ` : ''}
            </div>
            <div class="card-footer">
                <button type="button" class="btn btn-primary btn-sm" onclick="enrollInCourse('${course._id}', '${course.courseCode}', '${course.courseName}')" 
                        ${course.availableSpots <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-plus-circle"></i> 
                    ${course.availableSpots <= 0 ? 'Course Full' : 'Enroll'}
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="viewCourseEnrollmentDetails('${course._id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `).join('');
}

async function enrollInCourse(courseId, courseCode, courseName) {
    if (!confirm(`Are you sure you want to enroll in ${courseCode} - ${courseName}?`)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/student/enroll/${courseId}`, {
            method: 'POST'
        });
        
        showAlert(response.message, 'success');
        
        // Refresh available courses and enrolled courses
        await Promise.all([
            loadEnrollmentSection(),
            loadCoursesSection()
        ]);
        
        // Update dashboard if visible
        if (document.getElementById('dashboardSection').style.display !== 'none') {
            await loadDashboardData();
        }
        
    } catch (error) {
        console.error('Enrollment error:', error);
        showAlert(error.message || 'Failed to enroll in course', 'error');
    } finally {
        hideLoading();
    }
}

async function withdrawFromCourse(courseId, courseCode, courseName) {
    if (!confirm(`Are you sure you want to withdraw from ${courseCode} - ${courseName}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await makeRequest(`${API_BASE}/student/withdraw/${courseId}`, {
            method: 'DELETE'
        });
        
        showAlert(response.message, 'success');
        
        // Refresh courses and available courses
        await Promise.all([
            loadCoursesSection(),
            loadEnrollmentSection()
        ]);
        
        // Update dashboard if visible
        if (document.getElementById('dashboardSection').style.display !== 'none') {
            await loadDashboardData();
        }
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        showAlert(error.message || 'Failed to withdraw from course', 'error');
    } finally {
        hideLoading();
    }
}

function filterAvailableCourses() {
    const departmentFilter = document.getElementById('departmentFilter').value;
    const semesterFilter = document.getElementById('semesterFilterEnrollment').value;
    
    let filtered = availableCourses;
    
    if (departmentFilter) {
        filtered = filtered.filter(course => course.department === departmentFilter);
    }
    
    if (semesterFilter) {
        filtered = filtered.filter(course => course.semester === semesterFilter);
    }
    
    filteredAvailableCourses = filtered;
    displayAvailableCourses(filteredAvailableCourses);
}

function searchAvailableCourses(searchTerm) {
    if (!searchTerm.trim()) {
        filterAvailableCourses();
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const searchResults = filteredAvailableCourses.filter(course => {
        const courseCode = course.courseCode.toLowerCase();
        const courseName = course.courseName.toLowerCase();
        const teacherName = `${course.teacher.firstName} ${course.teacher.lastName}`.toLowerCase();
        const department = course.department.toLowerCase();
        
        return courseCode.includes(term) || courseName.includes(term) || 
               teacherName.includes(term) || department.includes(term);
    });
    
    displayAvailableCourses(searchResults);
}

async function refreshAvailableCourses() {
    showAlert('Refreshing available courses...', 'info', 2000);
    await loadEnrollmentSection();
}

function viewCourseEnrollmentDetails(courseId) {
    const course = availableCourses.find(c => c._id === courseId);
    if (!course) return;
    
    const modal = createModal(
        `${course.courseCode} - ${course.courseName}`,
        `
        <div class="course-enrollment-details">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h5>Course Information</h5>
                    <p><strong>Department:</strong> ${course.department}</p>
                    <p><strong>Credits:</strong> ${course.credits}</p>
                    <p><strong>Semester:</strong> ${course.semester} ${course.year}</p>
                    <p><strong>Teacher:</strong> ${course.teacher.firstName} ${course.teacher.lastName}</p>
                    <p><strong>Email:</strong> ${course.teacher.email}</p>
                </div>
                <div>
                    <h5>Enrollment Status</h5>
                    <p><strong>Enrolled Students:</strong> ${course.enrolledCount}</p>
                    <p><strong>Maximum Students:</strong> ${course.maxStudents}</p>
                    <p><strong>Available Spots:</strong> <span class="badge badge-${course.availableSpots > 0 ? 'success' : 'danger'}">${course.availableSpots}</span></p>
                    <div class="progress" style="margin: 1rem 0;">
                        <div class="progress-bar" style="width: ${(course.enrolledCount/course.maxStudents)*100}%;"></div>
                    </div>
                </div>
            </div>
            ${course.description ? `
                <div style="margin-bottom: 2rem;">
                    <h5>Description</h5>
                    <p>${course.description}</p>
                </div>
            ` : ''}
            ${course.schedule ? `
                <div>
                    <h5>Schedule</h5>
                    <ul>
                        ${course.schedule.days ? `<li><strong>Days:</strong> ${course.schedule.days.join(', ')}</li>` : ''}
                        ${course.schedule.startTime && course.schedule.endTime ? 
                            `<li><strong>Time:</strong> ${course.schedule.startTime} - ${course.schedule.endTime}</li>` : ''}
                        ${course.schedule.room ? `<li><strong>Room:</strong> ${course.schedule.room}</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        </div>
        `,
        [
            course.availableSpots > 0 ? 
                `<button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto'; enrollInCourse('${course._id}', '${course.courseCode}', '${course.courseName}');">
                    <i class="fas fa-plus-circle"></i> Enroll Now
                </button>` : 
                `<button type="button" class="btn btn-secondary" disabled>
                    <i class="fas fa-ban"></i> Course Full
                </button>`,
            '<button type="button" class="btn btn-secondary" onclick="this.closest(\'.modal\').remove(); document.body.style.overflow = \'auto\';">Close</button>'
        ]
    );
}

