document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const userDatabase = JSON.parse(localStorage.getItem('users')) || {};

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        const user = userDatabase[phone];

        if (user && user.password === password) {
            // Login successful
            alert('Login successful.');

            // Store logged-in user data: phone number and username
            localStorage.setItem('loggedInUser', JSON.stringify({
                phone: phone,
                username: user.username
            }));

            // Redirect to index2.html
            window.location.href = 'index2.html';
        } else {
            alert('Invalid phone number or password.');
        }
    });

    // Automatically show the login modal when the page loads
    var loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();

    // Disable interactions with the rest of the page initially
    document.getElementById('mainContent').style.pointerEvents = 'none';

    // Prevent page scrolling while the login modal is open
    document.body.style.overflow = 'hidden'; // Disables scrolling when modal is open

    // Add an event listener to restore scroll when the modal is hidden
    document.getElementById('loginModal').addEventListener('hidden.bs.modal', function () {
        document.body.style.overflow = 'auto'; // Re-enable scrolling when the modal is closed
    });
});
