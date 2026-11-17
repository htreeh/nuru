    // =====================================================
    // payment.js : 주문 및 결제 페이지
    //  - 주문상품 : 'nuru_checkout' (상품 페이지 "바로 구매하기" / 장바구니 "결제하기"에서 넘긴 상품)을 표시
    //               없으면 장바구니('nuru_cart') 전체를 표시
    //  - 쿠폰 · 적립금 · 합계 계산, 배송지 / 결제수단 / 약관 확인 후 결제
    //  - 배송지 입력 모달은 address-modal.js 에서 따로 처리 (저장 위치: localStorage 'nuru_address')
    // =====================================================
    (function () {
        'use strict';

        var CHECKOUT_KEY = 'nuru_checkout';
        var CART_KEY = 'nuru_cart';
        var ADDRESS_KEY = 'nuru_address';
        var POINT_KEY = 'nuru_points';          // 보유 적립금 (없으면 0원)

        var FREE_SHIPPING_FROM = 30000;         // 이 금액 이상이면 배송비 무료 (cart.js와 동일)
        var SHIPPING_FEE = 3000;
        var DONE_PAGE = 'main.html';            // 결제 완료 후 이동할 페이지

        /* ---------- 공통 ---------- */
        function $(id) { return document.getElementById(id); }

        function money(value) {
            return Number(value || 0).toLocaleString('ko-KR') + '원';
        }

        function readJSON(key, fallback) {
            try {
                var v = JSON.parse(localStorage.getItem(key));
                return v === null || v === undefined ? fallback : v;
            } catch (e) {
                return fallback;
            }
        }

        function writeJSON(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); }
            catch (e) { console.error('저장하지 못했습니다.', e); }
        }

        function makeEl(tag, className, text) {
            var el = document.createElement(tag);
            if (className) el.className = className;
            if (text !== undefined) el.textContent = text;
            return el;
        }

        var toastTimer;
        function showToast(message) {
            var toast = $('payToast');
            if (!toast) return;
            toast.textContent = message;
            toast.classList.remove('is-show');
            void toast.offsetWidth;
            toast.classList.add('is-show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { toast.classList.remove('is-show'); }, 2500);
        }

        /* =====================================================
        주문 상품
        ===================================================== */
        var source = 'cart';           // 'buynow' | 'cart'
        var usingCheckout = false;     // nuru_checkout 에서 읽었는지
        var items = [];

        function loadItems() {
            var checkout = readJSON(CHECKOUT_KEY, null);
            var list;
            if (checkout && Array.isArray(checkout.items) && checkout.items.length) {
                source = checkout.source || 'cart';
                usingCheckout = true;
                list = checkout.items;
            } else {
                source = 'cart';
                usingCheckout = false;
                list = readJSON(CART_KEY, []);
                if (!Array.isArray(list)) list = [];
            }
            items = list.map(function (item) {
                return {
                    key: item.key,
                    id: item.id,
                    brand: item.brand || '',
                    name: item.name || '',
                    options: item.options || '',
                    price: Number(item.price) || 0,
                    img: item.img || '',
                    link: item.link || '#',
                    quantity: Math.max(1, Number(item.quantity) || 1),
                    checked: true
                };
            });
        }

        function saveItems() {
            if (!usingCheckout) return;
            writeJSON(CHECKOUT_KEY, {
                source: source,
                items: items.map(function (item) {
                    return {
                        key: item.key, id: item.id, brand: item.brand, name: item.name,
                        options: item.options, price: item.price, img: item.img,
                        link: item.link, quantity: item.quantity
                    };
                })
            });
        }

        function renderItems() {
            var list = $('payItems');
            if (!list) return;
            list.textContent = '';

            if (!items.length) {
                list.appendChild(makeEl('li', 'pay-empty', '주문할 상품이 없습니다.'));
                return;
            }

            items.forEach(function (item) {
                var row = makeEl('li', 'pay-item');
                row.dataset.key = item.key;

                var check = makeEl('input', 'pay-item__check');
                check.type = 'checkbox';
                check.checked = item.checked;
                check.dataset.act = 'check';
                check.setAttribute('aria-label', '주문 상품 선택');

                var photo = makeEl('a', 'pay-item__photo');
                photo.href = item.link;
                var img = makeEl('img');
                img.src = item.img;
                img.alt = item.name || '상품 이미지';
                photo.appendChild(img);

                var info = makeEl('div', 'pay-item__info');
                info.appendChild(makeEl('span', 'pay-item__brand', item.brand));
                info.appendChild(makeEl('span', 'pay-item__name', item.name));
                info.appendChild(makeEl('span', 'pay-item__option', item.options));
                info.appendChild(makeEl('span', 'pay-item__price', money(item.price)));

                var actions = makeEl('div', 'pay-item__actions');
                var qty = makeEl('div', 'pay-qty');
                var minus = makeEl('button', '', '-');
                minus.type = 'button';
                minus.dataset.act = 'minus';
                minus.setAttribute('aria-label', '수량 줄이기');
                var count = makeEl('span', 'pay-qty__count', String(item.quantity));
                var plus = makeEl('button', '', '+');
                plus.type = 'button';
                plus.dataset.act = 'plus';
                plus.setAttribute('aria-label', '수량 늘리기');
                qty.append(minus, count, plus);

                var remove = makeEl('button', 'pay-remove', '삭제');
                remove.type = 'button';
                remove.dataset.act = 'remove';
                actions.append(qty, remove);

                row.append(check, photo, info, actions);
                list.appendChild(row);
            });
        }

        function findItem(key) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].key === key) return items[i];
            }
            return null;
        }

        function bindItems() {
            var list = $('payItems');
            if (!list) return;

            list.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-act]');
                if (!btn || btn.dataset.act === 'check') return;
                var row = btn.closest('.pay-item');
                var item = row && findItem(row.dataset.key);
                if (!item) return;

                if (btn.dataset.act === 'remove') {
                    items.splice(items.indexOf(item), 1);
                    saveItems();
                    renderItems();
                } else {
                    var next = item.quantity + (btn.dataset.act === 'plus' ? 1 : -1);
                    item.quantity = Math.min(99, Math.max(1, next));
                    row.querySelector('.pay-qty__count').textContent = String(item.quantity);
                    saveItems();
                }
                update();
            });

            list.addEventListener('change', function (e) {
                if (!e.target.matches('.pay-item__check')) return;
                var row = e.target.closest('.pay-item');
                var item = row && findItem(row.dataset.key);
                if (!item) return;
                item.checked = e.target.checked;
                update();
            });
        }

        /* =====================================================
        쿠폰
        ===================================================== */
        var coupons = {};
        var appliedCoupon = null;

        function loadCoupons() {
            document.querySelectorAll('#couponList .coupon-item').forEach(function (li) {
                var name = li.querySelector('.coupon-name');
                coupons[li.dataset.code] = {
                    name: name ? name.textContent : li.dataset.code,
                    rate: Number(li.dataset.rate) || 0
                };
            });
            // 목록에는 없지만 코드 입력으로 쓸 수 있는 쿠폰 (장바구니와 동일)
            coupons.SAVE3000 = { name: '7만원 이상 구매 시 3,000원 할인', fixed: 3000, min: 70000 };
        }

        function couponDiscount(productTotal) {
            var c = appliedCoupon && coupons[appliedCoupon];
            if (!c) return 0;
            if (c.min && productTotal < c.min) return 0;
            if (c.fixed) return Math.min(c.fixed, productTotal);
            return Math.floor(productTotal * c.rate);
        }

        function couponMessage(text, isError) {
            var msg = $('couponMsg');
            if (!msg) return;
            msg.textContent = text || '';
            msg.classList.toggle('is-error', !!isError);
        }

        function selectedProductTotal() {
            return items.reduce(function (sum, item) {
                return item.checked ? sum + item.price * item.quantity : sum;
            }, 0);
        }

        function applyCoupon(code, fromList) {
            var c = coupons[code];
            if (!code) { couponMessage('쿠폰 코드를 입력해주세요.', true); return; }
            if (!c) { couponMessage('유효하지 않은 쿠폰 코드입니다.', true); return; }

            if (appliedCoupon === code && fromList) {
                appliedCoupon = null;
                couponMessage('쿠폰 적용이 해제되었습니다.');
            } else if (c.min && selectedProductTotal() < c.min) {
                couponMessage('최소 주문 금액 ' + money(c.min) + ' 이상부터 사용할 수 있습니다.', true);
                return;
            } else {
                appliedCoupon = code;
                couponMessage(c.name + '이(가) 적용되었습니다.');
            }
            update();
        }

        function updateCouponUI() {
            var c = appliedCoupon && coupons[appliedCoupon];
            var status = $('couponStatus');
            if (status) status.textContent = c ? c.name + ' 적용됨' : '선택 안 함';

            document.querySelectorAll('#couponList .coupon-item').forEach(function (li) {
                var on = li.dataset.code === appliedCoupon;
                li.classList.toggle('selected', on);
                var btn = li.querySelector('.coupon-select-btn');
                if (btn) {
                    btn.classList.toggle('applied', on);
                    btn.textContent = on ? '적용됨' : '적용';
                }
            });
        }

        function bindCoupons() {
            var toggle = $('couponToggle');
            var panel = $('couponPanel');
            if (toggle && panel) {
                toggle.addEventListener('click', function () {
                    var open = panel.hidden;
                    panel.hidden = !open;
                    toggle.classList.toggle('is-open', open);
                    toggle.setAttribute('aria-expanded', String(open));
                });
            }

            var applyBtn = $('couponApply');
            var input = $('couponInput');
            if (applyBtn && input) {
                applyBtn.addEventListener('click', function () {
                    applyCoupon(input.value.trim().toUpperCase(), false);
                });
                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCoupon(input.value.trim().toUpperCase(), false);
                    }
                });
            }

            var list = $('couponList');
            if (list) {
                list.addEventListener('click', function (e) {
                    var li = e.target.closest('.coupon-item');
                    if (li) applyCoupon(li.dataset.code, true);
                });
            }
        }

        /* =====================================================
        적립금
        ===================================================== */
        var pointHave = Math.max(0, Math.floor(Number(localStorage.getItem(POINT_KEY)) || 0));
        var pointUse = 0;

        function bindPoints() {
            var input = $('pointInput');
            var maxBtn = $('pointMax');
            var have = $('pointHave');
            if (have) have.textContent = Number(pointHave).toLocaleString('ko-KR');

            if (input) {
                input.addEventListener('input', function () {
                    pointUse = Math.max(0, parseInt(input.value, 10) || 0);
                    update();
                });
                input.addEventListener('blur', function () {
                    input.value = String(pointUse);
                });
            }
            if (maxBtn) {
                maxBtn.addEventListener('click', function () {
                    pointUse = Number.MAX_SAFE_INTEGER;   // update() 에서 사용 가능한 최대치로 맞춰짐
                    update();
                });
            }
        }

        /* =====================================================
        합계 / 화면 갱신
        ===================================================== */
        var lastTotal = 0;

        function update() {
            var product = selectedProductTotal();
            var selectedCount = items.filter(function (i) { return i.checked; }).length;

            // 최소 주문 금액 미달이 되면 정액 쿠폰은 자동 해제
            var c = appliedCoupon && coupons[appliedCoupon];
            if (c && c.min && product < c.min) {
                appliedCoupon = null;
                couponMessage('최소 주문 금액 ' + money(c.min) + ' 미만이라 쿠폰 적용이 해제되었습니다.', true);
            }

            var shipping = product === 0 ? 0 : (product >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE);
            var discount = couponDiscount(product);

            var pointLimit = Math.max(0, product - discount);
            var pointMax = Math.min(pointHave, pointLimit);
            if (pointUse > pointMax) pointUse = pointMax;

            var total = product + shipping - discount - pointUse;
            lastTotal = total;

            var set = function (id, text) { var el = $(id); if (el) el.textContent = text; };
            set('sumProduct', money(product));
            set('sumShipping', shipping === 0 ? '무료' : money(shipping));
            set('sumDiscount', discount > 0 ? '-' + money(discount) : '0원');
            set('sumTotal', money(total));
            set('couponLimit', Number(Math.floor(product * maxRate())).toLocaleString('ko-KR'));
            set('pointLimit', Number(pointLimit).toLocaleString('ko-KR'));

            var pointRow = $('pointRow');
            if (pointRow) {
                pointRow.hidden = pointUse <= 0;
                set('sumPoint', '-' + money(pointUse));
            }

            var pointInput = $('pointInput');
            if (pointInput) {
                var typed = parseInt(pointInput.value, 10) || 0;
                if (document.activeElement !== pointInput || typed !== pointUse) pointInput.value = String(pointUse);
            }

            var payBtn = $('payBtn');
            if (payBtn) {
                payBtn.textContent = money(total) + ' 결제하기';
                payBtn.disabled = selectedCount === 0;
            }

            updateCouponUI();
        }

        // 보유 쿠폰 중 가장 큰 할인율 (사용 한도 표시용)
        function maxRate() {
            var rate = 0;
            Object.keys(coupons).forEach(function (code) {
                if (coupons[code].rate > rate) rate = coupons[code].rate;
            });
            return rate;
        }

        /* =====================================================
        약관 · 결제
        ===================================================== */
        function bindAgree() {
            var all = $('agreeAll');
            var boxes = document.querySelectorAll('.agree-item');
            var wrap = document.querySelector('.agree');

            function clearMiss() {
                if (wrap && requiredAgreed()) wrap.classList.remove('is-miss');
            }

            if (all) {
                all.addEventListener('change', function () {
                    boxes.forEach(function (b) { b.checked = all.checked; });
                    clearMiss();
                });
            }
            boxes.forEach(function (b) {
                b.addEventListener('change', function () {
                    if (all) all.checked = Array.prototype.every.call(boxes, function (x) { return x.checked; });
                    clearMiss();
                });
            });
        }

        function requiredAgreed() {
            return Array.prototype.every.call(document.querySelectorAll('.agree-item[data-required]'), function (b) {
                return b.checked;
            });
        }

        function completeOrder() {
            var paidKeys = items.filter(function (i) { return i.checked; }).map(function (i) { return i.key; });

            // 장바구니에서 결제한 경우에만, 결제한 상품을 장바구니에서 뺀다 (바로구매는 장바구니를 건드리지 않음)
            if (source === 'cart') {
                var cart = readJSON(CART_KEY, []);
                if (Array.isArray(cart)) {
                    writeJSON(CART_KEY, cart.filter(function (i) { return paidKeys.indexOf(i.key) === -1; }));
                }
            }
            try { localStorage.removeItem(CHECKOUT_KEY); } catch (e) { /* 무시 */ }

            showToast('주문이 완료되었습니다.');
            var payBtn = $('payBtn');
            if (payBtn) payBtn.disabled = true;
            setTimeout(function () { location.href = DONE_PAGE; }, 1200);
        }

        function bindPay() {
            var payBtn = $('payBtn');
            if (!payBtn) return;

            payBtn.addEventListener('click', function () {
                // 1) 주문내용 확인 및 결제 동의 (약관)
                if (!requiredAgreed()) {
                    var wrap = document.querySelector('.agree');
                    if (wrap) {
                        wrap.classList.add('is-miss');
                        wrap.classList.remove('is-nudge');
                        void wrap.offsetWidth;
                        wrap.classList.add('is-nudge');
                    }
                    showToast('필수 약관에 모두 동의해주세요.');
                    return;
                }
                // 2) 상품 → 3) 배송지 → 4) 결제수단
                if (!items.some(function (i) { return i.checked; })) {
                    showToast('주문할 상품을 선택해주세요.');
                    return;
                }
                if (!readAddress()) {
                    showToast('배송지를 입력해주세요.');
                    openAddressModal();
                    return;
                }
                if (!document.querySelector('input[name="payMethod"]:checked')) {
                    showToast('결제수단을 선택해주세요.');
                    var methods = $('payMethods');
                    if (methods && methods.scrollIntoView) methods.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    return;
                }
                completeOrder();
            });
        }

        /* =====================================================
        배송지 (입력은 address-modal.js 가 담당, 여기서는 저장된 값만 확인)
        ===================================================== */
        function readAddress() {
            var a = readJSON(ADDRESS_KEY, null);
            return a && a.name && a.phone && a.address ? a : null;
        }

        // 배송지 입력 모달 열기 ("배송지 변경 >" 버튼을 누른 것과 같음)
        function openAddressModal() {
            var btn = $('addressChange');
            if (btn) btn.click();
        }

        /* =====================================================
        시작
        ===================================================== */
        function init() {
            loadItems();
            loadCoupons();
            renderItems();
            bindItems();
            bindCoupons();
            bindPoints();
            bindAgree();
            bindPay();

            update();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();