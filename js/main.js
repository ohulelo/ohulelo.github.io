/* --- Main Navigation and Interactive Effects --- */

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const navLogo = document.querySelector('.nav-logo');

    if (navLogo) {
        const hasDot = navLogo.textContent.trim().endsWith('.');
        const originalText = hasDot ? 'Özgen Tunç Türker.' : 'Özgen Tunç Türker';
        const scrolledText = hasDot ? 'Tunç Türker.' : 'Tunç Türker';

        const updateNavbar = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
                navLogo.textContent = scrolledText;
                navLogo.style.setProperty('--logo-text', `"${scrolledText.toLowerCase()}"`);
            } else {
                navbar.classList.remove('scrolled');
                navLogo.textContent = originalText;
                navLogo.style.setProperty('--logo-text', `"${originalText.toLowerCase()}"`);
            }
        };

        window.addEventListener('scroll', updateNavbar);
        updateNavbar();
    } else {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Scroll reveal animations via Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.01
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealSections = document.querySelectorAll('.showcase-section, .cv-section, .thoughts-section');
    revealSections.forEach(section => {
        section.classList.add('fade-in-section');
        sectionObserver.observe(section);
    });

    // Smooth scrolling for anchor links with navbar offset adjustment
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Tab switching logic for showcase grids
    const tabBtns = document.querySelectorAll('.tab-btn');
    const gridContainers = document.querySelectorAll('.grid-container');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            if (history.pushState) {
                history.pushState(null, null, '#' + targetId);
            } else {
                window.location.hash = targetId;
            }

            // Toggle active states for tabs and grid panels
            tabBtns.forEach(b => b.classList.remove('active'));
            gridContainers.forEach(g => g.classList.remove('active'));

            btn.classList.add('active');
            const targetGrid = document.getElementById(targetId);
            if (targetGrid) targetGrid.classList.add('active');
        });
    });

    // Tab persistence from URL hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        const targetBtn = Array.from(tabBtns).find(btn => btn.getAttribute('data-target') === initialHash);
        if (targetBtn) {
            targetBtn.click();
        }
    }

    // Fetch currently reading books (Goodreads) and films (Letterboxd) via RSS-to-JSON API
    const GOODREADS_RSS_URL = 'https://www.goodreads.com/review/list_rss/134531861-tun?shelf=currently-reading';
    const LETTERBOXD_RSS_URL = 'https://letterboxd.com/ohulelo/rss/';

    async function fetchMediaFeeds() {
        async function fetchRSS(feedUrl) {
            if (!feedUrl || feedUrl.includes('YOUR_')) return [];
            try {
                const cacheBuster = `&t=${new Date().getTime()}`;
                const feedUrlWithCacheBust = feedUrl.includes('?') ? feedUrl + cacheBuster : feedUrl + '?' + cacheBuster.substring(1);

                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrlWithCacheBust)}`);
                const data = await response.json();
                return data.items || [];
            } catch (error) {
                console.error("Error fetching RSS:", error);
                return [];
            }
        }

        // Goodreads integration
        const booksContainer = document.getElementById('books');
        if (booksContainer && !GOODREADS_RSS_URL.includes('YOUR_')) {
            const books = await fetchRSS(GOODREADS_RSS_URL);
            if (books && books.length > 0) {
                booksContainer.innerHTML += `
                    <div class="section-header" style="grid-column: 1 / -1; margin-top: var(--space-xl); margin-bottom: 0; text-align: left;">
                        <h3 style="font-size: 1.2rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-accent-dim); padding-bottom: 0.5rem; margin-bottom: 1rem;">currently reading.</h3>
                    </div>
                `;

                // Parse rating out of item description
                const getBookRating = (description) => {
                    const match = description.match(/rating: (\d+)/);
                    return match ? parseInt(match[1]) : 0;
                };

                books.slice(0, 5).forEach(book => {
                    const desc = book.description;

                    const imgMatch = desc.match(/src="([^"]+)"/);
                    let coverUrl = imgMatch ? imgMatch[1] : '';
                    coverUrl = coverUrl.replace(/\._S[XY]\d+_/g, '');

                    // Parse author info from Goodreads description layout
                    let author = book.author;
                    if (!author || author === 'Goodreads') {
                        const authorLinkMatch = desc.match(/by <a.*?>([^<]+)<\/a>/);
                        const authorTextMatch = desc.match(/author:\s*([^<]+)<br/i);

                        if (authorLinkMatch) {
                            author = authorLinkMatch[1].trim();
                        } else if (authorTextMatch) {
                            author = authorTextMatch[1].trim();
                        } else {
                            author = 'Goodreads';
                        }
                    }

                    const html = `
                        <a href="${book.link}" target="_blank" class="grid-item hover-shine">
                            <div class="item-visual book-cover" style="background-image: url('${coverUrl}'); background-size: cover; background-position: center; border-radius: 8px;"></div>
                            <div class="item-meta">
                                <h3>${book.title}</h3>
                                <p>${author}</p>
                            </div>
                        </a>
                    `;
                    booksContainer.innerHTML += html;
                });
            }
        }

        // Render letterboxd films from local data
        const filmsContainer = document.getElementById('films');
        if (filmsContainer && typeof latestFilms !== 'undefined') {
            filmsContainer.innerHTML += `
                <div class="sub-section-header">
                    <h3>recently watched.</h3>
                    <a href="https://boxd.it/1e3DD" target="_blank" class="sub-header-link">see more on letterboxd ↗</a>
                </div>
            `;

            latestFilms.forEach(film => {
                filmsContainer.innerHTML += `
                    <a href="${film.link}" target="_blank" class="grid-item hover-shine">
                        <div class="item-visual film-still" 
                             style="background-image: url('${film.posterUrl}'); background-size: cover; background-position: center; border-radius: 8px;">
                        </div>
                        <div class="item-meta">
                            <h3>${film.title}.</h3>
                            <p style="text-align: left;">${film.director} (${film.year}) — ${film.rating}</p>
                        </div>
                    </a>
                `;
            });
        }
    }

    // Thoughts/Essays feed integration
    function renderThoughts() {
        const feedContainer = document.getElementById('thoughts-feed');
        if (!feedContainer || typeof latestThoughts === 'undefined') return;
        feedContainer.innerHTML = '';

        latestThoughts.forEach(thought => {
            const html = `
                <a href="${thought.link}" class="thought-card fade-in-section">
                    <div class="thought-date">${thought.date}</div>
                    <h3 class="thought-title">${thought.title.toLowerCase()}${thought.title.endsWith('.') ? '' : '.'}</h3>
                    <div class="thought-preview">
                        <p class="preview-text">${thought.summary}</p>
                    </div>
                    <div class="thought-more">read →</div>
                </a>
            `;
            feedContainer.innerHTML += html;
        });

        // Observe new thought cards for scroll effects
        const newCards = feedContainer.querySelectorAll('.thought-card');
        if (typeof sectionObserver !== 'undefined') {
            newCards.forEach(card => sectionObserver.observe(card));
        }
    }

    // Initialize page-specific scripts (exclude on homepage/intro)
    const isHomePage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/') ||
        window.location.pathname === '';

    if (!isHomePage) {
        fetchMediaFeeds();
        renderThoughts();
    }

    // Playlist accordion functionality
    const categoryWrappers = document.querySelectorAll('.playlist-category-wrapper');
    if (categoryWrappers.length > 0) {
        // Inject accordion layout styles
        const style = document.createElement('style');
        style.innerHTML = `
            .music-grid {
                gap: 0 !important;
            }
            .playlist-category-wrapper {
                cursor: pointer;
                position: relative;
                transition: opacity 0.2s ease, transform 0.2s ease;
                margin-top: var(--space-lg) !important;
                margin-bottom: var(--space-sm) !important;
            }
            .playlist-category-wrapper:hover {
                opacity: 0.8;
                transform: scale(0.99);
            }
            .accordion-arrow {
                display: inline-block;
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 1.2rem;
                margin-left: 12px;
                opacity: 0.6;
                vertical-align: middle;
            }
            .playlist-row {
                overflow: hidden;
                transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                            opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                            margin 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                            padding 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                max-height: 0;
                opacity: 0;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }
            .playlist-row.open {
                max-height: 2500px; /* Accommodate vertical nested elements */
                opacity: 1;
                margin-top: var(--space-md) !important;
                margin-bottom: var(--space-xl) !important;
                padding-bottom: 10px !important;
            }
        `;
        document.head.appendChild(style);

        categoryWrappers.forEach((wrapper, index) => {
            const titleDiv = wrapper.querySelector('.playlist-category');
            if (titleDiv) {
                titleDiv.innerHTML += '<span class="accordion-arrow">▼</span>';
            }

            let row = wrapper.nextElementSibling;
            // Traverse DOM to find associated content row
            while (row && !row.classList.contains('playlist-row')) {
                row = row.nextElementSibling;
            }

            if (row) {
                wrapper.addEventListener('click', () => {
                    const isOpen = row.classList.contains('open');
                    const arrow = wrapper.querySelector('.accordion-arrow');

                    if (isOpen) {
                        row.classList.remove('open');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    } else {
                        row.classList.add('open');
                        if (arrow) arrow.style.transform = 'rotate(180deg)';
                    }
                });
            }
        });
    }

    // Places Tab Logic (Cards and Iframe Viewer)
    const placeCards = document.querySelectorAll('.place-card');
    const placesCardsContainer = document.getElementById('places-cards');
    const placesViewer = document.getElementById('places-viewer');
    const placeIframe = document.getElementById('place-iframe');
    const viewerBackBtn = document.getElementById('viewer-back-btn');
    const viewerPopoutBtn = document.getElementById('viewer-popout-btn');
    const languageToggleContainer = document.querySelector('.language-toggle');
    let currentPlaceBaseUrl = '';

    if (placeCards.length > 0) {
        placeCards.forEach(card => {
            card.addEventListener('click', () => {
                const url = card.getAttribute('data-url');
                const langsStr = card.getAttribute('data-langs');
                const defaultLang = card.getAttribute('data-default-lang');
                
                if (url && url !== '#') {
                    currentPlaceBaseUrl = url;
                    
                    // Clear existing language buttons
                    languageToggleContainer.innerHTML = '';
                    
                    if (langsStr) {
                        const langs = langsStr.split(',');
                        langs.forEach(lang => {
                            const btn = document.createElement('button');
                            btn.className = 'lang-btn';
                            btn.setAttribute('data-lang', lang);
                            btn.textContent = lang.toUpperCase();
                            
                            // Style the button
                            btn.style.padding = '4px 12px';
                            btn.style.borderRadius = '20px';
                            btn.style.fontFamily = 'var(--font-primary)';
                            btn.style.fontSize = '0.85rem';
                            btn.style.cursor = 'pointer';
                            btn.style.transition = 'all 0.2s';
                            
                            if (lang === defaultLang) {
                                btn.classList.add('active');
                                btn.style.background = 'var(--color-accent)';
                                btn.style.color = 'var(--color-bg)';
                                btn.style.border = 'none';
                            } else {
                                btn.style.background = 'transparent';
                                btn.style.color = 'var(--color-text-muted)';
                                btn.style.border = '1px solid var(--color-accent-dim)';
                            }
                            
                            // Add click listener
                            btn.addEventListener('click', () => {
                                document.querySelectorAll('.lang-btn').forEach(b => {
                                    b.classList.remove('active');
                                    b.style.background = 'transparent';
                                    b.style.color = 'var(--color-text-muted)';
                                    b.style.border = '1px solid var(--color-accent-dim)';
                                });
                                
                                btn.classList.add('active');
                                btn.style.background = 'var(--color-accent)';
                                btn.style.color = 'var(--color-bg)';
                                btn.style.border = 'none';
                                
                                placeIframe.src = currentPlaceBaseUrl + '_' + lang + '.html';
                            });
                            
                            languageToggleContainer.appendChild(btn);
                        });
                    }

                    placeIframe.src = currentPlaceBaseUrl + '_' + (defaultLang || 'pt') + '.html';
                    placesCardsContainer.style.display = 'none';
                    placesViewer.style.display = 'block';
                }
            });
        });

        if (viewerBackBtn) {
            viewerBackBtn.addEventListener('click', () => {
                placesViewer.style.display = 'none';
                placeIframe.src = '';
                placesCardsContainer.style.display = 'grid';
            });
        }

        if (viewerPopoutBtn) {
            viewerPopoutBtn.addEventListener('click', () => {
                if (placeIframe.src) {
                    window.open(placeIframe.src, '_blank');
                }
            });
        }
    }
});
