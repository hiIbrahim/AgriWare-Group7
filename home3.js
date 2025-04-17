document.addEventListener('DOMContentLoaded', () => {
    // Select all dropdown links
    const dropdownLinks = document.querySelectorAll('.dropdown-item');

    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent the default link behavior
            
            // Get the target element's ID from data-target attribute
            const targetId = link.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Scroll to the target element
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
