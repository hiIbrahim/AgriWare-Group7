import { getStaffMembers } from './core.js';
import { showNotification } from '../ui/notification.js';

// /**
//  * Generates weekly shift structure
//  * @returns {Array} Shift schedule
//  */
export function generateShifts() {
  const shifts = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  days.forEach(day => {
    shifts.push({
      day,
      morning: { 
        start: '08:00', 
        end: '12:00', 
        assigned: null,
        requiredSkills: ['general'],
        status: 'pending'
      },
      afternoon: { 
        start: '13:00', 
        end: '17:00', 
        assigned: null,
        requiredSkills: ['general'],
        status: 'pending'
      },
      evening: {
        start: '18:00',
        end: '22:00',
        assigned: null,
        requiredSkills: ['night-ops'],
        status: 'pending'
      }
    });
  });
  
  localStorage.setItem('staffShifts', JSON.stringify(shifts));
  return shifts;
}


// /**
//  * Automatically assigns staff to open shifts based on skills
//  * @returns {Array} Updated shifts
//  */
export function autoSchedule() {
  const staff = getStaffMembers().filter(s => s.status === 'active');
  const shifts = JSON.parse(localStorage.getItem('staffShifts')) || generateShifts();
  
  shifts.forEach(day => {
    ['morning', 'afternoon', 'evening'].forEach(type => {
      const shift = day[type];
      if (!shift.assigned) {
        const availableStaff = staff.find(s => 
          shift.requiredSkills.every(skill => 
            s.skills?.includes(skill)
          )
        );
        if (availableStaff) {
          shift.assigned = availableStaff.id;
          shift.status = 'auto-assigned';
        }
      }
    });
  });

  localStorage.setItem('staffShifts', JSON.stringify(shifts));
  showNotification('Auto-scheduling completed', 'success');
  return shifts;
}

// Returns the current shift for the logged-in worker
export async function getCurrentShift() {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!user) return null;
  const shifts = JSON.parse(localStorage.getItem("staffShifts")) || [];
  const now = new Date();
  // Find today's shift for this worker
  const today = now.toLocaleDateString("en-US", { weekday: "long" });
  const dayShift = shifts.find(s => s.day === today);
  if (!dayShift) return null;
  // Find which shift the worker is assigned to
  for (const type of ["morning", "afternoon", "evening"]) {
    const shift = dayShift[type];
    if (shift && shift.assigned === user.id) {
      return {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} (${shift.start}-${shift.end})`,
        supervisor: "John Smith", // Replace with real supervisor if available
        endTime: `${now.toDateString()} ${shift.end}`,
      };
    }
  }
  return null;
}

// Returns the tasks for the logged-in worker
export async function getWorkerTasks() {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!user) return [];
  // Example: fetch from localStorage or API
  const allTasks = JSON.parse(localStorage.getItem("workerTasks")) || [];
  return allTasks.filter(task => task.assignedTo === user.id);
}