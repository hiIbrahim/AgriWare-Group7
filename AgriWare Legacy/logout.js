document.addEventListener('DOMContentLoaded', () => {
    const signOutButton = document.getElementById('signOut');
    const logInButton = document.getElementById('logIn');

    // Sign Out functionality
    signOutButton.addEventListener('click', () => {
        // Clear user session (e.g., remove loggedInUser from localStorage)
        localStorage.removeItem('loggedInUser');

        // Redirect or refresh the page after sign out
        alert('You have been signed out.');
        window.location.reload(); // Refresh the page to reset everything
    });

    // Log In functionality
    logInButton.addEventListener('click', () => {
        // Show the login modal
        var loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    });

    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        // If no user is logged in, hide the "Sign Out" option
        signOutButton.style.display = 'none';
    } else {
        // If user is logged in, hide the "Log In" option
        logInButton.style.display = 'none';
    }
});
