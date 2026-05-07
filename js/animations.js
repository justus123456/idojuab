document.addEventListener('DOMContentLoaded', () => {
    console.log('Animations script loaded');

    // Initial reveal for the logo
    anime({
        targets: '.logo',
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutExpo'
    });

    // 3D Animation for Preloader
    const preloaderAnimation = anime.timeline({
        targets: '.preloader-svg .line, .preloader-svg .box',
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
    });

    preloaderAnimation
        .add({
            rotateY: '180deg',
            duration: 1000,
            delay: anime.stagger(100)
        })
        .add({
            rotateX: '180deg',
            duration: 1000,
            delay: anime.stagger(100)
        })
        .add({
            scale: 1.2,
            duration: 500
        });

    // 3D Tilt effect for images in the about section
    const images = document.querySelectorAll('.about .imgbx img');

    images.forEach(img => {
        img.addEventListener('mouseenter', () => {
            anime({
                targets: img,
                rotateX: '10deg',
                rotateY: '10deg',
                scale: 1.05,
                duration: 400,
                easing: 'easeOutQuad'
            });
        });

        img.addEventListener('mouseleave', () => {
            anime({
                targets: img,
                rotateX: '0deg',
                rotateY: '0deg',
                scale: 1,
                duration: 400,
                easing: 'easeOutQuad'
            });
        });

        img.addEventListener('mousemove', (e) => {
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -15; // Max 15 degrees
            const rotateY = ((x - centerX) / centerX) * 15; // Max 15 degrees

            // Use direct style updates for mousemove to avoid creating new anime instances
            img.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
    });

    // Animating section titles as they enter the viewport
    const observerOptions = {
        threshold: 0.2
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const title = entry.target.querySelector('.titleText');
                if (title) {
                    anime({
                        targets: title,
                        translateZ: [100, 0],
                        opacity: [0, 1],
                        rotateX: [20, 0],
                        duration: 1200,
                        easing: 'easeOutExpo'
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        sectionObserver.observe(section);
    });
});
