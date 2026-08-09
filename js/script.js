(function () {
    'use strict';

    var root = document.documentElement;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============ theme ============ */
    var STORAGE_KEY = 'fm-theme';

    function systemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function resolveTheme() {
        var saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'light' || saved === 'dark' ? saved : systemTheme();
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            var glyph = btn.querySelector('.theme-glyph');
            var label = btn.querySelector('.theme-label');
            if (glyph) glyph.textContent = theme === 'dark' ? '☀' : '☾';
            if (label) label.textContent = theme === 'dark' ? 'light mode' : 'dark mode';
        });
    }

    function initTheme() {
        applyTheme(resolveTheme());
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(systemTheme());
            }
        });
    }

    var batmanAudio = null;

    function stopBatmanAudio() {
        if (batmanAudio) {
            batmanAudio.pause();
            batmanAudio.currentTime = 0;
            batmanAudio = null;
        }
    }

    function toggleTheme(event) {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        var batman = false;

        if (next === 'light') {
            stopBatmanAudio();
        }

        if (next === 'dark' && Math.random() < 1 / 3) {
            batman = true;
            var hero = document.getElementById('top');
            if (hero) {
                hero.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
            }
            var audio = new Audio('assets/batman_entrance.mp3');
            batmanAudio = audio;
            var play = function () {
                var p = audio.play();
                if (p && p.catch) p.catch(function () {});
            };
            play();
            setTimeout(function () {
                if (batmanAudio === audio) {
                    play();
                }
            }, 400);
        }

        var apply = function () {
            localStorage.setItem(STORAGE_KEY, next);
            applyTheme(next);
            root.classList.toggle('is-batman', batman);
        };

        if (!('startViewTransition' in document) || prefersReducedMotion) {
            apply();
            return;
        }

        var el = event && event.currentTarget ? event.currentTarget : null;
        var rect = el ? el.getBoundingClientRect() : null;
        var originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        var originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

        root.classList.add('vt-switching');

        var transition;
        try {
            transition = document.startViewTransition(apply);
        } catch (err) {
            root.classList.remove('vt-switching');
            apply();
            return;
        }

        var cleanUp = function () {
            root.classList.remove('vt-switching');
            root.style.removeProperty('--vt-x');
            root.style.removeProperty('--vt-y');
        };

        if (transition.ready) {
            transition.ready.then(function () {
                root.style.setProperty('--vt-x', originX + 'px');
                root.style.setProperty('--vt-y', originY + 'px');
            }).catch(cleanUp);
        }

        if (transition.finished) {
            transition.finished.then(cleanUp, cleanUp);
        }
    }

    initTheme();

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
        btn.addEventListener('click', toggleTheme);
    });

    /* ============ entrance stagger ============ */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    revealEls.forEach(function (el, i) {
        el.style.setProperty('--reveal-delay', Math.min(50 + i * 70, 330) + 'ms');
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        revealEls.forEach(function (el) { observer.observe(el); });
    }

    /* ============ sidebar active link ============ */
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));

    function setActiveNav(id) {
        navItems.forEach(function (item) {
            var isActive = item.getAttribute('href') === '#' + id;
            item.classList.toggle('is-active', isActive);
        });
    }

    if ('IntersectionObserver' in window) {
        var navObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setActiveNav(entry.target.id);
                }
            });
        }, { threshold: 0.25 });

        sections.forEach(function (section) { navObserver.observe(section); });
    }

    /* ============ mobile menu ============ */
    var menuBtn = document.querySelector('.menu-btn');
    var mobileMenu = document.getElementById('mobile-menu');
    var mobileMenuLinks = mobileMenu ? Array.prototype.slice.call(mobileMenu.querySelectorAll('a')) : [];
    var lastFocused = null;
    var menuState = 'closed';

    function setMenuState(state) {
        if (menuState === state) return;
        menuState = state;
        var open = state === 'open';

        mobileMenu.hidden = !open;
        document.body.style.overflow = open ? 'hidden' : '';
        menuBtn.textContent = open ? 'close' : 'menu';
        menuBtn.setAttribute('aria-expanded', String(open));

        if (open) {
            lastFocused = document.activeElement;
            mobileMenu.querySelector('a').focus();
        } else if (lastFocused) {
            lastFocused.focus();
        }
    }

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function () {
            setMenuState(menuState === 'closed' ? 'open' : 'closed');
        });

        mobileMenuLinks.forEach(function (link) {
            link.addEventListener('click', function () { setMenuState('closed'); });
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuState === 'open') {
            setMenuState('closed');
        }
    });

    /* ============ copy email ============ */
    var copyBtn = document.getElementById('copy-email');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            var email = 'franzrobertmesina@gmail.com';
            var fallback = function () {
                copyBtn.textContent = 'copied ✓';
                setTimeout(function () { copyBtn.textContent = 'copy email'; }, 1600);
            };
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(email).then(fallback, fallback);
            } else {
                fallback();
            }
        });
    }

    /* ============ contact form -> mailto.. ewan kung gagawin ko pa ba to ============ */
    var form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = form.elements.name.value.trim();
            var email = form.elements.email.value.trim();
            var message = form.elements.message.value.trim();

            if (!name || !email || !message) {
                form.elements.message.focus();
                return;
            }

            var subject = 'Portfolio message from ' + name;
            var body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message;
            window.location.href = 'mailto:franzrobertmesina@gmail.com?subject='
                + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        });
    }

    /* ============ ai chat widget basta ============ */
    var chatFab = document.querySelector('.chat-fab');
    var chatPanel = document.getElementById('chat-panel');
    var chatBody = document.getElementById('chat-body');
    var chatForm = document.querySelector('.chat-form');
    var chatInput = chatForm ? chatForm.querySelector('.chat-input') : null;
    var chatClose = document.querySelector('.chat-close');
    var chatMax = document.querySelector('.chat-max');

    var CHAT_API = '/api/chat';

    function appendMessage(text, who) {
        var msg = document.createElement('div');
        msg.className = 'msg msg-' + who;
        msg.textContent = text;
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
        return msg;
    }

    function showTyping() {
        var row = document.createElement('div');
        row.className = 'msg msg-bot msg-typing';
        row.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < 3; i++) {
            var dot = document.createElement('span');
            dot.className = 'typing-dot';
            row.appendChild(dot);
        }
        chatBody.appendChild(row);
        chatBody.scrollTop = chatBody.scrollHeight;
        return row;
    }

    function sendChatMessage(text) {
        appendMessage(text, 'user');
        chatInput.value = '';
        var typing = showTyping();

        fetch(CHAT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error('request failed with status ' + res.status);
                }
                return res.json();
            })
            .then(function (data) {
                typing.remove();
                appendMessage(data.reply || 'No reply received.', 'bot');
            })
            .catch(function () {
                typing.remove();
                appendMessage('Sorry! There seems to be an error reaching my backend right now.', 'bot');
            });
    }

    function closeChat() {
        chatPanel.hidden = true;
        chatFab.setAttribute('aria-expanded', 'false');
        chatFab.focus();
    }

    function setMaximized(on) {
        chatPanel.classList.toggle('is-maximized', on);
        chatMax.textContent = on ? 'minimize' : 'expand';
        chatMax.setAttribute('aria-label', on ? 'minimize chat' : 'maximize chat');
    }

    if (chatMax) {
        chatMax.addEventListener('click', function () {
            setMaximized(!chatPanel.classList.contains('is-maximized'));
        });
    }

    var visualViewport = window.visualViewport || null;
    var keyboardPinned = false;
    if (visualViewport && chatPanel && chatInput) {
        var updatePin = function () {
            if (chatPanel.hidden || document.activeElement !== chatInput) return;
            var gap = window.innerHeight - (visualViewport.offsetTop + visualViewport.height);
            if (gap > 60) {
                chatPanel.style.height = visualViewport.height + 'px';
                chatPanel.style.bottom = gap + 'px';
                keyboardPinned = true;
            } else if (keyboardPinned && gap < 20) {
                chatPanel.style.removeProperty('height');
                chatPanel.style.removeProperty('bottom');
                keyboardPinned = false;
            }
        };
        chatInput.addEventListener('focus', updatePin);
        chatInput.addEventListener('blur', function () {
            chatPanel.style.removeProperty('height');
            chatPanel.style.removeProperty('bottom');
            keyboardPinned = false;
        });
        visualViewport.addEventListener('resize', updatePin);
    }

    if (chatFab && chatPanel) {
        chatFab.addEventListener('click', function () {
            var open = chatPanel.hidden;
            chatPanel.hidden = !open;
            chatFab.setAttribute('aria-expanded', String(open));
            if (open && chatInput) {
                chatInput.focus();
            }
        });

        if (chatClose) {
            chatClose.addEventListener('click', closeChat);
        }

        if (chatForm && chatInput) {
            chatForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var text = chatInput.value.trim();
                if (text) {
                    sendChatMessage(text);
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !chatPanel.hidden) {
                closeChat();
            }
        });
    }
})();