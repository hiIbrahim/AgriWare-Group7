import { getStaffMembers } from './core.js';

// /**
//  * Calculates staff productivity score
//  * @param {string} staffId - Staff member ID
//  * @returns {number} Productivity score (0-100)
//  */
export function calculateProductivity(staffId) {
  const staff = getStaffMembers().find(s => s.id === staffId);
  if (!staff?.attendance) return 0;
  
  const workDays = Object.values(staff.attendance)
    .filter(day => day.status === 'present').length;
  
  const completedTasks = staff.completedTasks || 0;
  const assignedTasks = staff.assignedTasks || 1; // Prevent division by zero
  
  // Weighted calculation (70% tasks, 30% attendance)
  const taskScore = (completedTasks / assignedTasks) * 70;
  const attendanceScore = (workDays / (staff.employmentDays || 1)) * 30;
  
  return Math.min(Math.round(taskScore + attendanceScore), 100);
}

// /**
//  * Calculates attendance rate
//  * @param {string} staffId - Staff member ID
//  * @returns {number} Attendance percentage (0-100)
//  */
export function getAttendanceRate(staffId) {
  const staff = getStaffMembers().find(s => s.id === staffId);
  if (!staff?.attendance) return 0;
  
  const totalDays = Object.keys(staff.attendance).length;
  const presentDays = Object.values(staff.attendance)
    .filter(day => day.status === 'present').length;
    
  return Math.round((presentDays / totalDays) * 100) || 0;
}

// /**
//  * Generates comprehensive staff performance report
//  * @returns {Array} Staff performance data
//  */
export function generatePerformanceReport() {
  return getStaffMembers().map(staff => ({
    id: staff.id,
    name: staff.name,
    role: staff.role,
    productivity: calculateProductivity(staff.id),
    attendanceRate: getAttendanceRate(staff.id),
    completedTasks: staff.completedTasks || 0,
    efficiencyScore: calculateEfficiency(staff.id),
    lastEvaluation: staff.lastEvaluationDate || 'Never'
  }));
}

// /**
//  * Calculates efficiency score (tasks per hour)
//  * @param {string} staffId 
//  * @returns {number} Efficiency score
//  */
function calculateEfficiency(staffId) {
  const staff = getStaffMembers().find(s => s.id === staffId);
  if (!staff) return 0;
  
  const workedHours = staff.workedHours || 1;
  const completedTasks = staff.completedTasks || 0;
  
  return parseFloat((completedTasks / workedHours).toFixed(2));
}

// /**
//  * Generates data for productivity chart
//  * @returns {Object} Chart-ready data
//  */
export function getProductivityChartData() {
  const staff = getStaffMembers();
  return {
    labels: staff.map(s => s.name),
    datasets: [{
      label: 'Productivity Score',
      data: staff.map(s => calculateProductivity(s.id)),
      backgroundColor: staff.map(s => 
        s.role === 'admin' ? '#2c7873' : 
        s.role === 'supervisor' ? '#6fb98f' : '#f8b400'
      )
    }]
  };
}

let productivityChartInstance = null;

export function initProductivityChart() {
  const ctx = document.getElementById("productivityChart")?.getContext("2d");
  if (!ctx) return;

  // Defensive: destroy any existing chart instance on this canvas
  if (window.Chart && Chart.getChart) {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  }

  if (productivityChartInstance) {
    productivityChartInstance.destroy();
  }

  const chartData = getProductivityChartData();

  productivityChartInstance = new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
}