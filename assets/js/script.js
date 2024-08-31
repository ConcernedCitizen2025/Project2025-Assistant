document.addEventListener('DOMContentLoaded', function () {
    const logoContainer = document.querySelector('.logo-container');
    const mask = document.querySelector('.mask');

    logoContainer.addEventListener('mouseover', function () {
        mask.style.transform = 'translateX(-100%)';
    });

    logoContainer.addEventListener('mouseout', function () {
        mask.style.transform = 'translateX(0)';
    });
});
