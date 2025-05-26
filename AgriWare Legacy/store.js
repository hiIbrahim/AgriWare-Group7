document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.querySelector('.cart-icon .fa-shopping-cart');

    // Function to update cart count
    function updateCartCount() {
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartIcon.setAttribute('data-count', cartCount);
    }

    // Handle quantity change
    document.querySelectorAll('.quantity-btn[data-action="increase"]').forEach(button => {
        button.addEventListener('click', (event) => {
            const quantityElement = event.target.parentElement.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);
            quantityElement.textContent = ++quantity;
        });
    });

    document.querySelectorAll('.quantity-btn[data-action="decrease"]').forEach(button => {
        button.addEventListener('click', (event) => {
            const quantityElement = event.target.parentElement.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);
            if (quantity > 1) {
                quantityElement.textContent = --quantity;
            }
        });
    });

    // Handle Add to Cart button
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (event) => {
            const productName = button.getAttribute('data-product-name');
            const productPrice = button.getAttribute('data-product-price');
            const productImage = button.getAttribute('data-product-image');
            const quantity = parseInt(button.previousElementSibling.querySelector('.quantity').textContent);

            // Check if product already in cart
            const existingProduct = cart.find(item => item.name === productName);
            if (existingProduct) {
                existingProduct.quantity += quantity;
            } else {
                cart.push({ name: productName, price: productPrice, image: productImage, quantity: quantity });
            }

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        });
    });

    // Initial update of cart count
    updateCartCount();
});
