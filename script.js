// API Configuration
const API_URL = 'https://fedskillstest.coalitiontechnologies.workers.dev';
const API_USERNAME = 'coalition';
const API_PASSWORD = 'skills-test';

let chartInstance = null;
let allPatients = [];
let selectedPatient = null;

// Create Basic Auth header
const authHeader = 'Basic ' + btoa(API_USERNAME + ':' + API_PASSWORD);

// Fetch patient data from API
async function fetchPatientData() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patient data');
        }

        const data = await response.json();
        allPatients = data;
        
        // Find Jessica Taylor or use first patient
        selectedPatient = allPatients.find(p => p.name === 'Jessica Taylor') || allPatients[0];
        
        renderPatientsList();
        renderPatientDetails(selectedPatient);
        
        // Hide loading, show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching patient data:', error);
        document.getElementById('loading').textContent = 'Error loading patient data. Please try again.';
    }
}

// Render patients list
function renderPatientsList() {
    const patientsList = document.getElementById('patientsList');
    patientsList.innerHTML = '';

    allPatients.forEach(patient => {
        const patientItem = document.createElement('div');
        patientItem.className = 'patient-item' + (patient.name === selectedPatient.name ? ' active' : '');
        patientItem.onclick = () => selectPatient(patient);
        
        patientItem.innerHTML = `
            <img src="${patient.profile_picture}" alt="${patient.name}" class="patient-avatar">
            <div class="patient-info">
                <div class="patient-name">${patient.name}</div>
                <div class="patient-details">${patient.gender}, ${patient.age}</div>
            </div>
            <img src="assets/more_horiz_FILL0_wght300_GRAD0_opsz24.svg" alt="Menu" class="patient-menu">
        `;
        
        patientsList.appendChild(patientItem);
    });
}

// Select a patient
function selectPatient(patient) {
    selectedPatient = patient;
    renderPatientsList();
    renderPatientDetails(patient);
}

// Render patient details
function renderPatientDetails(patient) {
    // Profile section
    document.getElementById('profileAvatar').src = patient.profile_picture;
    document.getElementById('profileName').textContent = patient.name;
    
    // Format date of birth
    const dob = new Date(patient.date_of_birth);
    const dobFormatted = dob.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('profileDOB').textContent = dobFormatted;
    
    document.getElementById('profileGender').textContent = patient.gender;
    document.getElementById('profilePhone').textContent = patient.phone_number;
    document.getElementById('profileEmergency').textContent = patient.emergency_contact;
    document.getElementById('profileInsurance').textContent = patient.insurance_type;

    // Update gender icon
    const genderIcon = document.getElementById('genderIcon');
    genderIcon.src = patient.gender === 'Female' ? 'assets/FemaleIcon.svg' : 'assets/MaleIcon.svg';

    // Get latest diagnosis data
    const latestDiagnosis = patient.diagnosis_history[0];
    
    // Update blood pressure values
    document.getElementById('systolicValue').textContent = latestDiagnosis.blood_pressure.systolic.value;
    document.getElementById('systolicLevel').textContent = latestDiagnosis.blood_pressure.systolic.levels;
    document.getElementById('systolicLegend').textContent = latestDiagnosis.blood_pressure.systolic.value;
    document.getElementById('diastolicLegend').textContent = latestDiagnosis.blood_pressure.diastolic.value;

    // Update systolic arrow
    const systolicArrow = document.getElementById('systolicArrow');
    if (latestDiagnosis.blood_pressure.systolic.levels.includes('Higher')) {
        systolicArrow.src = 'assets/ArrowUp.svg';
    } else if (latestDiagnosis.blood_pressure.systolic.levels.includes('Lower')) {
        systolicArrow.src = 'assets/ArrowDown.svg';
    }

    // Update vital signs
    document.getElementById('respiratoryValue').textContent = latestDiagnosis.respiratory_rate.value + ' bpm';
    document.getElementById('respiratoryStatus').textContent = latestDiagnosis.respiratory_rate.levels;
    
    document.getElementById('temperatureValue').textContent = latestDiagnosis.temperature.value + '°F';
    document.getElementById('temperatureStatus').textContent = latestDiagnosis.temperature.levels;
    
    document.getElementById('heartRateValue').textContent = latestDiagnosis.heart_rate.value + ' bpm';
    document.getElementById('heartRateLevel').textContent = latestDiagnosis.heart_rate.levels;

    // Update heart rate arrow
    const heartArrow = document.getElementById('heartRateArrow');
    if (latestDiagnosis.heart_rate.levels.includes('Higher')) {
        heartArrow.src = 'assets/ArrowUp.svg';
    } else if (latestDiagnosis.heart_rate.levels.includes('Lower')) {
        heartArrow.src = 'assets/ArrowDown.svg';
    } else {
        heartArrow.style.display = 'none';
    }

    // Render chart
    renderBloodPressureChart(patient.diagnosis_history);

    // Render diagnostic list
    renderDiagnosticList(patient.diagnostic_list);

    // Render lab results
    renderLabResults(patient.lab_results);
}

// Render blood pressure chart
function renderBloodPressureChart(diagnosisHistory) {
    const ctx = document.getElementById('bloodPressureChart').getContext('2d');
    
    // Get last 6 months of data
    const last6Months = diagnosisHistory.slice(0, 6).reverse();
    
    const labels = last6Months.map(d => `${d.month.substring(0, 3)} ${d.year}`);
    const systolicData = last6Months.map(d => d.blood_pressure.systolic.value);
    const diastolicData = last6Months.map(d => d.blood_pressure.diastolic.value);

    // Destroy existing chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Systolic',
                data: systolicData,
                borderColor: '#E66FD2',
                backgroundColor: 'rgba(140, 111, 230, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#8C6FE6',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 180,
                    ticks: {
                        stepSize: 20,
                        font: {
                            size: 12,
                            family: 'Manrope'
                        }
                    },
                    grid: {
                        color: '#E3E4E6'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Manrope'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Render diagnostic list
function renderDiagnosticList(diagnosticList) {
    const tbody = document.getElementById('diagnosticTableBody');
    tbody.innerHTML = '';

    diagnosticList.forEach(diagnostic => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${diagnostic.name}</td>
            <td>${diagnostic.description}</td>
            <td>${diagnostic.status}</td>
        `;
        tbody.appendChild(row);
    });
}

// Render lab results
function renderLabResults(labResults) {
    const labList = document.getElementById('labResultsList');
    labList.innerHTML = '';

    labResults.forEach(result => {
        const labItem = document.createElement('div');
        labItem.className = 'lab-item';
        labItem.innerHTML = `
            <span class="lab-name">${result}</span>
            <img src="assets/download_FILL0_wght300_GRAD0_opsz24 (1).svg" alt="Download" class="download-icon">
        `;
        labList.appendChild(labItem);
    });
}

// Initialize the application
fetchPatientData();
