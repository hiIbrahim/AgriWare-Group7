document.addEventListener('DOMContentLoaded', () => {
    const createAccountForm = document.getElementById('createAccountForm');
    const userDatabase = JSON.parse(localStorage.getItem('users')) || {};

    createAccountForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const phone = document.getElementById('phone').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (phone === '' || username === '' || password === '') {
            alert('Please fill out all fields.');
            return;
        }

        if (userDatabase[phone]) {
            alert('Account with this phone number already exists.');
        } else {
            // Save user to localStorage
            userDatabase[phone] = { username, password };
            localStorage.setItem('users', JSON.stringify(userDatabase));
            alert('Account created successfully.');
        }
    });
});
