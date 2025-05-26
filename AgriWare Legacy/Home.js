document.addEventListener('DOMContentLoaded', function() {
    const cartButtons = document.querySelectorAll('.add-to-cart-btn');

    cartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = button.getAttribute('data-name');
            const productPrice = button.getAttribute('data-price');
            const productImage = button.getAttribute('data-image');

            // Store the product information in localStorage
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const productIndex = cartItems.findIndex(item => item.name === productName);

            if (productIndex > -1) {
                // Update quantity if product already exists
                cartItems[productIndex].quantity += 1;
            } else {
                // Add new product
                cartItems.push({
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            // Show alert and redirect to addtocart.html
            alert(`${productName} has been added to the cart.`);
            window.location.href = 'addtocart.html'; // Redirect to addtocart.html
        });
    });
});
