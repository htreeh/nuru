    // =====================================================
    // search-modal.js : 상단(GNB) 검색창을 누르면 뜨는 "PRODUCT SEARCH" 모달
    //  - 헤더의 "검색어를 입력해주세요." 칸을 누르거나 포커스하면 모달이 열림
    //  - 추천 검색어를 누르면 바로 검색, SEARCH 버튼 / Enter 로 검색
    //  - 검색 결과는 모달 안에 표시 (아래 PRODUCTS 목록에서 찾음)
    //  - 스타일도 이 파일 안에 들어 있어서 CSS 파일을 따로 만들 필요 없음
    //  - 사용법: 검색창이 있는 모든 페이지 맨 아래에 추가
    //            <script src="jquery/search-modal.js"></script>
    // =====================================================
    (function () {
        'use strict';

        if (window.__nuruSearchModal) return;
        window.__nuruSearchModal = true;

        /* ---------- 검색 대상 상품 ----------
        pdp03 ~ pdp18 을 만들 때마다 아래에 한 줄씩 추가하세요.
        keywords : 이름에 없어도 검색되게 할 단어 (카테고리, 색상, 핏 등) */
        var PRODUCTS = [
            {
                name: '심볼 패치 크롭 반팔 티셔츠', brand: 'UNIQUEMENT', price: '56,000원',
                img: './img/pdp01/c-sum01.jpg', link: 'pdp01.html',
                keywords: '티셔츠 반팔 크롭 TOP 핑크 화이트'
            },
            {
                name: '빈티지 워싱 코튼 오버핏 자켓', brand: 'LEMOIR', price: '39,000원',
                img: './img/pdp02/c-sum01.jpg', link: 'pdp02.html',
                keywords: '자켓 오버핏 워싱 코튼 빈티지 TOP OUTER 데님 베이지'
            }
        ];

        var RECOMMENDED = ['자켓', '데님', '니트', '오버핏'];

        // 헤더 검색창으로 인식할 요소
        var TRIGGER = '.header-tools input[type="search"], .header-search-input, header input[type="search"]';

        /* ---------- 스타일 ---------- */
        var style = document.createElement('style');
        style.id = 'smStyle';
        style.textContent =
            '.sm-modal{position:fixed;inset:0;z-index:1200;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto;font-family:"Noto Sans KR",sans-serif}' +
            '.sm-modal[hidden]{display:none}' +
            '.sm-dim{position:fixed;inset:0;background:rgba(0,0,0,.6)}' +
            '.sm-card{position:relative;width:min(100%,720px);margin:12vh 0 40px;padding:44px 24px 48px;border:1px solid #3a3f42;border-radius:8px;background:#272b2e;color:#d9d9d9;box-shadow:0 10px 30px rgba(0,0,0,.5)}' +
            '.sm-inner{width:min(100%,420px);margin:0 auto}' +
            '.sm-card h2{margin:0 0 28px;font-size:15px;font-weight:400;color:#e4e5e5;letter-spacing:.02em}' +
            '.sm-card label,.sm-sub{display:block;margin:0 0 10px 2px;font-size:12px;font-weight:400;color:#d0d3d4}' +
            '.sm-card input[type="text"]{display:block;width:100%;height:34px;padding:0 12px;border:1px solid #3a3f42;border-radius:2px;background:#25292c;color:#e4e5e5;font:inherit;font-size:12px}' +
            '.sm-card input[type="text"]::placeholder{color:#6f7476}' +
            '.sm-card input[type="text"]:focus{outline:none;border-color:#8FC0E8}' +
            '.sm-msg{min-height:16px;margin:6px 2px 0;font-size:11px;color:#ec6769}' +
            '.sm-sub{margin-top:6px}' +
            '.sm-chips{display:flex;flex-wrap:wrap;gap:4px;margin:0}' +
            '.sm-chip{height:26px;padding:0 13px;border:1px solid #6a6f72;border-radius:13px;background:transparent;color:#aeb3b4;font:inherit;font-size:11px;cursor:pointer;transition:border-color .15s,color .15s}' +
            '.sm-chip:hover{border-color:#8FC0E8;color:#8FC0E8}' +
            '.sm-submit{display:block;width:100%;height:33px;margin-top:32px;border:0;border-radius:2px;background:#1a1b1f;color:#e4e5e5;font:inherit;font-size:12px;letter-spacing:.03em;cursor:pointer}' +
            '.sm-submit:hover{background:#000}' +
            '.sm-x{position:absolute;top:10px;right:12px;width:28px;height:28px;border:0;background:transparent;color:#8f9496;font-size:20px;line-height:1;cursor:pointer}' +
            '.sm-x:hover{color:#fff}' +
            '.sm-results{margin-top:26px}' +
            '.sm-results:empty{display:none}' +
            '.sm-count{margin:0 0 10px 2px;font-size:11px;color:#8f9496}' +
            '.sm-list{margin:0;padding:0;list-style:none;max-height:300px;overflow-y:auto}' +
            '.sm-item+.sm-item{border-top:1px solid #34393c}' +
            '.sm-item a{display:flex;align-items:center;gap:14px;padding:10px 2px;color:inherit;text-decoration:none}' +
            '.sm-item a:hover .sm-name{color:#8FC0E8}' +
            '.sm-thumb{flex:none;width:46px;height:58px;object-fit:cover;background:#dedede}' +
            '.sm-info{display:grid;gap:3px;min-width:0;font-size:11px}' +
            '.sm-brand{color:#aeb3b4}' +
            '.sm-name{color:#e4e5e5;font-size:12px}' +
            '.sm-price{color:#f0f0f0}' +
            '.sm-empty{margin:0;padding:18px 0 4px;text-align:center;font-size:12px;color:#8f9496}' +
            '@media (max-width:560px){.sm-card{margin-top:8vh;padding:40px 18px 36px}}';
        document.head.appendChild(style);

        /* ---------- 모달 만들기 ---------- */
        var modal = document.createElement('div');
        modal.className = 'sm-modal';
        modal.id = 'searchModal';
        modal.hidden = true;
        modal.innerHTML =
            '<div class="sm-dim" data-sm-close></div>' +
            '<form class="sm-card" role="dialog" aria-modal="true" aria-labelledby="smTitle" novalidate>' +
                '<button type="button" class="sm-x" data-sm-close aria-label="닫기">&times;</button>' +
                '<div class="sm-inner">' +
                    '<h2 id="smTitle">PRODUCT SEARCH</h2>' +
                    '<label for="smInput">검색어</label>' +
                    '<input id="smInput" type="text" placeholder="검색어를 입력해주세요." autocomplete="off">' +
                    '<p class="sm-msg" id="smMsg" role="alert"></p>' +
                    '<p class="sm-sub">추천 검색어</p>' +
                    '<div class="sm-chips" id="smChips"></div>' +
                    '<button type="submit" class="sm-submit">SEARCH</button>' +
                    '<div class="sm-results" id="smResults" aria-live="polite"></div>' +
                '</div>' +
            '</form>';
        document.body.appendChild(modal);

        var form = modal.querySelector('form');
        var input = document.getElementById('smInput');
        var msg = document.getElementById('smMsg');
        var chips = document.getElementById('smChips');
        var results = document.getElementById('smResults');

        RECOMMENDED.forEach(function (word) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'sm-chip';
            chip.textContent = word;
            chip.addEventListener('click', function () {
                input.value = word;
                run(word);
            });
            chips.appendChild(chip);
        });

        /* ---------- 검색 ---------- */
        function find(query) {
            var tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
            return PRODUCTS.filter(function (p) {
                var hay = (p.name + ' ' + p.brand + ' ' + (p.keywords || '')).toLowerCase();
                return tokens.every(function (t) { return hay.indexOf(t) > -1; });
            });
        }

        function el(tag, className, text) {
            var node = document.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined) node.textContent = text;
            return node;
        }

        function run(query) {
            query = query.trim();
            msg.textContent = '';
            results.textContent = '';

            if (!query) {
                msg.textContent = '검색어를 입력해주세요.';
                input.focus();
                return;
            }

            var found = find(query);
            if (!found.length) {
                results.appendChild(el('p', 'sm-empty', '"' + query + '"에 대한 검색 결과가 없습니다.'));
                return;
            }

            results.appendChild(el('p', 'sm-count', '"' + query + '" 검색 결과 ' + found.length + '개'));
            var list = el('ul', 'sm-list');
            found.forEach(function (p) {
                var li = el('li', 'sm-item');
                var a = el('a');
                a.href = p.link;

                var img = el('img', 'sm-thumb');
                img.src = p.img;
                img.alt = p.name;

                var info = el('div', 'sm-info');
                info.appendChild(el('span', 'sm-brand', p.brand));
                info.appendChild(el('span', 'sm-name', p.name));
                info.appendChild(el('span', 'sm-price', p.price));

                a.append(img, info);
                li.appendChild(a);
                list.appendChild(li);
            });
            results.appendChild(list);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            run(input.value);
        });

        /* ---------- 열기 / 닫기 ---------- */
        function open() {
            if (!modal.hidden) return;
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            input.value = '';
            msg.textContent = '';
            results.textContent = '';
            input.focus();
        }

        function close() {
            modal.hidden = true;
            document.body.style.overflow = '';
        }

        modal.addEventListener('click', function (e) {
            if (e.target.closest('[data-sm-close]')) close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !modal.hidden) close();
        });

        // 헤더 검색창을 누르거나 포커스하면 모달을 연다
        function onTrigger(e) {
            var target = e.target;
            if (!target || !target.matches || !target.matches(TRIGGER)) return;
            if (target.closest('.sm-modal')) return;
            e.preventDefault();
            target.blur();
            open();
        }
        document.addEventListener('mousedown', onTrigger, true);
        document.addEventListener('focusin', onTrigger, true);
    })();