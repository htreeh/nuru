// =====================================================
// like.js : 찜(하트) 기능 - 메인/상세/찜 페이지 어디서나 같이 사용
//
// 저장 위치 : localStorage ('nuru_wishlist') - 이 브라우저 안에서만 유지됨
// 하트 버튼 : class="like-btn" 이 달린 버튼 (안은 비워두면 하트 SVG가 자동으로 들어감)
// 상품 정보 : 하트 버튼을 포함한 요소에 data-id / data-brand / data-name /
//            data-old / data-price / data-img / data-link / data-colors 를 적어둠
//            (data-id 는 상품마다 겹치지 않아야 합니다!)
// 찜 목록   : <ul id="wishlist-grid"> 가 있는 페이지에서는 저장된 상품을 자동으로 그려줌
// =====================================================
(function () {
    'use strict';

    var KEY = 'nuru_wishlist';

    // 빈 하트 버튼 안에 넣는 SVG (외곽선은 CSS 에서 stroke, 채움은 aria-pressed="true" 일 때 fill)
    var HEART =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5' +
        'c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/>' +
        '</svg>';

    /* ---------- 저장소 ---------- */
    function read() {
        try {
            var v = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(v) ? v : [];
        } catch (e) {
            console.error('찜 목록을 불러오지 못했습니다.', e);
            return [];
        }
    }
    function write(list) {
        try {
            localStorage.setItem(KEY, JSON.stringify(list));
        } catch (e) {
            console.error('찜 목록을 저장하지 못했습니다.', e);
        }
    }
    function indexOf(list, productId) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === productId) return i;
        }
        return -1;
    }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* ---------- 카드 → 상품 정보 ---------- */
    function readCard(card) {
        var d = card.dataset;
        return {
            id: d.id,
            brand: d.brand || '',
            name: d.name || '',
            oldPrice: d.old || '',
            price: d.price || '',
            img: d.img || '',
            link: d.link || '#',
            colors: (d.colors || '').split(',').filter(Boolean)
        };
    }

    /* 찜 추가/해제 (추가되면 true, 해제되면 false) */
    function toggle(item) {
        var list = read();
        var i = indexOf(list, item.id);
        if (i > -1) {
            list.splice(i, 1);
        } else {
            list.unshift(item);            // 최근에 찜한 상품이 맨 앞
        }
        write(list);
        return i === -1;
    }

    /* ---------- 화면 반영 ---------- */
    function ensureIcons() {
        document.querySelectorAll('.like-btn').forEach(function (btn) {
            if (!btn.querySelector('svg')) btn.innerHTML = HEART;
        });
    }

    function paint() {
        var wishlist = read();
        var productIds = wishlist.map(function (p) { return p.id; });

        document.querySelectorAll('.like-btn').forEach(function (btn) {
            var card = btn.closest('[data-id]');
            if (!card) return;
            var on = productIds.indexOf(card.dataset.id) > -1;

            btn.setAttribute('aria-pressed', String(on));
            btn.setAttribute('aria-label', on ? '찜 해제' : '찜하기');
        });

        document.querySelectorAll('[data-like-count]').forEach(function (el) {
            el.textContent = wishlist.length;
        });
    }

    function cardHtml(p) {
        var colors = (p.colors || []).map(function (c) {
            return '<span style="background-color:' + esc(c) + '"></span>';
        }).join('');
        return '<li class="card" data-id="' + esc(p.id) + '">' +
            '<div class="card-photo">' +
                '<a href="' + esc(p.link) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '"></a>' +
                '<button type="button" class="like-btn"></button>' +
            '</div>' +
            '<span class="card-brand">' + esc(p.brand) + '</span>' +
            '<div class="card-colors">' + colors + '</div>' +
            '<span class="card-name">' + esc(p.name) + '</span>' +
                (p.oldPrice ? '<span class="s-before">' + esc(p.oldPrice) + '</span> ' : '') +
            '<span class="s-after">' + esc(p.price) + '</span>' +
            '</li>';
    }

    function renderWishlist() {
        var grid = document.getElementById('wishlist-grid');
        if (!grid) return;
        var list = read();
        var empty = document.getElementById('wishlist-empty');

        grid.innerHTML = list.map(cardHtml).join('');
        if (empty) empty.hidden = list.length > 0;
    }

    function refresh() {
        renderWishlist();   // 찜 페이지면 목록을 먼저 그리고
        ensureIcons();      // 하트 SVG 를 채운 뒤
        paint();            // 찜한 상품의 하트를 채움
    }

    /* ---------- 토스트 ---------- */
    var toastTimer;

    function showToast(html) {
        var toast = document.getElementById('wishlist-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'wishlist-toast';
            toast.className = 'wishlist-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.innerHTML = html;
        // 연속 클릭해도 애니메이션이 다시 시작되도록
        toast.classList.remove('is-show');
        void toast.offsetWidth;
        toast.classList.add('is-show');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('is-show');
        }, 3000);
    }

    function showAddedToast() {
        showToast('<span>찜한 상품에 추가되었습니다.</span><a href="like.html">찜 목록 보기 &gt;</a>');
    }

    function showRemovedToast() {
        showToast('<span>찜한 상품이 삭제되었습니다.</span>');
    }

    /* ---------- 이벤트 (document 에서 딱 한 번만 처리) ---------- */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.like-btn');
        if (!btn) {
            if (e.target.closest('#like-reset')) { write([]); refresh(); }
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var card = btn.closest('[data-id]');
        if (!card) return;

        var added = toggle(readCard(card));
        refresh();
        if (added) {
            showAddedToast();
        } else {
            showRemovedToast();
        }
    });

    // 다른 탭/창에서 찜이 바뀌어도 반영
    window.addEventListener('storage', function (e) {
        if (e.key === KEY) refresh();
    });

    // 동적으로 생성된 상품 카드도 첫 화면에 찜 상태를 반영할 수 있게 공개
    window.NuruLike = { refresh: refresh, read: read };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', refresh);
    } else {
        refresh();
    }
})();