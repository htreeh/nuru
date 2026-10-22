  // 스크립트 위치나 로딩 시점과 상관없이 동작>document
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.benefit__toggle');
    if (!btn) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
  });

  // 아코디언 열기/닫기
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.acc__toggle');
    if (!btn) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
  });

  // 선택한 값을 헤더 표시
  document.addEventListener('change', (e) => {
    if (!e.target.matches('.acc input[type="checkbox"]')) return;
    const acc = e.target.closest('.acc');
    const values = [...acc.querySelectorAll('input:checked')].map(i => i.value);
    acc.querySelector('.acc__selected').textContent = values.join(', ');
  });


  (function () {
    const area = document.getElementById('option-area');
    const PRICE = Number(document.querySelector('.sale-price02').textContent.replace(/[^0-9]/g, ''));
    const NAME = document.querySelector('.product-name').textContent.trim();
    const list = document.getElementById('sel-list');
    const msg = document.getElementById('opt-msg');
    let msgTimer;

    const won = n => n.toLocaleString('ko-KR') + '원';

    function showMsg(text) {
      msg.textContent = text;
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => (msg.textContent = ''), 2500);
    }

    function updateTotal() {
      const count = list.children.length;
      document.getElementById('total-count').textContent = count;
      document.getElementById('total-price').textContent = won(count * PRICE);
    }

    function resetSelection() {
      area.querySelectorAll('input[type="radio"]').forEach(r => (r.checked = false));
      area.querySelectorAll('.acc').forEach(acc => {
        const label = acc.querySelector('.acc__label');
        label.textContent = label.dataset.default;
        label.removeAttribute('data-selected');
        acc.querySelector('.acc__toggle').setAttribute('aria-expanded', 'false');
      });
    }

    function addItem(color, size) {
      const key = color + '/' + size;
      if ([...list.children].some(li => li.dataset.key === key)) {
        showMsg('이미 선택된 옵션입니다.');
        return;
      }
      const li = document.createElement('li');
      li.className = 'sel-item';
      li.dataset.key = key;
      li.innerHTML =
        '<div><span class="sel-item__name"></span><span class="sel-item__opt"></span></div>' +
        '<div class="sel-item__right"><span class="sel-item__price"></span>' +
        '<button type="button" class="sel-item__remove" aria-label="삭제">×</button></div>';
      li.querySelector('.sel-item__name').textContent = NAME;
      li.querySelector('.sel-item__opt').textContent = key;
      li.querySelector('.sel-item__price').textContent = won(PRICE);
      list.appendChild(li);
      msg.textContent = '';
    }

    // 옵션 선택
    area.addEventListener('change', (e) => {
      if (!e.target.matches('input[type="radio"]')) return;

      const acc = e.target.closest('.acc');
      const label = acc.querySelector('.acc__label');
      label.textContent = e.target.value;
      label.dataset.selected = 'true';
      acc.querySelector('.acc__toggle').setAttribute('aria-expanded', 'false'); // 고르면 닫기

      const color = area.querySelector('input[name="color"]:checked');
      const size = area.querySelector('input[name="size"]:checked');
      if (color && size) {
        addItem(color.value, size.value);
        resetSelection();      // 초기화
        updateTotal();
      }
    });

    // 삭제
    list.addEventListener('click', (e) => {
      const rm = e.target.closest('.sel-item__remove');
      if (!rm) return;
      rm.closest('.sel-item').remove();
      updateTotal();
    });

    document.querySelectorAll('.btn-cart, .btn-buy').forEach(button => {
      button.addEventListener('click', (e) => {
        if (list.children.length > 0) return;
        e.preventDefault();
        showMsg('컬러와 사이즈를 선택해주세요.');
      });
    });

    updateTotal();
  })();


  (function () {
    var panel = document.getElementById('panel-qna');
    var body = panel.querySelector('.qna-body');
    var nav = panel.querySelector('.pagination');

    var PER_PAGE = 12;   // 한 페이지에 보여줄 행
    var GROUP_SIZE = 4;  // 한 번에 보여줄 페이지 번호

    var categories = ['배송', '사이즈', '교환', '환불', '상품', '기타'];
    var qnaData = [];
    for (var n = 96; n >= 1; n--) {
      qnaData.push({
        no: n,
        category: categories[Math.floor(Math.random() * categories.length)],
        content: '',
        author: '작성자',
        date: '2026.10.11',
        href: '/qna/' + n,
        secret: true
      });
    }

    var TOTAL_PAGES = Math.max(1, Math.ceil(qnaData.length / PER_PAGE)); // 데이터 96개 → 8페이지

    var page = 1;

    function getPageData(p) {
      var start = (p - 1) * PER_PAGE;
      return qnaData.slice(start, start + PER_PAGE);
    }

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function renderRows() {
      var data = getPageData(page);
      var html = '';
      for (var i = 0; i < PER_PAGE; i++) {
        var r = data[i];
        var text = r ? (r.secret ? '비밀글입니다.' : r.content) : '';
        html += '<div class="qna-row" role="row">' +
          '<span role="cell">' + (r ? esc(r.no) : '') + '</span>' +
          '<span role="cell">' + (r ? esc(r.category) : '') + '</span>' +
          '<span role="cell">' + (r ? '<a href="' + esc(r.href) + '"' + (r.secret ? ' data-secret="true"' : '') + '>' + esc(text) + '</a>' : '') + '</span>' +
          '<span class="qna-meta" role="cell">' + (r ? '<span class="author">' + esc(r.author) + '</span><span>' + esc(r.date) + '</span>' : '') + '</span>' +
          '</div>';
      }
      body.innerHTML = html;
    }

    function renderNav() {
      var group = Math.floor((page - 1) / GROUP_SIZE);
      var start = group * GROUP_SIZE + 1;
      var end = Math.min(start + GROUP_SIZE - 1, TOTAL_PAGES);
      var lastGroup = Math.floor((TOTAL_PAGES - 1) / GROUP_SIZE);

      var html = '';
      html += '<button type="button" data-go="first" aria-label="이전 묶음" ' + (group === 0 ? 'disabled' : '') + '>&lt;&lt;</button>';
      html += '<button type="button" data-go="prev" aria-label="이전 페이지" ' + (page === 1 ? 'disabled' : '') + '>&lt;</button>';
      for (var n = start; n <= end; n++) {
        html += '<button type="button" data-page="' + n + '"' + (n === page ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }
      html += '<button type="button" data-go="next" aria-label="다음 페이지" ' + (page === TOTAL_PAGES ? 'disabled' : '') + '>&gt;</button>';
      html += '<button type="button" data-go="last" aria-label="다음 묶음" ' + (group === lastGroup ? 'disabled' : '') + '>&gt;&gt;</button>';
      nav.innerHTML = html;
    }

    function goTo(p) {
      page = Math.max(1, Math.min(TOTAL_PAGES, p));
      renderRows();
      renderNav();
    }

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || btn.disabled) return;

      if (btn.dataset.page) return goTo(parseInt(btn.dataset.page, 10));

      var group = Math.floor((page - 1) / GROUP_SIZE);
      switch (btn.dataset.go) {
        case 'prev':  goTo(page - 1); break;
        case 'next':  goTo(page + 1); break;
        case 'first': goTo((group - 1) * GROUP_SIZE + 1); break; // << : 이전 묶음 첫 페이지 (5~8 → 1)
        case 'last':  goTo((group + 1) * GROUP_SIZE + 1); break; // >> : 다음 묶음 첫 페이지 (1~4 → 5)
      }
    });

    /* 비밀글 팝업 */
    var modal = panel.querySelector('.qna-modal');
    var lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.querySelector('.qna-modal-close').focus();
    }
    function closeModal() {
      modal.hidden = true;
      if (lastFocus) lastFocus.focus();
    }

    body.addEventListener('click', function (e) {
      var link = e.target.closest('a[data-secret]');
      if (!link) return;
      e.preventDefault(); // 비밀글은 이동하지 않고 팝업만 띄움
      openModal();
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.qna-modal-close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
    goTo(1);
  })();


  (function () {
    var panel = document.getElementById('panel-review');
    var listEl = panel.querySelector('.rv-list');
    var nav = panel.querySelector('.pagination');
    var colorSel = panel.querySelector('.rv-color');
    var sizeSel = panel.querySelector('.rv-size');
    var photoOnly = panel.querySelector('.rv-photoonly-input');
    var sortBtns = panel.querySelectorAll('.rv-sort button');

    var PER_PAGE = 5;        // 한 페이지에 보여줄 리뷰
    var GROUP_SIZE = 4;      // 한 번에 보여줄 페이지 번호
    var REPEAT_PAGES = 3;    // 직접 쓴 리뷰 5개 반복 페이지
    var FILLER_COUNT = 0;    // 자동 리뷰 수 (0 = 직접 쓴 리뷰 표시 / 15로 바꾸면 2페이지 이후를 랜덤 리뷰)

    /* 상품 옵션 가져오기 */
    var colors = Array.prototype.map.call(
      document.querySelectorAll('#option-area input[name="color"]'),
      function (el) { return el.value; }
    );
    var sizes = Array.prototype.map.call(
      document.querySelectorAll('#option-area input[name="size"]'),
      function (el) { return el.value; }
    );

    var myReviews = [
      { rating: 5, color: '핑크', size: 'FREE', author: '이**님',
        text: '옷 너무 귀여워요ㅠㅠ 글씨 포인트도 힙하고 촉감도 부들부들해서 다른 컬러도 살까 고민 중입니다!',
        photos: ['./img/pdp01/rm-sum01.jpg', './img/pdp01/rm-sum02.jpg'] },
      { rating: 5, color: '화이트',   size: 'FREE', author: '김**님',
        text: '흰색이라 비칠까 봐 걱정했는데 생각보다 괜찮고 기장도 딱 예쁩니다 잘 입을게요!',
        photos: ['./img/pdp01/rm-sum03.jpg'] },
      { rating: 4, color: '핑크',   size: 'FREE', author: '박**님',
        text: '화면이랑 실물이랑 똑같아요! 사이즈도 여유롭고 편해서 요즘 이것만 입고 다니는 중 ㅎㅎ',
        photos: ['./img/pdp01/rm-sum04.jpg'] },
      { rating: 5, color: '핑크',   size: 'FREE', author: '신**님',
        text: '핑크색 완전 웜쿨 안 가리고 예쁜 핑크라 맘에 들어요 핏도 딱 원하던 거라 자주 입을듯!',
        photos: ['./img/pdp01/rm-sum05.jpg'] },
      { rating: 4, color: '화이트',   size: 'FREE', author: '안**님',
        text: '배송 빨라서 좋고 옷 재질도 탄탄하니 가격 대비 만족합니다 청바지에 입기 딱이에요~',
        photos: ['./img/pdp01/rm-sum06.jpg', './img/pdp01/rm-sum07.jpg'] }
    ];
    // 상세리뷰 5가지 자체수정_아래 쿼리로 다른 옵션이 들어가도 보정됨


    // 상세페이지 옵션에 없는 컬러/사이즈는 실제 옵션으로 자동 보정
    myReviews.forEach(function (r, idx) {
      if (colors.indexOf(r.color) === -1) r.color = colors[idx % colors.length];
      if (sizes.indexOf(r.size) === -1) r.size = sizes[idx % sizes.length];
    });


    // 2페이지 이후를 채우는 자동 리뷰용 문구
    var fillerTexts = [
      '배송도 빠르고 사이즈도 딱 맞아요. 색감이 사진과 거의 같습니다.',
      '후회가 1도 없는 선택이었습니다 재질도 탄탄하고 허리를 잘 잡아줘요',
      '여러 번 입어도 늘어나지 않고 핏이 예뻐요.',
      '어깨선이 자연스럽게 떨어져서 단독으로 입어도 예쁩니다.',
      '생각보다 얇지 않아서 간절기에 입기 좋아요.'
    ];
    var photoPool = [
      './img/review01.jpg',
      './img/review02.jpg',
      './img/review03.jpg',
      './img/review04.jpg',
      './img/review05.jpg'
    ];

    var reviews = [];

    // 직접 쓴 5개, 맨 위에 고정
    myReviews.forEach(function (r, idx) {
      reviews.push({
        id: 1000 - idx,
        rating: r.rating,
        color: r.color,
        size: r.size,
        text: r.text,
        author: r.author,
        photos: r.photos,
        likes: 1000 - idx,
        rand: 0
      });
    });

    // 자동 리뷰
    for (var i = 1; i <= FILLER_COUNT; i++) {
      var n = i % 4 === 0 ? 0 : (i % 3) + 1;   // 사진 개수
      var pics = [];
      for (var k = 0; k < n; k++) pics.push(photoPool[(i + k) % photoPool.length]);

      reviews.push({
        id: i,
        rating: 3 + (i % 3),
        color: colors[i % colors.length],
        size: sizes[i % sizes.length],
        text: fillerTexts[i % fillerTexts.length],
        author: 'user' + (100 + i),
        photos: pics,
        likes: (i * 37) % 41,
        rand: Math.random()    // 2페이지 이후 섞기용 (페이지 열 때 한 번만 정해짐)
      });
    }

    var state = { sort: 'popular', color: '', size: '', photoOnly: false, page: 1 };

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }


    function getFiltered() {
      var list = reviews.filter(function (r) {
        if (state.color && r.color !== state.color) return false;
        if (state.size && r.size !== state.size) return false;
        if (state.photoOnly && r.photos.length === 0) return false;
        return true;
      });
      list.sort(function (a, b) {
        return state.sort === 'popular' ? b.likes - a.likes : b.id - a.id;
      });
      var head = list.slice(0, PER_PAGE);
      var tail = list.slice(PER_PAGE).sort(function (a, b) { return a.rand - b.rand; });
      list = head.concat(tail);

      // 필터(컬러/사이즈/포토)를 쓰지 않을 때만 같은 리뷰를 REPEAT_PAGES번 반복해서 보여줌
      // 필터를 쓰면 중복 없이 해당 리뷰만 한번만
      var filtering = state.color || state.size || state.photoOnly;
      if (!filtering && REPEAT_PAGES > 1) {
        var base = list.slice();
        for (var t = 1; t < REPEAT_PAGES; t++) list = list.concat(base);
      }
      return list;
    }

    function totalPages(len) { return Math.max(1, Math.ceil(len / PER_PAGE)); }

    // 배열섞기
    function shuffle(arr) {
      var a = arr.slice();
      if (a.length < 2) return a;
      var same = true;
      for (var tries = 0; same && tries < 5; tries++) {
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        same = a.every(function (item, idx) { return item === arr[idx]; });
      }
      return a;
    }

    function starsHtml(n) {
      var h = '';
      for (var i = 1; i <= 5; i++) h += '<span class="' + (i <= n ? 'on' : '') + '">★</span>';
      return h;
    }

    function renderRows(list) {
      var start = (state.page - 1) * PER_PAGE;
      var rows = list.slice(start, start + PER_PAGE);
      if (!rows.length) { listEl.innerHTML = '<li class="rv-empty">등록된 리뷰가 없습니다.</li>'; return; }

      // 2페이지 이후(필터 미사용 시)는 카드 순서 섞음
      var filtering = state.color || state.size || state.photoOnly;
      var shuffled = state.page > 1 && !filtering;
      if (shuffled) rows = shuffle(rows);

      listEl.innerHTML = rows.map(function (r, idx) {
        var thumbs = '';
        for (var i = 0; i < r.photos.length; i++) {
          thumbs += '<img class="rv-thumb" src="' + esc(r.photos[i]) + '" alt="리뷰 사진">';
        }
        return '<li class="rv-card' + (shuffled ? ' is-shuffle' : '') + '"' +
          (shuffled ? ' style="animation-delay:' + (idx * 80) + 'ms"' : '') + '>' +
          '<div class="rv-meta">' +
            '<span class="rv-stars" aria-label="별점 ' + r.rating + '점">' + starsHtml(r.rating) + '</span>' +
            '<span>상품옵션</span><strong>' + esc(r.color) + '(' + esc(r.size) + ')</strong>' +
          '</div>' +
          '<p class="rv-text">' + esc(r.text) + '</p>' +
          '<p class="rv-author">' + esc(r.author) + '의 리뷰입니다.</p>' +
          (r.photos.length ? '<div class="rv-thumbs">' + thumbs + '</div>' : '') +
        '</li>';
      }).join('');
    }

    function renderNav(total) {
      nav.style.display = total <= 1 ? 'none' : '';   // 1페이지면 페이지 번호 숨김
      var group = Math.floor((state.page - 1) / GROUP_SIZE);
      var start = group * GROUP_SIZE + 1;
      var end = Math.min(start + GROUP_SIZE - 1, total);
      var lastGroup = Math.floor((total - 1) / GROUP_SIZE);

      var html = '';
      html += '<button type="button" data-go="first" aria-label="이전 묶음" ' + (group === 0 ? 'disabled' : '') + '>&lt;&lt;</button>';
      html += '<button type="button" data-go="prev" aria-label="이전 페이지" ' + (state.page === 1 ? 'disabled' : '') + '>&lt;</button>';
      for (var n = start; n <= end; n++) {
        html += '<button type="button" data-page="' + n + '"' + (n === state.page ? ' aria-current="page"' : '') + '>' + n + '</button>';
      }
      html += '<button type="button" data-go="next" aria-label="다음 페이지" ' + (state.page === total ? 'disabled' : '') + '>&gt;</button>';
      html += '<button type="button" data-go="last" aria-label="다음 묶음" ' + (group === lastGroup ? 'disabled' : '') + '>&gt;&gt;</button>';
      nav.innerHTML = html;
    }

    function render() {
      var list = getFiltered();
      var total = totalPages(list.length);
      state.page = Math.max(1, Math.min(total, state.page));
      renderRows(list);
      renderNav(total);
    }

    function goTo(p) { state.page = p; render(); }

    /* 페이지 이동 */
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      if (btn.dataset.page) return goTo(parseInt(btn.dataset.page, 10));

      var group = Math.floor((state.page - 1) / GROUP_SIZE);
      switch (btn.dataset.go) {
        case 'prev':  goTo(state.page - 1); break;
        case 'next':  goTo(state.page + 1); break;
        case 'first': goTo((group - 1) * GROUP_SIZE + 1); break; // << : 이전 묶음
        case 'last':  goTo((group + 1) * GROUP_SIZE + 1); break; // >> : 다음 묶음
      }
    });

    // 정렬
    Array.prototype.forEach.call(sortBtns, function (b) {
      b.addEventListener('click', function () {
        state.sort = b.dataset.sort;
        Array.prototype.forEach.call(sortBtns, function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        goTo(1);
      });
    });

    // 포토리뷰만 보기
    function fillSelect(sel, label, items) {
      sel.innerHTML = '<option value="">' + label + '</option>' +
        items.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
    }
    fillSelect(colorSel, 'COLOR', colors);
    fillSelect(sizeSel, 'SIZE', sizes);

    colorSel.addEventListener('change', function () { state.color = colorSel.value; goTo(1); });
    sizeSel.addEventListener('change', function () { state.size = sizeSel.value; goTo(1); });
    photoOnly.addEventListener('change', function () { state.photoOnly = photoOnly.checked; goTo(1); });

    render();
  })();


  (function () {
    var mainImg = document.querySelector('.main-image img');
    var thumbs = document.querySelectorAll('.thumbnail-list img');

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        mainImg.src = thumb.dataset.large || thumb.src;
        mainImg.alt = thumb.alt;

        thumbs.forEach(function (t) { t.classList.remove('active'); });
        thumb.classList.add('active');
      });
    });
  })();

  
  (function () {
    const ZOOM = 2;   // 배율
    const box = document.querySelector('.main-image');
    const img = box.querySelector('img');
    const gallery = document.querySelector('.product-gallery');

    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    lens.style.width = lens.style.height = (100 / ZOOM) + '%';
    box.appendChild(lens);

    const panel = document.createElement('div');
    panel.className = 'zoom-panel';
    gallery.appendChild(panel);

    box.addEventListener('mouseenter', function () {
      panel.style.width = box.offsetWidth + 'px';
      panel.style.height = box.offsetHeight + 'px';
      panel.style.backgroundImage = 'url("' + img.src + '")';
      panel.style.backgroundSize = (ZOOM * 100) + '% ' + (ZOOM * 100) + '%';
      lens.style.display = panel.style.display = 'block';
    });

    box.addEventListener('mouseleave', function () {
      lens.style.display = panel.style.display = 'none';
    });

    box.addEventListener('mousemove', function (e) {
      const r = box.getBoundingClientRect();
      const size = 1 / ZOOM;
      const clamp = function (v) { return Math.max(0, Math.min(1 - size, v)); };

      const left = clamp((e.clientX - r.left) / r.width - size / 2);
      const top = clamp((e.clientY - r.top) / r.height - size / 2);

      lens.style.left = (left * 100) + '%';
      lens.style.top = (top * 100) + '%';

      const k = ZOOM / (ZOOM - 1) * 100;
      panel.style.backgroundPosition = (left * k) + '% ' + (top * k) + '%';
    });
  })();