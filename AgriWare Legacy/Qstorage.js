document.addEventListener('DOMContentLoaded', function () {
    const productStocks = {
        "ជី DAP": 20,
        "ជី A-An": 17,
        "ជី NP": 25,
        "ជី N": 40,
        "ថ្នាំ​": 20,
        "ជី D": 20,
        "ជី": 30,
        "ជី Dapp": 23,
        "ជី Dappp": 24,
        "ជី Doppp": 24,
        "ជី Dop": 24,
        "ជី dop": 24,
        "ជី NPK": 24,
        "ជី NPKKK": 24,
        "ជី NPKK": 24,
        "ជី NP": 24,
        "ជី N": 24,
        "ជី npk": 24,
        "ជី np": 24,
        "ជី n": 24,
        "ជី NPKKk": 24,
        "ជី NPKkK": 24,
        "ជី NPkK": 24,
        "ជី NPKKKk": 24,
        "ថ្នាំកសិកម្ម": 24,
        "ថ្នាំ​គីមី": 24,
        "ជីក្របី": 24,
        "ជីមាន់": 26,
    };

    function initializeStock() {
        Object.keys(productStocks).forEach(productName => {
            const stockKey = `${productName}-stock`;
            if (localStorage.getItem(stockKey) === null) {
                localStorage.setItem(stockKey, productStocks[productName]);
            }
        });
    }

    function updateStockDisplay(productName) {
        const stockElement = document.querySelector(`.product-card[data-product-name="${productName}"] .stock-quantity`);
        if (!stockElement) {
            console.error(`Stock element not found for ${productName}`);
            return;
        }
        const stockKey = `${productName}-stock`;
        const stockQuantity = parseInt(localStorage.getItem(stockKey)) || 0;
        stockElement.textContent = stockQuantity;
    }

    function finalizePurchase(productName, quantity) {
        const stockKey = `${productName}-stock`;
        let currentStock = parseInt(localStorage.getItem(stockKey));
        if (currentStock >= quantity) {
            currentStock -= quantity;
            localStorage.setItem(stockKey, currentStock);
            updateStockDisplay(productName);
        } else {
            console.error('Not enough stock to finalize the purchase');
        }
    }

    function handleProductStock(productCard) {
        const productName = productCard.querySelector('.product-name').textContent.trim();
        const stockElement = productCard.querySelector('.stock-quantity');
        const stockKey = `${productName}-stock`;
        const quantityDisplay = productCard.querySelector('.quantity');
        const addToCartButton = productCard.querySelector('.add-to-cart');
        const increaseButton = productCard.querySelector('.quantity-btn[data-action="increase"]'); // Select increase button

        let stockQuantity = parseInt(localStorage.getItem(stockKey));
        stockElement.textContent = stockQuantity;

        addToCartButton.addEventListener('click', function () {
            const selectedQuantity = parseInt(quantityDisplay.textContent);
            let currentStock = parseInt(localStorage.getItem(stockKey));

            if (currentStock >= selectedQuantity) {
                alert(`Added ${selectedQuantity} ${productName} to cart. Complete the purchase to update stock.`);
            } else {
                alert(`Insufficient stock for ${productName}. Only ${currentStock} left.`);
            }
        });

        productCard.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function () {
                const action = this.getAttribute('data-action');
                let currentQuantity = parseInt(quantityDisplay.textContent);

                if (action === 'increase') {
                    if (currentQuantity < stockQuantity) {
                        quantityDisplay.textContent = currentQuantity + 1;
                    } else {
                        increaseButton.disabled = true; // Disable increase button
                        alert(`Cannot increase quantity. Only ${stockQuantity} left in stock.`);
                    }
                } else if (action === 'decrease' && currentQuantity > 1) {
                    quantityDisplay.textContent = currentQuantity - 1;
                    increaseButton.disabled = false; // Enable the increase button if decreased
                }
            });
        });

        // Disable add to cart button if stock is zero
        if (parseInt(stockElement.textContent) === 0) {
            addToCartButton.disabled = true;
        }
    }

    initializeStock();

    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        handleProductStock(card);
    });
});
