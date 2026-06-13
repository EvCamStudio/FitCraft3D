/**
 * FitCraft 3D — Landing Page JavaScript
 * Handles: Custom Cursor, Magnetic Buttons, Navbar Scroll,
 *          Hoodie Color Swatches, Auth Modal, Scroll Reveal
 */

document.addEventListener('DOMContentLoaded', () => {


    // ─── NAVBAR SCROLL BEHAVIOR ──────────────────────────────────
    const navbar = document.getElementById('navbar');
    const heroSection = document.getElementById('hero');

    const navObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { threshold: 0.1 });

    if (heroSection) navObserver.observe(heroSection);


    // ─── SCROLL REVEAL ───────────────────────────────────────────
    const revealEls = document.querySelectorAll('.feature-card, .step-card, .showcase-card, .section-header');
    revealEls.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger by index within the same parent
                const siblings = Array.from(entry.target.parentNode.children);
                const idx = siblings.indexOf(entry.target);
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, idx * 80);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealEls.forEach(el => revealObserver.observe(el));


    // ─── HOODIE COLOR SWATCHES (Interactive Preview) ──────────────
    const cardViewport = document.querySelector('.card-viewport');
    const swatches = document.querySelectorAll('.swatch');
    const hoodieSVG = document.querySelector('.hoodie-svg');

    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            // Remove active from all
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');

            // Update hoodie CSS variables on the viewport
            if (cardViewport) {
                const body = swatch.dataset.body;
                const sleeve = swatch.dataset.sleeve;
                const collar = swatch.dataset.collar;
                cardViewport.style.setProperty('--hoodie-body', body);
                cardViewport.style.setProperty('--hoodie-sleeve', sleeve);
                cardViewport.style.setProperty('--hoodie-collar', collar);
            }
        });
    });


    // ─── MAGNETIC BUTTONS ─────────────────────────────────────────
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });


    // ─── AUTH MODAL ───────────────────────────────────────────────
    const authOverlay = document.getElementById('authOverlay');
    const authModalClose = document.getElementById('authModalClose');
    const landingAuthForm = document.getElementById('landingAuthForm');
    const toggleLandingAuth = document.getElementById('toggleLandingAuth');

    // CTA buttons that open auth modal (commented out - direct navigation)
    // If you want auth gate before studio, uncomment and handle accordingly
    // const heroCta = document.getElementById('heroCta');
    // const navCta = document.getElementById('navCta');
    // const ctaFinalBtn = document.getElementById('ctaFinalBtn');

    function openAuthModal() {
        if (authOverlay) {
            authOverlay.classList.remove('hidden');
        }
    }

    function closeAuthModal() {
        if (authOverlay) {
            authOverlay.classList.add('hidden');
        }
    }

    if (authModalClose) {
        authModalClose.addEventListener('click', closeAuthModal);
    }

    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) closeAuthModal();
        });
    }

    if (toggleLandingAuth) {
        toggleLandingAuth.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Fitur Daftar Akun masih dalam bentuk Mockup untuk demonstrasi lomba. Silakan gunakan form Masuk.');
        });
    }

    if (landingAuthForm) {
        landingAuthForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('landingEmail').value;
            if (email) {
                // Save username to localStorage for studio page
                const username = email.split('@')[0];
                const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
                localStorage.setItem('fitcraft_user', JSON.stringify({ name: capitalized, email }));
            }
            // Navigate to studio
            window.location.href = 'studio.html';
        });
    }

    // Watch Demo Button
    const watchDemoBtn = document.getElementById('watchDemoBtn');
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', () => {
            // Scroll to features section as demo
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        });
    }


    // ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    // ─── NAVBAR ACTIVE SECTION HIGHLIGHT ─────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${entry.target.id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { threshold: 0.5 });

    sections.forEach(sec => sectionObserver.observe(sec));

});
