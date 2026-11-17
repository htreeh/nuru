    (function () {
        'use strict';

        var KEY = 'nuru_cart';

        function read() {
            try {
                var items = JSON.parse(localStorage.getItem(KEY));
                return Array.isArray(items) ? items : [];
            } catch (error) {
                console.error('장바구니를 불러오지 못했습니다.', error);
                return [];
            }
        }

        function write(items) {
            try {
                localStorage.setItem(KEY, JSON.stringify(items));
            } catch (error) {
                console.error('장바구니를 저장하지 못했습니다.', error);
            }
        }

        /* 결제 페이지로 넘길 주문 상품 (바로구매 / 장바구니 선택 결제) */
        var CHECKOUT_KEY = 'nuru_checkout';

        function setCheckout(source, items) {
            try {
                localStorage.setItem(CHECKOUT_KEY, JSON.stringify({ source: source, items: items }));
                return true;
            } catch (error) {
                console.error('주문 상품을 저장하지 못했습니다.', error);
                return false;
            }
        }

        // 선택된 옵션 한 줄(.sel-item)의 수량. 수량 표시를 못 찾으면 1
        function readOptionQty(optionEl) {
            var el = optionEl.querySelector('.sel-item__qty, .sel-item__count, .sel-item__num, .qty, .quantity, input[type="number"]');
            var n = el ? parseInt(el.value !== undefined && el.value !== '' ? el.value : el.textContent, 10) : NaN;
            return n > 0 ? n : 1;
        }

        function money(value) {
            return Number(value || 0).toLocaleString('ko-KR') + '원';
        }

        function makeElement(tag, className, text) {
            var element = document.createElement(tag);
            if (className) element.className = className;
            if (text !== undefined) element.textContent = text;
            return element;
        }

        function render() {
            var listElement = document.getElementById('cart-list');
            var empty = document.getElementById('cart-empty');
            var cartRight = document.getElementById('cart-right');
            var selectAllCheckbox = document.getElementById('select-all');
            var items = read();
            var count = items.reduce(function (total, item) {
                return total + Number(item.quantity || 0);
            }, 0);

            document.querySelectorAll('[data-cart-count]').forEach(function (element) {
                element.textContent = count;
            });

            if (!listElement) return;
            listElement.textContent = '';
            items.forEach(function (item) {
                var row = makeElement('li', 'cart-item');
                var checkbox = makeElement('input', 'cart-item__checkbox');
                checkbox.type = 'checkbox';
                checkbox.dataset.cartKey = item.key;
                checkbox.checked = true;
                checkbox.setAttribute('aria-label', '상품 선택');

                var photoLink = makeElement('a', 'cart-item__photo');
                photoLink.href = item.link || 'pdp01.html';
                var image = makeElement('img');
                image.src = item.img;
                image.alt = item.name || '상품 이미지';
                photoLink.appendChild(image);

                var details = makeElement('div', 'cart-item__details');
                details.appendChild(makeElement('span', 'cart-item__brand', item.brand));
                details.appendChild(makeElement('a', 'cart-item__name', item.name));
                details.lastChild.href = item.link || 'pdp01.html';
                details.appendChild(makeElement('span', 'cart-item__option', item.options));
                details.appendChild(makeElement('strong', 'cart-item__price', money(item.price)));

                var actions = makeElement('div', 'cart-item__actions');
                var quantity = makeElement('div', 'cart-quantity');
                var decrease = makeElement('button', '', '−');
                decrease.type = 'button';
                decrease.dataset.cartAction = 'decrease';
                decrease.dataset.cartKey = item.key;
                decrease.setAttribute('aria-label', '수량 줄이기');
                var amount = makeElement('span', '', String(item.quantity));
                var increase = makeElement('button', '', '+');
                increase.type = 'button';
                increase.dataset.cartAction = 'increase';
                increase.dataset.cartKey = item.key;
                increase.setAttribute('aria-label', '수량 늘리기');
                quantity.append(decrease, amount, increase);

                var remove = makeElement('button', 'cart-remove', '삭제');
                remove.type = 'button';
                remove.dataset.cartAction = 'remove';
                remove.dataset.cartKey = item.key;
                actions.append(quantity, remove);
                row.append(checkbox, photoLink, details, actions);
                listElement.appendChild(row);
            });

            if (empty) empty.hidden = items.length > 0;
            if (cartRight) cartRight.hidden = items.length === 0;

            updateSelectedTotal();

            if (selectAllCheckbox) {
                selectAllCheckbox.checked = true;
            }
        }

        function add(product, options) {
            var cartItems = read();
            var itemKey = product.id + '|' + options;
            var existing = cartItems.find(function (item) { return item.key === itemKey; });
            if (existing) {
                existing.quantity += 1;
            } else {
                cartItems.push({
                    key: itemKey,
                    id: product.id,
                    brand: product.brand,
                    name: product.name,
                    price: Number(String(product.price).replace(/[^0-9]/g, '')),
                    img: product.img,
                    link: product.link,
                    options: options,
                    quantity: 1
                });
            }
            write(cartItems);
            render();
        }

        var MIN_ORDER = 70000;        // 3,000원 할인 쿠폰 최소 주문 금액
        var lastSelectedTotal = 0;

        function updateSelectedTotal() {
            var items = read();
            var selectedItems = [];
            var selectedCheckboxes = document.querySelectorAll('.cart-item__checkbox:checked');
            selectedCheckboxes.forEach(function(checkbox) {
                var key = checkbox.dataset.cartKey;
                var item = items.find(function(i) { return i.key === key; });
                if (item) selectedItems.push(item);
            });

            var selectedCount = selectedItems.reduce(function (total, item) {
                return total + Number(item.quantity || 0);
            }, 0);

            var selectedTotal = selectedItems.reduce(function (sum, item) {
                return sum + Number(item.price || 0) * Number(item.quantity || 0);
            }, 0);

            lastSelectedTotal = selectedTotal;
            var shippingFee = selectedTotal >= 30000 ? 0 : 3000;
            var discount = 0;

            if (currentCoupon === 'WELCOME5') {
                discount = Math.floor(selectedTotal * 0.05);
            } else if (currentCoupon === 'SAVE3000' && selectedTotal >= MIN_ORDER) {
                discount = 3000;
            }

            var finalTotal = selectedTotal + shippingFee - discount;

            var summaryProductTotal = document.getElementById('summary-product-total');
            if (summaryProductTotal) summaryProductTotal.textContent = money(selectedTotal);

            var summaryShipping = document.getElementById('summary-shipping');
            if (summaryShipping) summaryShipping.textContent = shippingFee === 0 ? '무료' : money(shippingFee);

            var summaryDiscount = document.getElementById('summary-discount');
            if (summaryDiscount) {
                summaryDiscount.textContent = discount > 0 ? '-' + money(discount) : '-0원';
                summaryDiscount.style.color = discount > 0 ? '#8FC0E8' : '#b3b8ba';
            }

            var summaryFinalTotal = document.getElementById('summary-final-total');
            if (summaryFinalTotal) summaryFinalTotal.textContent = money(finalTotal);
        }

        var cartToastTimer;
        var pendingDeleteKey = null;

        function showCartToast() {
            var toast = document.getElementById('cart-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'cart-toast';
                toast.className = 'wishlist-toast';
                toast.setAttribute('role', 'status');
                toast.setAttribute('aria-live', 'polite');
                toast.innerHTML =
        '<span>장바구니에 담았습니다.</span>' +
        '<a href="cart.html">장바구니 보기 &gt;</a>';
                document.body.appendChild(toast);
            }
            toast.classList.remove('is-show');
            void toast.offsetWidth;
            toast.classList.add('is-show');

            clearTimeout(cartToastTimer);
            cartToastTimer = setTimeout(function () {
                toast.classList.remove('is-show');
            }, 3000);
        }

        function showDeleteModal(key) {
            pendingDeleteKey = key;
            var modal = document.getElementById('delete-modal');
            if (modal) modal.hidden = false;
        }

        function hideDeleteModal() {
            pendingDeleteKey = null;
            var modal = document.getElementById('delete-modal');
            if (modal) modal.hidden = true;
        }

        function confirmDelete() {
            if (!pendingDeleteKey) return;
            var items = read();
            var itemIndex = items.findIndex(function (item) { return item.key === pendingDeleteKey; });
            if (itemIndex >= 0) {
                items.splice(itemIndex, 1);
                write(items);
                render();
            }
            hideDeleteModal();
        }

        document.addEventListener('click', function (event) {
            var cartButton = event.target.closest('.btn-cart');
            if (cartButton) {
                var selected = document.querySelectorAll('#sel-list .sel-item');
                if (!selected.length) return;
                var productElement = document.querySelector('.product-detail[data-id]');
                if (!productElement) return;
                var product = productElement.dataset;
                Array.prototype.forEach.call(selected, function (option) {
                    add(product, option.querySelector('.sel-item__opt').textContent);
                });
                var message = document.getElementById('opt-msg');
                if (message) message.textContent = '장바구니에 담았습니다.';
                showCartToast();
                return;
            }

            // 상품 페이지 "바로 구매하기" : 선택한 상품만 결제 페이지로 (장바구니는 그대로)
            var buyButton = event.target.closest('.btn-buy');
            if (buyButton) {
                var buyOptions = document.querySelectorAll('#sel-list .sel-item');
                var buyProduct = document.querySelector('.product-detail[data-id]');
                if (!buyProduct) return;
                if (!buyOptions.length) return;   // 안내 문구는 상품 페이지 JS(pdpXX.js)가 띄움
                var bp = buyProduct.dataset;
                var buyItems = Array.prototype.map.call(buyOptions, function (option) {
                    var optionText = option.querySelector('.sel-item__opt').textContent;
                    return {
                        key: bp.id + '|' + optionText,
                        id: bp.id,
                        brand: bp.brand,
                        name: bp.name,
                        price: Number(String(bp.price).replace(/[^0-9]/g, '')),
                        img: bp.img,
                        link: bp.link,
                        options: optionText,
                        quantity: readOptionQty(option)
                    };
                });
                if (setCheckout('buynow', buyItems)) location.href = 'payment.html';
                return;
            }

            // 장바구니 "결제하기" : 체크된 상품만 결제 페이지로
            if (event.target.closest('#cart-checkout')) {
                var allItems = read();
                var pickedItems = [];
                document.querySelectorAll('.cart-item__checkbox:checked').forEach(function (checkbox) {
                    var found = allItems.find(function (item) { return item.key === checkbox.dataset.cartKey; });
                    if (found) pickedItems.push(found);
                });
                if (!pickedItems.length) {
                    alert('결제할 상품을 선택해주세요.');
                    return;
                }
                if (setCheckout('cart', pickedItems)) location.href = 'payment.html';
                return;
            }

            var actionButton = event.target.closest('[data-cart-action]');
            if (!actionButton) return;
            var action = actionButton.dataset.cartAction;
            var key = actionButton.dataset.cartKey;
            var items = read();
            var itemIndex = items.findIndex(function (item) { return item.key === key; });
            if (itemIndex < 0) return;
            if (action === 'remove') {
                showDeleteModal(key);
                return;
            } else if (action === 'increase') {
                items[itemIndex].quantity += 1;
            } else if (action === 'decrease') {
                items[itemIndex].quantity = Math.max(1, items[itemIndex].quantity - 1);
            }
            write(items);
            render();
        });

        // 삭제 팝업 버튼 이벤트
        var deleteCancelBtn = document.getElementById('delete-cancel');
        if (deleteCancelBtn) {
            deleteCancelBtn.addEventListener('click', hideDeleteModal);
        }

        var deleteConfirmBtn = document.getElementById('delete-confirm');
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', confirmDelete);
        }

        // 오버레이 클릭 시 팝업 닫기
        var deleteModal = document.getElementById('delete-modal');
        if (deleteModal) {
            deleteModal.addEventListener('click', function(event) {
                if (event.target.classList.contains('delete-modal__overlay')) {
                    hideDeleteModal();
                }
            });
        }

        // 쿠폰 적용 기능
        var couponApplyBtn = document.getElementById('coupon-apply');
        var couponInput = document.getElementById('coupon-input');
        var couponMessage = document.getElementById('coupon-message');
        var currentCoupon = null;

        function applyCoupon(couponCode) {
            if (!couponCode) {
                couponMessage.textContent = '쿠폰 코드를 입력해주세요.';
                couponMessage.style.color = '#ff6b6b';
                return;
            }

            if (currentCoupon === couponCode) {
                currentCoupon = null;
                couponInput.value = '';
                couponMessage.textContent = '쿠폰 적용이 해제되었습니다.';
                couponMessage.style.color = '#b3b8ba';
            } else {
                currentCoupon = couponCode;
                couponInput.value = couponCode;

                if (couponCode === 'WELCOME5') {
                    couponMessage.textContent = '신규 회원 5% 할인쿠폰이 적용되었습니다!';
                    couponMessage.style.color = '#8FC0E8';
                } else if (couponCode === 'SAVE3000') {
                    couponMessage.textContent = '7만원 이상 구매 시 3,000원 할인쿠폰이 적용되었습니다!';
                    couponMessage.style.color = '#8FC0E8';
                } else {
                    couponMessage.textContent = '유효하지 않은 쿠폰 코드입니다.';
                    couponMessage.style.color = '#ff6b6b';
                    currentCoupon = null;
                }
            }

            updateSelectedTotal();
            updateCouponButtons();

            if (currentCoupon === 'SAVE3000' && lastSelectedTotal < MIN_ORDER) {
                couponMessage.textContent = '최소 주문 금액 70,000원 이상부터 할인이 적용됩니다.';
                couponMessage.style.color = '#ff6b6b';
            }
        }

        function updateCouponButtons() {
            var couponButtons = document.querySelectorAll('.coupon-select-btn');
            var couponItems = document.querySelectorAll('.coupon-item');

            couponButtons.forEach(function(btn) {
                if (btn.dataset.coupon === currentCoupon) {
                    btn.classList.add('applied');
                    btn.textContent = '적용됨';
                } else {
                    btn.classList.remove('applied');
                    btn.textContent = '적용';
                }
            });

            couponItems.forEach(function(item) {
                var btn = item.querySelector('.coupon-select-btn');
                if (btn && btn.dataset.coupon === currentCoupon) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        if (couponApplyBtn && couponInput && couponMessage) {
            couponApplyBtn.addEventListener('click', function() {
                applyCoupon(couponInput.value.trim());
            });
        }

        // 쿠폰 목록 버튼 클릭
        var couponSelectBtns = document.querySelectorAll('.coupon-select-btn');
        couponSelectBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var couponCode = btn.dataset.coupon;
                applyCoupon(couponCode);
            });
        });

        // 아코디언 메뉴 토글
        var couponToggle = document.getElementById('coupon-toggle');
        var couponList = document.getElementById('coupon-list');

        if (couponToggle && couponList) {
            couponToggle.addEventListener('click', function() {
                couponToggle.classList.toggle('active');
                couponList.hidden = !couponList.hidden;
            });
        }

        window.addEventListener('storage', function (event) {
            if (event.key === KEY) render();
        });

        window.NuruCart = { add: add, read: read, refresh: render };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', render);
        } else {
            render();
        }

        // 전체 선택 체크박스 기능
        var selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                var itemCheckboxes = document.querySelectorAll('.cart-item__checkbox');
                itemCheckboxes.forEach(function(checkbox) {
                    checkbox.checked = selectAllCheckbox.checked;
                });
                updateSelectedTotal();
            });

            // 개별 체크박스 변경 시 전체 선택 체크박스 업데이트
            document.addEventListener('change', function(e) {
                if (e.target.classList.contains('cart-item__checkbox')) {
                    var itemCheckboxes = document.querySelectorAll('.cart-item__checkbox');
                    var allChecked = Array.prototype.every.call(itemCheckboxes, function(cb) {
                        return cb.checked;
                    });
                    selectAllCheckbox.checked = allChecked;
                    updateSelectedTotal();
                }
            });
        }
    })();