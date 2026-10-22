    // =====================================================
    // address-modal.js : 배송지 입력 모달 폼
    //  - "배송지 변경 >" 버튼을 누르면 모달 폼이 열림 (기존 입력 방식 대신 동작)
    //  - 저장하면 #addrMain / #addrSub / #addrDoor 에 반영, localStorage('nuru_address')에 보관
    //  - payment.js 뒤에 불러오세요:  <script src="jquery/address-modal.js"></script>
    // =====================================================
    (function () {
        'use strict';

        var KEY = 'nuru_address';
        var btn = document.getElementById('addressChange');
        var mainEl = document.getElementById('addrMain');
        var subEl = document.getElementById('addrSub');
        var doorEl = document.getElementById('addrDoor');
        if (!btn || !mainEl || !subEl || !doorEl) return;

        var DEFAULTS = {
            main: mainEl.textContent,
            sub: subEl.textContent,
            door: doorEl.textContent
        };

        /* ---------- 저장소 ---------- */
        function read() {
            try { return JSON.parse(localStorage.getItem(KEY)) || null; }
            catch (e) { return null; }
        }
        function write(data) {
            try { localStorage.setItem(KEY, JSON.stringify(data)); }
            catch (e) { console.error('배송지를 저장하지 못했습니다.', e); }
        }

        /* ---------- 화면 반영 ---------- */
        function apply(a) {
            if (!a) return;
            mainEl.textContent = (a.address + ' ' + (a.detail || '')).trim();
            subEl.textContent = a.name + ' / ' + a.phone;
            doorEl.textContent = a.door || '미입력';
        }

        /* ---------- 모달 만들기 ---------- */
        var modal = document.createElement('div');
        modal.className = 'addr-modal';
        modal.id = 'addrModal';
        modal.hidden = true;
        modal.innerHTML =
            '<div class="addr-modal__dim" data-close></div>' +
            '<form class="addr-modal__card order-summary" role="dialog" aria-modal="true" aria-labelledby="addrModalTitle" novalidate>' +
                '<h2 id="addrModalTitle">배송지 입력</h2>' +
                '<div class="addr-field"><label for="addrName">받는 분</label>' +
                    '<input id="addrName" type="text" maxlength="20" placeholder="이름을 입력해주세요." autocomplete="name"></div>' +
                '<div class="addr-field"><label for="addrPhone">연락처</label>' +
                    '<input id="addrPhone" type="tel" inputmode="numeric" maxlength="13" placeholder="010-0000-0000" autocomplete="tel"></div>' +
                '<div class="addr-field"><label for="addrAddress">주소</label>' +
                    '<input id="addrAddress" type="text" placeholder="도로명 주소를 입력해주세요." autocomplete="street-address">' +
                    '<input id="addrDetail" type="text" placeholder="상세 주소 (동·호수)" aria-label="상세 주소"></div>' +
                '<div class="addr-field"><label for="addrDoorInput">공동현관번호 <em>(선택)</em></label>' +
                    '<input id="addrDoorInput" type="text" maxlength="20" placeholder="예: #1234"></div>' +
                '<p class="addr-error" id="addrError" role="alert"></p>' +
                '<div class="addr-actions">' +
                    '<button type="button" class="addr-btn addr-btn--ghost" data-close>취소</button>' +
                    '<button type="submit" class="addr-btn addr-btn--main">저장</button>' +
                '</div>' +
            '</form>';
        document.body.appendChild(modal);

        var form = modal.querySelector('form');
        var fName = document.getElementById('addrName');
        var fPhone = document.getElementById('addrPhone');
        var fAddr = document.getElementById('addrAddress');
        var fDetail = document.getElementById('addrDetail');
        var fDoor = document.getElementById('addrDoorInput');
        var errEl = document.getElementById('addrError');
        var lastFocus = null;

        function fill() {
            var a = read() || {};
            fName.value = a.name || '';
            fPhone.value = a.phone || '';
            fAddr.value = a.address || '';
            fDetail.value = a.detail || '';
            fDoor.value = a.door || '';
            errEl.textContent = '';
        }

        function open() {
            lastFocus = document.activeElement;
            fill();
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            fName.focus();
        }

        function close() {
            modal.hidden = true;
            document.body.style.overflow = '';
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        /* 전화번호 자동 하이픈 */
        function formatPhone(v) {
            var d = v.replace(/\D/g, '').slice(0, 11);
            if (d.length < 4) return d;
            if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
            if (d.length < 11) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
            return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
        }
        fPhone.addEventListener('input', function () {
            fPhone.value = formatPhone(fPhone.value);
        });

        /* 저장 */
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = fName.value.trim();
            var phone = fPhone.value.trim();
            var address = fAddr.value.trim();

            var msg = '';
            var target = null;
            if (!name) { msg = '받는 분 이름을 입력해주세요.'; target = fName; }
            else if (phone.replace(/\D/g, '').length < 10) { msg = '연락처를 정확히 입력해주세요.'; target = fPhone; }
            else if (!address) { msg = '주소를 입력해주세요.'; target = fAddr; }

            if (msg) {
                errEl.textContent = msg;
                target.focus();
                return;
            }

            var data = {
                name: name,
                phone: phone,
                address: address,
                detail: fDetail.value.trim(),
                door: fDoor.value.trim()
            };
            write(data);
            apply(data);
            close();
        });

        /* 닫기: 배경 / 취소 버튼 / ESC */
        modal.addEventListener('click', function (e) {
            if (e.target.closest('[data-close]')) close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !modal.hidden) close();
        });

        /* "배송지 변경 >" : payment.js에 있는 기존 동작보다 먼저 가로채서 모달을 연다 */
        document.addEventListener('click', function (e) {
            if (!e.target.closest('#addressChange')) return;
            e.preventDefault();
            e.stopPropagation();
            open();
        }, true);

        /* 첫 화면: 저장된 배송지가 있으면 복원 */
        apply(read());
    })();