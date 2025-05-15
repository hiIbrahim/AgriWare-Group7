document.addEventListener("DOMContentLoaded", function () {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const purchaseBtn = document.getElementById('purchaseBtn');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        purchaseBtn.style.display = 'none';
    } else {
        renderCartItems();
        purchaseBtn.style.display = 'block';
    }

    function updateTotalPrice() {
        let totalPrice = cart.reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);
        totalPriceElement.textContent = `៛ ${totalPrice}`;
    }

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
    }

    window.changeQuantity = function (index, delta) {
        if (cart[index].quantity + delta > 0) {
            cart[index].quantity += delta;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartItems();
        }
    };

    window.removeFromCart = function (index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
            totalPriceElement.textContent = '';
            purchaseBtn.style.display = 'none';
        } else {
            renderCartItems();
        }
    };

    function updateStockInLocalStorage(productName, quantity) {
        const stockKey = `${productName}-stock`;
        let currentStock = parseInt(localStorage.getItem(stockKey)) || 0;
        if (currentStock >= quantity) {
            currentStock -= quantity;
            localStorage.setItem(stockKey, currentStock);
            const stockElement = document.querySelector(`.product-card[data-product-name="${productName}"] .stock-quantity`);
            if (stockElement) {
                stockElement.textContent = currentStock;
            }
        } else {
            console.error('Not enough stock to update');
        }
    }

    purchaseBtn.addEventListener('click', function () {
        if (!loggedInUser.phone || !loggedInUser.username) {
            alert('You must be logged in to make a purchase.');
            window.location.href = 'login.html';
            return;
        }

        let message = `🛒🛒🛒 New Purchase Order:\n`;
        message += `Username: ${loggedInUser.username}\n`;
        message += `Phone Number: ${loggedInUser.phone}\n\n`;
        cart.forEach(item => {
            const subtotal = parseInt(item.price) * item.quantity;
            message += `Product: ${item.name}\nPrice: ៛ ${item.price}\nQuantity: ${item.quantity}\nSubtotal: ៛ ${subtotal}\n\n`;
            updateStockInLocalStorage(item.name, item.quantity);
        });
        let totalPrice = cart.reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);
        message += `✅Total Price: ៛ ${totalPrice}`;

        const botToken = '6893994364:AAHYI0MYtW84KsJNoO8TcEW4CWt-IE78BaA'; // Replace with your bot token
        const chatId = '-1002347920083'; // Replace with your chat ID
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                alert('Thank you for your purchase! Your order has been sent.');
                localStorage.removeItem('cart');
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index2.html';
            } else {
                alert(`Error: ${data.description}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to send purchase details to Telegram. Please try again.');
        });
    });

    renderCartItems();
});
