document.addEventListener('DOMContentLoaded', function () {
    var emailInput = document.getElementById('login-email');
    var passwordInput = document.getElementById('login-password');
    var loginButton = document.querySelector('.login-btn h2 a');
    var saveIdInput = document.getElementById('save-id');
    var savedEmail = window.localStorage.getItem('nuruSavedEmail');
    var saveIdEnabled = window.localStorage.getItem('nuruSaveIdEnabled');
    var snsButtons = document.querySelectorAll('.sns-more a');

    if (savedEmail) {
        emailInput.value = savedEmail;
    }
    saveIdInput.checked = saveIdEnabled === 'true' || (saveIdEnabled === null && Boolean(savedEmail));

    saveIdInput.addEventListener('change', function () {
        window.localStorage.setItem('nuruSaveIdEnabled', String(saveIdInput.checked));
        if (!saveIdInput.checked) {
            window.localStorage.removeItem('nuruSavedEmail');
        }
    });

    loginButton.addEventListener('click', function (event) {
        event.preventDefault();

        var emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
        var passwordIsValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/.test(passwordInput.value);

        if (!emailIsValid || !passwordIsValid) {
            window.alert('잘못된 정보를 입력하셨습니다.');
            (emailIsValid ? passwordInput : emailInput).focus();
            return;
        }

        if (saveIdInput.checked) {
            window.localStorage.setItem('nuruSavedEmail', emailInput.value.trim());
            window.localStorage.setItem('nuruSaveIdEnabled', 'true');
        } else {
            window.localStorage.removeItem('nuruSavedEmail');
            window.localStorage.setItem('nuruSaveIdEnabled', 'false');
        }

        window.alert('NURU에 오신 걸 환영합니다.');
        window.location.href = 'index.html';
    });

    snsButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            window.alert('NURU에 오신 걸 환영합니다.');
            window.location.href = 'index.html';
        });
    });
});