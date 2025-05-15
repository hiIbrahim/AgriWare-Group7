document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
        // Add animation class to the button
        this.classList.add('add-to-cart-animation');

        // Show notification
        showNotification('Product added to cart');

        // Remove the animation class after the animation completes
        setTimeout(() => {
            this.classList.remove('add-to-cart-animation');
        }, 500);
    });
});

// Function to display notification
function showNotification(message) {
    let notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide and remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}
