document.addEventListener("DOMContentLoaded", function () {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const cartCountElement = document.querySelector('.cart-count');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Update cart count on load
    updateCartCount();

    // Check if cart has items
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        } else {
            renderCartItems();
        }
    }

    // Function to update the cart count
    function updateCartCount() {
        const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalCount;
    }

    // Function to update the total price
    function updateTotalPrice() {
        let totalPrice = cart.reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);
        totalPriceElement.textContent = `៛ ${totalPrice}`;
    }

    // Function to render cart items
    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('col-md-4', 'cart-item', 'mb-3');
            cartItem.innerHTML = `
                <img src="${item.image}" class="img-fluid mb-2" alt="${item.name}">
                <h5>${item.name}</h5>
                <p>Price: ៛ ${item.price}</p>
                <div class="quantity">
                    <button class="btn btn-sm btn-success" onclick="changeQuantity(${index}, -1)">-</button>
                    <input type="text" value="${item.quantity}" readonly>
                    <button class="btn btn-sm btn-success" onclick="changeQuantity(${index}, 1)">+</button>
                </div>
                <button class="btn btn-danger mt-2" onclick="removeFromCart(${index})">Remove</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        updateTotalPrice();
        updateCartCount();  // Update the cart count when items are rendered
    }

    // Function to change quantity
    window.changeQuantity = function (index, delta) {
        if (cart[index].quantity + delta > 0) {
            cart[index].quantity += delta;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartItems();
        }
    };

    // Function to remove item from cart
    window.removeFromCart = function (index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
    };

    // Handle Add to Cart button
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const productName = button.getAttribute('data-product-name');
            const productPrice = button.getAttribute('data-product-price');
            const productImage = button.getAttribute('data-product-image');
            const quantity = parseInt(button.previousElementSibling.querySelector('.quantity').textContent);

            // Get the available stock from the stock-quantity element
            const stockElement = document.querySelector(`.stock-quantity[data-product="${productName}"]`);
            const availableStock = parseInt(stockElement.textContent);

            // Check if the requested quantity exceeds available stock
            if (quantity > availableStock) {
                alert(`Cannot add more than available stock. Available: ${availableStock}`);
                return; // Exit the function if stock limit is exceeded
            }

            // Check if product already in cart
            const existingProduct = cart.find(item => item.name === productName);
            if (existingProduct) {
                existingProduct.quantity += quantity;
            } else {
                cart.push({ name: productName, price: productPrice, image: productImage, quantity: quantity });
            }

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Update cart count
            updateCartCount();
        });
    });

    // Purchase button functionality
    document.getElementById('purchaseBtn')?.addEventListener('click', function () {
        alert('Thank you for your purchase!');
        localStorage.removeItem('cart');
        cart = [];
        renderCartItems();
        updateCartCount(); // Reset cart count after purchase
    });

    renderCartItems();
});
