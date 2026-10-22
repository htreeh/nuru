$(function(){
    // Top banner text rotation
    let bannerTexts = $('.banner-text');
    let currentBannerIndex = 0;

    function rotateBanner() {
        bannerTexts.removeClass('active');
        bannerTexts.eq(currentBannerIndex).addClass('active');
        currentBannerIndex = (currentBannerIndex + 1) % bannerTexts.length;
    }

    if (bannerTexts.length > 0) {
        rotateBanner();
        setInterval(rotateBanner, 3000);
    }

    // Header scroll effect
    // 메인 배너(#slider)가 끝나는 지점부터 헤더(GNB 바)가 위에서 내려와 고정됩니다.
    // 배너 구간에서는 헤더가 숨겨져 있고, 호버할 때만 천천히 나타납니다 (CSS).
    let header = $('#header');
    let topBanner = $('#top-banner');
    let topBannerHeight = topBanner.length > 0 ? topBanner.outerHeight() : 0;
    let slider = $('#slider');
    let subM = $('#sub-m');

    function updateHeaderOnScroll() {
        let scrollTop = $(window).scrollTop();

        // 배너가 있으면 배너 하단, 없으면 상단 띠배너 높이를 기준으로 함
        let sliderBottom = slider.length > 0
            ? slider.offset().top + slider.outerHeight()
            : topBannerHeight;

        if (scrollTop >= sliderBottom) {
            header.addClass('fixed');
        } else {
            header.removeClass('fixed');
        }

        // Sub-m fade effect based on slider visibility
        if (slider.length > 0 && subM.length > 0) {
            if (scrollTop < sliderBottom - 200) {
                subM.css('opacity', '0');
            } else {
                subM.css('opacity', '1');
            }
        }
    }

    $(window).on('scroll resize', updateHeaderOnScroll);
    updateHeaderOnScroll();

    let mainSlider = document.getElementById('slider')
    if (mainSlider) {
        let track = mainSlider.querySelector('.slider-track')
        let slides = Array.from(mainSlider.querySelectorAll('.slider-slide'))
        let dots = Array.from(mainSlider.querySelectorAll('.slider-dot'))
        let currentSlide = 0
        let autoplayTimer
        let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        function showSlide(index) {
            currentSlide = (index + slides.length) % slides.length
            track.style.transform = 'translateX(-' + currentSlide * 100 + '%)'

            slides.forEach(function(slide, slideIndex){
                let isActive = slideIndex === currentSlide
                slide.classList.toggle('is-active', isActive)
                slide.setAttribute('aria-hidden', String(!isActive))
            })

            dots.forEach(function(dot, dotIndex){
                let isActive = dotIndex === currentSlide
                dot.classList.toggle('is-active', isActive)
                dot.setAttribute('aria-pressed', String(isActive))
            })
        }

        function stopAutoplay() {
            window.clearInterval(autoplayTimer)
        }

        function startAutoplay() {
            stopAutoplay()
            if (!reduceMotion) {
                autoplayTimer = window.setInterval(function(){
                    showSlide(currentSlide + 1)
                }, 5000)
            }
        }

        mainSlider.querySelector('.slider-prev').addEventListener('click', function(){
            showSlide(currentSlide - 1)
            startAutoplay()
        })
        mainSlider.querySelector('.slider-next').addEventListener('click', function(){
            showSlide(currentSlide + 1)
            startAutoplay()
        })
        dots.forEach(function(dot, index){
            dot.addEventListener('click', function(){
                showSlide(index)
                startAutoplay()
            })
        })

        mainSlider.addEventListener('mouseenter', stopAutoplay)
        mainSlider.addEventListener('mouseleave', startAutoplay)
        mainSlider.addEventListener('focusin', stopAutoplay)
        mainSlider.addEventListener('focusout', function(event){
            if (!mainSlider.contains(event.relatedTarget)) {
                startAutoplay()
            }
        })
        startAutoplay()
    }

    let tabbtn = $('.title-curated > h2 > button')
    let tabcon = $('.curated-contents > div')
    tabcon.hide().eq(0).show()

    // ★ 찜 연동용 id 정리
    //   sum01~04 이미지는 이미지 파일명 기준으로 고유 id 를 줍니다.
    //   (HTML 에서 서로 다른 상품이 같은 data-id 를 쓰면 하트가 같이 눌립니다)
    //   pdp01 / pdp02 상품은 HTML 에 적어둔 id(shirt-crop, vintage-jacket)를 그대로 씁니다.
    document.querySelectorAll('.curated-contents li[data-img]').forEach(function(item) {
        let match = (item.dataset.img || '').match(/\/sum(\d+)\.jpg$/)
        if (match) item.dataset.id = 'sum' + match[1]
    })

    tabcon.each(function(){
        let list = $(this).find('ul').first()
        let originalCount = list.children('li').length
        let cards = list.children('li').clone()

        if (!cards.length) {
            return
        }

        // 캐러셀을 채우는 복제 카드: id 를 따로 줘야 하트가 같이 눌리지 않습니다.
        for (let i = originalCount; i < 7; i++) {
            let copy = cards.eq((i - originalCount) % cards.length).clone()
            copy.attr('data-id', copy.attr('data-id') + '-dup' + i)
            list.append(copy)
        }

        list.addClass('carousel-track').wrap('<div class="carousel-viewport"></div>')

        let viewport = list.parent()
        let controls = $('<div class="carousel-controls"><button type="button" class="carousel-prev" aria-label="이전 상품">‹</button><button type="button" class="carousel-next" aria-label="다음 상품">›</button></div>')
        viewport.before(controls)

        let previous = controls.find('.carousel-prev')
        let next = controls.find('.carousel-next')

        function updateControls() {
            previous.prop('disabled', false)
            next.prop('disabled', false)
        }

        function move(direction) {
            let itemWidth = list.children('li').first().outerWidth()
            let gap = parseFloat(window.getComputedStyle(list[0]).gap) || 0
            let element = viewport[0]
            let maxScroll = element.scrollWidth - element.clientWidth
            let target = viewport.scrollLeft() + direction * (itemWidth + gap)

            if (target > maxScroll + 1) {
                target = 0
            } else if (target < -1) {
                target = maxScroll
            }

            viewport.stop().animate({
                scrollLeft: target
            }, 350, updateControls)
        }

        previous.on('click', function(){ move(-1) })
        next.on('click', function(){ move(1) })
        viewport.on('scroll carousel:refresh', updateControls)
        updateControls()
    })

    let typingLine = document.querySelector('.typing-line')
    if (typingLine && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let phrases = [
            'Slowly and leisurely through the busy routine,\ngently filling your space like a quiet warmth.',
            'Finding soft moments of calm in the gentle rhythm of your everyday.',
            'A quiet touch of comfort, wrapping your days in effortless grace.',
            'Tracing the slow days of warmth, making every ordinary space feel like home.'
        ]
        let phraseIndex = 0
        let characterIndex = 0
        let deleting = false
        typingLine.textContent = ''
        typingLine.classList.add('is-typing')

        function rotatePhrase() {
            let phrase = phrases[phraseIndex]

            if (deleting) {
                characterIndex--
                typingLine.textContent = phrase.slice(0, characterIndex)
            } else {
                characterIndex++
                typingLine.textContent = phrase.slice(0, characterIndex)
            }

            if (!deleting && characterIndex === phrase.length) {
                deleting = true
                setTimeout(rotatePhrase, 4000)
                return
            }

            if (deleting && characterIndex === 0) {
                deleting = false
                phraseIndex = (phraseIndex + 1) % phrases.length
                setTimeout(rotatePhrase, 500)
                return
            }

            setTimeout(rotatePhrase, deleting ? 30 : 65)
        }

        rotatePhrase()
    }

    let catalogProducts = [
        { id: 'sum01', image: 'sum01.jpg', brand: 'NOUVO', name: '무드 데님 믹스 패딩 자켓', oldPrice: '128,000원', price: '109,000원', colors: ['#E6E6E6', '#6F7A72', '#697883'] },
        { id: 'sum02', image: 'sum02.jpg', brand: 'THESCENTO', name: '클래식 트위드 싱글 자켓', oldPrice: '98,000원', price: '84,000원', colors: ['#EAE2DF', '#554435', '#373737'] },
        { id: 'sum03', image: 'sum03.jpg', brand: 'CLOVERD', name: '루즈핏 빈티지 레더 자켓', oldPrice: '142,000원', price: '119,000원', colors: ['#343434'] },
        { id: 'sum04', image: 'sum04.jpg', brand: 'UNIQUEMENT', name: '소프트 케이블 터틀넥 니트', oldPrice: '57,000원', price: '48,500원', colors: ['#CFD8C9', '#7A756F', '#6A8270'] }
    ]

    // 카테고리별 상품 카드 (TOP & TEE / SKIRT / OUTER)
    // 지금은 임시 상품 4개를 6칸에 돌려 쓰므로, 카드마다 고유 id 를 줍니다.
    // 실제 상품이 들어오면 id 를 상품 고유 번호로 바꾸세요.
    document.querySelectorAll('.catalog-grid').forEach(function(list, categoryIndex){
        for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
            let product = catalogProducts[(cardIndex + categoryIndex) % catalogProducts.length]
            let item = document.createElement('li')
            item.className = 'catalog-item'
            item.dataset.id = 'cat' + categoryIndex + '-' + cardIndex + '-' + product.id
            item.dataset.brand = product.brand
            item.dataset.name = product.name
            item.dataset.old = product.oldPrice
            item.dataset.price = product.price
            item.dataset.img = './img/' + product.image
            item.dataset.link = '#'
            item.dataset.colors = product.colors.join(',')

            let photo = document.createElement('div')
            photo.className = 'catalog-photo'
            let image = document.createElement('img')
            image.src = './img/' + product.image
            image.alt = product.name
            image.loading = 'lazy'
            photo.appendChild(image)

            // 하트 아이콘은 like.js 가 자동으로 넣어줍니다 (버튼은 비워둠)
            let favorite = document.createElement('button')
            favorite.type = 'button'
            favorite.className = 'catalog-favorite like-btn'
            favorite.setAttribute('aria-label', '찜하기')
            photo.appendChild(favorite)

            let brand = document.createElement('span')
            brand.className = 'catalog-brand'
            brand.textContent = product.brand
            let colors = document.createElement('div')
            colors.className = 'catalog-swatches'
            product.colors.forEach(function(color){
                let swatch = document.createElement('span')
                swatch.style.backgroundColor = color
                colors.appendChild(swatch)
            })
            let name = document.createElement('span')
            name.className = 'catalog-name'
            name.textContent = product.name
            let price = document.createElement('span')
            price.className = 'catalog-price'
            price.innerHTML = '<s>' + product.oldPrice + '</s> ' + product.price

            item.append(photo, brand, colors, name, price)
            list.appendChild(item)
        }
    })

    let reviewCarousel = document.querySelector('.review-carousel')
    if (reviewCarousel) {
        let reviewViewport = reviewCarousel.querySelector('.review-viewport')
        let reviewTrack = reviewCarousel.querySelector('.review-grid')
        let reviewMoreButton = reviewCarousel.querySelector('.review-more')
        let reviewCards = Array.from(reviewTrack.children)
        let additionalReviews = [
            { source: 2, image: 'sum03.jpg', brand: '스타일 BY THESCENTO', title: '실루엣이 마음에 들어요', excerpt: '핏이 예쁘고 활용하기 좋습니다.', date: '26.05.10' },
            { source: 3, image: 'sum04.jpg', brand: '스타일 BY NURU', title: '매일 손이 가는 아이템', excerpt: '부드럽고 편안해서 자주 입어요.', date: '26.05.08' }
        ]
        let showAllReviews = false

        additionalReviews.forEach(function(review){
            let card = reviewCards[review.source].cloneNode(true)
            card.querySelector('.review-photo img').src = './img/' + review.image
            card.querySelector('.review-brand').textContent = review.brand
            card.querySelector('.review-title').textContent = review.title
            card.querySelector('.review-excerpt').textContent = review.excerpt
            card.querySelector('.review-meta time').textContent = review.date
            reviewTrack.appendChild(card)
        })

        function updateReviewDisplay() {
            let cards = Array.from(reviewTrack.children)
            let visibleCount = showAllReviews ? cards.length : Math.min(4, cards.length)

            cards.forEach(function(card, index) {
                card.style.display = index < visibleCount ? '' : 'none'
            })

            if (reviewMoreButton) {
                reviewMoreButton.textContent = showAllReviews ? '접기' : '더보기'
                reviewMoreButton.setAttribute('aria-expanded', String(showAllReviews))
            }

            if (reviewViewport) {
                reviewViewport.scrollLeft = 0
            }
        }

        if (reviewMoreButton) {
            reviewMoreButton.addEventListener('click', function() {
                showAllReviews = !showAllReviews
                updateReviewDisplay()
            })
        }

        updateReviewDisplay()
    }

    let lookbookTrack = document.querySelector('.lookbook-track')
    if (lookbookTrack) {
        let lookbookTabs = Array.from(document.querySelectorAll('[data-lookbook-tab]'))
        let lookbookPageLabel = document.querySelector('.lookbook-page')
        let lookbookPrevious = document.querySelector('.lookbook-prev')
        let lookbookNext = document.querySelector('.lookbook-next')
        let currentLookbookPage = 0
        let lookbookItems = catalogProducts
        let lookbookSets = [
            { note: '일상을 물들이는 무드, 가볍게 걸치는 오늘의 일상', offset: 0 },
            { note: '이번 주의 새로운 조합으로 완성하는 편안한 스타일', offset: 1 },
            { note: '느린 계절의 색과 질감을 담은 데일리 룩', offset: 2 }
        ]

        function createLookbookImage(item, altText) {
            let image = document.createElement('img')
            image.src = './img/' + item.image
            image.alt = altText
            image.loading = 'lazy'
            return image
        }

        function updateLookbookPage() {
            let pageCount = lookbookTrack.children.length
            lookbookTrack.style.transform = 'translateX(-' + currentLookbookPage * 100 + '%)'
            lookbookPageLabel.textContent = (currentLookbookPage + 1) + ' / ' + pageCount
            lookbookPrevious.disabled = false
            lookbookNext.disabled = false
        }

        function renderLookbookSet(setIndex) {
            let lookbookSet = lookbookSets[setIndex]
            currentLookbookPage = 0
            lookbookTrack.innerHTML = ''
            document.querySelector('.lookbook-note').textContent = lookbookSet.note

            for (let pageIndex = 0; pageIndex < 4; pageIndex++) {
                let slide = document.createElement('div')
                slide.className = 'lookbook-slide'
                let picks = document.createElement('div')
                picks.className = 'lookbook-picks'
                for (let pickIndex = 0; pickIndex < 3; pickIndex++) {
                    let itemIndex = (pageIndex * 3 + pickIndex + lookbookSet.offset) % lookbookItems.length
                    let item = lookbookItems[itemIndex]
                    let pick = document.createElement('div')
                    pick.className = 'lookbook-pick'
                    let photo = document.createElement('div')
                    photo.className = 'lookbook-pick-photo'
                    photo.appendChild(createLookbookImage(item, item.name))
                    let favorite = document.createElement('button')
                    favorite.type = 'button'
                    favorite.className = 'lookbook-pick-favorite'
                    favorite.setAttribute('aria-label', '찜하기')
                    favorite.setAttribute('aria-pressed', 'false')
                    favorite.textContent = '♡'
                    favorite.addEventListener('click', function(){
                        let isFavorite = favorite.getAttribute('aria-pressed') === 'true'
                        favorite.setAttribute('aria-pressed', String(!isFavorite))
                        favorite.setAttribute('aria-label', isFavorite ? '찜하기' : '찜 해제')
                        favorite.textContent = isFavorite ? '♡' : '♥'
                    })
                    photo.appendChild(favorite)
                    pick.appendChild(photo)

                    let brand = document.createElement('span')
                    brand.className = 'lookbook-brand'
                    brand.textContent = item.brand
                    let colors = document.createElement('div')
                    colors.className = 'lookbook-colors'
                    item.colors.forEach(function(color){
                        let swatch = document.createElement('span')
                        swatch.style.backgroundColor = color
                        colors.appendChild(swatch)
                    })
                    let name = document.createElement('span')
                    name.className = 'lookbook-product-name'
                    name.textContent = item.name
                    let price = document.createElement('span')
                    price.className = 'lookbook-product-price'
                    price.innerHTML = '<s>' + item.oldPrice + '</s> ' + item.price

                    pick.append(brand, colors, name, price)
                    picks.appendChild(pick)
                }

                slide.appendChild(picks)
                lookbookTrack.appendChild(slide)
            }

            lookbookTabs.forEach(function(tab, tabIndex){
                let isActive = tabIndex === setIndex
                tab.classList.toggle('active', isActive)
                tab.setAttribute('aria-pressed', String(isActive))
            })
            updateLookbookPage()
        }

        lookbookTabs.forEach(function(tab, index){
            tab.addEventListener('click', function(){ renderLookbookSet(index) })
        })
        lookbookPrevious.addEventListener('click', function(){
            let pageCount = lookbookTrack.children.length
            currentLookbookPage = (currentLookbookPage - 1 + pageCount) % pageCount
            updateLookbookPage()
        })
        lookbookNext.addEventListener('click', function(){
            let pageCount = lookbookTrack.children.length
            currentLookbookPage = (currentLookbookPage + 1) % pageCount
            updateLookbookPage()
        })

        renderLookbookSet(0)
    }

    // CURATED 탭메뉴
    tabbtn.click(function(){
        const index = $(this).index()

        $(this).addClass('active').siblings().removeClass('active')
        tabcon.eq(index).show().siblings().hide()
        tabcon.eq(index).find('.carousel-viewport').trigger('carousel:refresh')
    });

    $(window).on('resize', function(){
        $('.carousel-viewport').trigger('carousel:refresh')
    })

    // 위에서 만든 카드들에 찜 상태(하트 색, 개수)를 반영
    if (window.NuruLike) window.NuruLike.refresh()
});