document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.header-search').forEach(function (search) {
        var toggle = search.querySelector('.search-toggle');
        var input = search.querySelector('.header-search-input');
        input.placeholder = '검색어를 입력해주세요.';

        toggle.addEventListener('click', function () {
            input.focus();
        });
    });
});
