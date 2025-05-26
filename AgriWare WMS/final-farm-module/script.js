
    // Initialize the application
    let currentSection = 'loginSection';
    let crops = JSON.parse(localStorage.getItem('crops')) || [];
    let livestock = JSON.parse(localStorage.getItem('livestock')) || [];
    let workers = JSON.parse(localStorage.getItem('workers')) || [];
    let finances = JSON.parse(localStorage.getItem('finances')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];

    // Show notification
    function showNotification(message, type = 'success') {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.className = `notification ${type} show`;
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }

    // Navigation function
    function navigate(sectionId) {
      // Hide all sections
      document.querySelectorAll('.section, .auth-container').forEach(section => {
        section.classList.add('hidden');
      });
      
      // Show selected section
      document.getElementById(sectionId).classList.remove('hidden');
      currentSection = sectionId;
      
      // Update active tab
      document.querySelectorAll('.tabs button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
      
      // Update dashboard stats when navigating to dashboard
      if (sectionId === 'dashboardSection') {
        updateDashboardStats();
      }
    }

    // Authentication functions
    function showLogin() {
      document.getElementById('registerSection').classList.add('hidden');
      document.getElementById('loginSection').classList.remove('hidden');
    }

    function showRegister() {
      document.getElementById('loginSection').classList.add('hidden');
      document.getElementById('registerSection').classList.remove('hidden');
    }

    function registerUser() {
      const username = document.getElementById('registerUsername').value.trim();
      const password = document.getElementById('registerPassword').value.trim();
      
      if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
      }
      
      if (users.find(user => user.username === username)) {
        showNotification('Username already exists', 'error');
        return;
      }
      
      users.push({ username, password });
      localStorage.setItem('users', JSON.stringify(users));
      showNotification('Registration successful! Please login.');
      showLogin();
    }

    function loginUser() {
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      
      if (!username || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
      }
      
      const user = users.find(user => user.username === username && user.password === password);
      
      if (user) {
        localStorage.setItem('currentUser', username);
        document.getElementById('userInfo').textContent = `Welcome, ${username}!`;
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('navigationTabs').classList.remove('hidden');
        navigate('dashboardSection');
        loadAllData();
        showNotification(`Welcome back, ${username}!`);
      } else {
        showNotification('Invalid credentials', 'error');
      }
    }

    function logout() {
      localStorage.removeItem('currentUser');
      document.getElementById('userInfo').classList.add('hidden');
      document.getElementById('navigationTabs').classList.add('hidden');
      navigate('loginSection');
      showNotification('Logged out successfully');
    }

    // Data management functions
    function addCrop() {
      const name = document.getElementById('cropName').value.trim();
      const plantDate = document.getElementById('plantDate').value;
      const harvestDate = document.getElementById('harvestDate').value;
      const health = document.getElementById('cropHealth').value;
      
      if (!name || !plantDate || !health) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      const crop = {
        id: Date.now(),
        name,
        plantDate,
        harvestDate: harvestDate || 'Not set',
        health,
        addedBy: localStorage.getItem('currentUser')
      };
      
      crops.push(crop);
      localStorage.setItem('crops', JSON.stringify(crops));
      displayCrops();
      clearCropForm();
      showNotification('Crop added successfully!');
    }

    function displayCrops() {
      const list = document.getElementById('cropList');
      list.innerHTML = '';
      
      crops.forEach(crop => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${crop.name}</strong><br>
          Plant Date: ${crop.plantDate}<br>
          Harvest Date: ${crop.harvestDate}<br>
          Health: <span style="color: ${getHealthColor(crop.health)}">${crop.health}</span>
          <div class="action-buttons">
            <button onclick="deleteCrop(${crop.id})" class="danger">🗑️ Delete</button>
          </div>
        `;
        list.appendChild(li);
      });
    }

    function deleteCrop(id) {
      crops = crops.filter(crop => crop.id !== id);
      localStorage.setItem('crops', JSON.stringify(crops));
      displayCrops();
      showNotification('Crop deleted successfully!');
    }

    function clearCropForm() {
      document.getElementById('cropName').value = '';
      document.getElementById('plantDate').value = '';
      document.getElementById('harvestDate').value = '';
      document.getElementById('cropHealth').value = '';
    }

    function addAnimal() {
      const name = document.getElementById('animalName').value.trim();
      const health = document.getElementById('animalHealth').value;
      const vaccinationDate = document.getElementById('vaccinationDate').value;
      const feedingSchedule = document.getElementById('feedingSchedule').value.trim();
      
      if (!name || !health) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      const animal = {
        id: Date.now(),
        name,
        health,
        vaccinationDate: vaccinationDate || 'Not scheduled',
        feedingSchedule: feedingSchedule || 'Not specified',
        addedBy: localStorage.getItem('currentUser')
      };
      
      livestock.push(animal);
      localStorage.setItem('livestock', JSON.stringify(livestock));
      displayLivestock();
      clearAnimalForm();
      showNotification('Animal added successfully!');
    }

    function displayLivestock() {
      const list = document.getElementById('animalList');
      list.innerHTML = '';
      
      livestock.forEach(animal => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${animal.name}</strong><br>
          Health: <span style="color: ${getHealthColor(animal.health)}">${animal.health}</span><br>
          Vaccination: ${animal.vaccinationDate}<br>
          Feeding: ${animal.feedingSchedule}
          <div class="action-buttons">
            <button onclick="deleteAnimal(${animal.id})" class="danger">🗑️ Delete</button>
          </div>
        `;
        list.appendChild(li);
      });
    }

    function deleteAnimal(id) {
      livestock = livestock.filter(animal => animal.id !== id);
      localStorage.setItem('livestock', JSON.stringify(livestock));
      displayLivestock();
      showNotification('Animal deleted successfully!');
    }

    function clearAnimalForm() {
      document.getElementById('animalName').value = '';
      document.getElementById('animalHealth').value = '';
      document.getElementById('vaccinationDate').value = '';
      document.getElementById('feedingSchedule').value = '';
    }

    function addWorker() {
      const name = document.getElementById('workerName').value.trim();
      const task = document.getElementById('task').value.trim();
      const salary = document.getElementById('salary').value;
      const attendance = document.getElementById('attendance').value;
      
      if (!name || !attendance) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      const worker = {
        id: Date.now(),
        name,
        task: task || 'Not assigned',
        salary: salary || 0,
        attendance,
        addedBy: localStorage.getItem('currentUser')
      };
      
      workers.push(worker);
      localStorage.setItem('workers', JSON.stringify(workers));
      displayWorkers();
      clearWorkerForm();
      showNotification('Worker added successfully!');
    }

    function displayWorkers() {
      const list = document.getElementById('workerList');
      list.innerHTML = '';
      
      workers.forEach(worker => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${worker.name}</strong><br>
          Task: ${worker.task}<br>
          Salary: $${worker.salary}/month<br>
          Attendance: <span style="color: ${getAttendanceColor(worker.attendance)}">${worker.attendance}</span>
          <div class="action-buttons">
            <button onclick="deleteWorker(${worker.id})" class="danger">🗑️ Delete</button>
          </div>
        `;
        list.appendChild(li);
      });
    }

    function deleteWorker(id) {
      workers = workers.filter(worker => worker.id !== id);
      localStorage.setItem('workers', JSON.stringify(workers));
      displayWorkers();
      showNotification('Worker deleted successfully!');
    }

    function clearWorkerForm() {
      document.getElementById('workerName').value = '';
      document.getElementById('task').value = '';
      document.getElementById('salary').value = '';
      document.getElementById('attendance').value = '';
    }

    function addFinance() {
      const type = document.getElementById('financeType').value;
      const detail = document.getElementById('financeDetail').value.trim();
      const amount = parseFloat(document.getElementById('financeAmount').value);
      const date = document.getElementById('financeDate').value;
      
      if (!type || !detail || !amount || !date) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      const finance = {
        id: Date.now(),
        type,
        detail,
        amount,
        date,
        addedBy: localStorage.getItem('currentUser')
      };
      
      finances.push(finance);
      localStorage.setItem('finances', JSON.stringify(finances));
      displayFinances();
      clearFinanceForm();
      showNotification('Finance record added successfully!');
    }

    function displayFinances() {
      const list = document.getElementById('financeList');
      list.innerHTML = '';
      
      finances.forEach(finance => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${finance.type}: ${finance.detail}</strong><br>
          Amount: <span style="color: ${finance.type === 'Income' ? '#27ae60' : '#e74c3c'}">
            ${finance.type === 'Income' ? '+' : '-'}$${finance.amount}
          </span><br>
          Date: ${finance.date}
          <div class="action-buttons">
            <button onclick="deleteFinance(${finance.id})" class="danger">🗑️ Delete</button>
          </div>
        `;
        list.appendChild(li);
      });
    }

    function deleteFinance(id) {
      finances = finances.filter(finance => finance.id !== id);
      localStorage.setItem('finances', JSON.stringify(finances));
      displayFinances();
      showNotification('Finance record deleted successfully!');
    }

    function clearFinanceForm() {
      document.getElementById('financeType').value = '';
      document.getElementById('financeDetail').value = '';
      document.getElementById('financeAmount').value = '';
      document.getElementById('financeDate').value = '';
    }

    // Utility functions
    function getHealthColor(health) {
      switch(health.toLowerCase()) {
        case 'excellent': case 'healthy': return '#27ae60';
        case 'good': return '#2ecc71';
        case 'fair': return '#f39c12';
        case 'poor': case 'sick': return '#e74c3c';
        case 'under treatment': return '#9b59b6';
        case 'quarantine': return '#e67e22';
        default: return '#34495e';
      }
    }

    function getAttendanceColor(attendance) {
      switch(attendance.toLowerCase()) {
        case 'present': return '#27ae60';
        case 'absent': return '#e74c3c';
        case 'on leave': return '#f39c12';
        default: return '#34495e';
      }
    }

    function updateDashboardStats() {
      document.getElementById('totalCrops').textContent = crops.length;
      document.getElementById('totalLivestock').textContent = livestock.length;
      document.getElementById('totalWorkers').textContent = workers.length;

      const totalIncome = finances.filter(f => f.type === 'Income').reduce((sum, f) => sum + f.amount, 0);
      const totalExpenses = finances.filter(f => f.type === 'Expense').reduce((sum, f) => sum + f.amount, 0);
      const balance = totalIncome - totalExpenses;
      document.getElementById('totalBalance').textContent = `$${balance.toFixed(2)}`;
    }

    function generateReports() {
      const reportOutput = document.getElementById('reportOutput');
      reportOutput.innerHTML = `
        <h3>📅 Farm Report - ${new Date().toLocaleDateString()}</h3>
        <p><strong>🌾 Total Crops:</strong> ${crops.length}</p>
        <p><strong>🐄 Total Livestock:</strong> ${livestock.length}</p>
        <p><strong>👨‍🌾 Total Workers:</strong> ${workers.length}</p>
        <p><strong>💰 Financial Summary:</strong></p>
        <ul>
          <li>Total Income: $${finances.filter(f => f.type === 'Income').reduce((sum, f) => sum + f.amount, 0).toFixed(2)}</li>
          <li>Total Expenses: $${finances.filter(f => f.type === 'Expense').reduce((sum, f) => sum + f.amount, 0).toFixed(2)}</li>
          <li>Net Balance: $${(finances.filter(f => f.type === 'Income').reduce((sum, f) => sum + f.amount, 0) - 
          finances.filter(f => f.type === 'Expense').reduce((sum, f) => sum + f.amount, 0)).toFixed(2)}</li>
        </ul>
        <p><strong>⚠️ Health Alerts:</strong></p>
        <ul>
          ${getHealthAlerts()}
        </ul>
      `;
      reportOutput.classList.remove('hidden');
    }

    function getHealthAlerts() {
      let alerts = [];
      const poorCrops = crops.filter(c => c.health === 'Poor');
      const sickAnimals = livestock.filter(a => a.health === 'Sick' || a.health === 'Under Treatment' || a.health === 'Quarantine');

      if (poorCrops.length > 0) {
        alerts.push(`<li>${poorCrops.length} crops in poor health condition</li>`);
      }
      if (sickAnimals.length > 0) {
        alerts.push(`<li>${sickAnimals.length} animals need medical attention</li>`);
      }

      return alerts.length > 0 ? alerts.join('') : '<li>No health alerts at this time</li>';
    }

    function exportData() {
      const data = {
        crops,
        livestock,
        workers,
        finances,
        generatedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farm_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('Data exported successfully!');
    }

    function displayAllDetails() {
      let details = '<h3>📋 Farm Details</h3>';

      // Crops
      details += '<h4>🌾 Crops</h4><ul>';
      crops.forEach(crop => {
        details += `<li>${crop.name} (${crop.plantDate}) - Health: ${crop.health}</li>`;
      });
      details += '</ul>';

      // Livestock
      details += '<h4>🐄 Livestock</h4><ul>';
      livestock.forEach(animal => {
        details += `<li>${animal.name} - Health: ${animal.health}</li>`;
      });
      details += '</ul>';

      // Workers
      details += '<h4>👨‍🌾 Workers</h4><ul>';
      workers.forEach(worker => {
        details += `<li>${worker.name} - ${worker.task} (${worker.attendance})</li>`;
      });
      details += '</ul>';

      // Finances
      details += '<h4>💰 Finances</h4><ul>';
      finances.forEach(finance => {
        details += `<li>${finance.type}: ${finance.detail} - $${finance.amount} (${finance.date})</li>`;
      });
      details += '</ul>';

      const reportOutput = document.getElementById('reportOutput');
      reportOutput.innerHTML = details;
      reportOutput.classList.remove('hidden');
    }

    function loadAllData() {
      displayCrops();
      displayLivestock();
      displayWorkers();
      displayFinances();
      updateDashboardStats();
    }

    // Check if user is logged in on page load
    window.onload = function() {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        document.getElementById('userInfo').textContent = `Welcome, ${currentUser}!`;
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('navigationTabs').classList.remove('hidden');
        navigate('dashboardSection');
        loadAllData();
      } else {
        navigate('loginSection');
      }
    };
  