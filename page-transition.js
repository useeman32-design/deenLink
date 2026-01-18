// Universal Page Transition System for Islamic App
class PageTransition {
    constructor() {
        this.isTransitioning = false;
        this.pendingNavigation = null;
        this.loaderOverlay = document.getElementById('loaderOverlay');
        this.pageContent = document.getElementById('pageContent');
        this.body = document.body;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.attachLinkListeners();
        this.handleBackButton();
        this.hideLoaderOnLoad();
    }

    showLoader() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.body.classList.add('loader-active');
        this.loaderOverlay.classList.add('active');
        
        // Disable interactive elements during transition
        document.querySelectorAll('button, a, .nav-item, .feed-tab, .video-card, .quick-button, .section-card, .activity-item')
            .forEach(el => el.style.pointerEvents = 'none');
    }

    hideLoader() {
        this.loaderOverlay.classList.remove('active');
        this.body.classList.remove('loader-active');
        
        // Re-enable interactive elements
        document.querySelectorAll('button, a, .nav-item, .feed-tab, .video-card, .quick-button, .section-card, .activity-item')
            .forEach(el => el.style.pointerEvents = '');
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    attachLinkListeners() {
        // Intercept all link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            
            if (!link) return;
            
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');
            
            // Skip if no href or target="_blank" or JavaScript links
            if (!href || href === '#' || href.startsWith('javascript:') || target === '_blank') {
                return;
            }
            
            e.preventDefault();
            this.navigateTo(href);
        });

        // Handle quick button clicks
        document.addEventListener('click', (e) => {
            const quickBtn = e.target.closest('.quick-button');
            if (quickBtn && quickBtn.getAttribute('data-page')) {
                e.preventDefault();
                const page = quickBtn.getAttribute('data-page');
                
                if (page === 'deenai') {
                    setTimeout(() => {
                        alert("🤖 Deen AI Assistant\n\nWelcome to Deen AI! How can I help you with Islamic questions today?");
                    }, 800);
                } else {
                    this.navigateTo(`${page}/index.html`);
                }
            }
        });
    }

    navigateTo(url) {
        if (this.isTransitioning) return;
        
        this.showLoader();
        this.pendingNavigation = url;
        
        // Store current scroll position
        sessionStorage.setItem('scrollPosition', window.scrollY);
        
        // Simulate network delay (800-1200ms)
        const simulatedDelay = 800 + Math.random() * 400;
        
        setTimeout(() => {
            this.simulatePageLoad(url);
        }, simulatedDelay);
    }

    simulatePageLoad(url) {
        console.log(`Navigating to: ${url}`);
        
        // Update page title based on URL
        const pageName = this.getPageNameFromUrl(url);
        document.title = `Islamic App | ${pageName}`;
        
        // Update active nav item
        this.updateActiveNavItem(url);
        
        // Simulate content loading
        setTimeout(() => {
            this.hideLoader();
            
            // Trigger page fade-in animation
            if (this.pageContent) {
                this.pageContent.style.opacity = '0';
                this.pageContent.style.animation = 'none';
                setTimeout(() => {
                    this.pageContent.style.animation = 'pageFadeIn 0.8s ease-out forwards';
                }, 10);
            }
        }, 600);
    }

    getPageNameFromUrl(url) {
        const pageMap = {
            'index.html': 'Home',
            '../index.html': 'Home',
            'quranHadith/index.html': 'Quran & Hadith',
            'quran-hadith': 'Quran & Hadith',
            'tools/index.html': 'Worship Tools',
            'worship': 'Worship Tools',
            'learning/index.html': 'Learning',
            'profile/index.html': 'Profile',
            'dua': 'Dua',
            'athkar': 'Athkar',
            'deenai': 'Deen AI',
            'donation': 'Donation & Charity',
            'tasbih': 'Tasbih',
            'calendar': 'Calendar',
            'hadith': 'Hadith',
            'names': 'Names of Allah',
            'quiz': 'Quiz',
            '#': 'Home'
        };
        
        // Try exact match first
        if (pageMap[url]) return pageMap[url];
        
        // Try to extract page name from path
        const pathParts = url.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const nameWithoutExt = lastPart.replace('.html', '');
        
        return pageMap[nameWithoutExt] || 
               nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1) || 
               'Page';
    }

    updateActiveNavItem(url) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const itemHref = item.getAttribute('href');
            
            if ((url === '#' && itemHref === '#') || 
                (url !== '#' && itemHref === url) ||
                (url.includes('index.html') && itemHref && itemHref.includes(url))) {
                item.classList.add('active');
            }
        });
    }

    handleBackButton() {
        window.addEventListener('popstate', () => {
            if (!this.isTransitioning) {
                this.showLoader();
                setTimeout(() => {
                    this.hideLoader();
                }, 1000);
            }
        });
    }

    hideLoaderOnLoad() {
        // Ensure loader is hidden on initial page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (this.loaderOverlay.classList.contains('active')) {
                    this.loaderOverlay.classList.remove('active');
                }
                this.body.classList.remove('loader-active');
            }, 500);
        });
    }
}

// Theme Management System
class ThemeManager {
    constructor() {
        this.isDarkMode = false;
        this.body = document.body;
        this.themeToggle = document.getElementById('themeToggle');
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupThemeToggle();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('isDarkMode');
        this.isDarkMode = savedTheme === 'true';
        
        if (this.isDarkMode) {
            this.body.classList.remove('light-theme');
            this.body.classList.add('dark-theme');
            if (this.themeToggle) {
                this.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light</span>';
            }
            
            // Ensure text stays white in dark mode for top sections
            this.adjustDarkModeElements();
        } else {
            this.body.classList.remove('dark-theme');
            this.body.classList.add('light-theme');
            if (this.themeToggle) {
                this.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark</span>';
            }
        }
    }

    setupThemeToggle() {
        if (!this.themeToggle) return;
        
        this.themeToggle.addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;
            
            if (this.isDarkMode) {
                this.body.classList.remove('light-theme');
                this.body.classList.add('dark-theme');
                this.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light</span>';
            } else {
                this.body.classList.remove('dark-theme');
                this.body.classList.add('light-theme');
                this.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark</span>';
            }
            
            localStorage.setItem('isDarkMode', this.isDarkMode);
            this.adjustDarkModeElements();
        });
    }

    adjustDarkModeElements() {
        const elements = document.querySelectorAll('.location-btn, .date-info, .islamic-date, .gregorian-date, .next-prayer, .countdown-timer, .page-subtitle, .page-subtitle h1, .page-subtitle p');
        
        elements.forEach(el => {
            if (this.isDarkMode) {
                el.style.color = 'white';
            } else {
                el.style.color = '';
            }
        });
    }
}

// Inbox System (simplified, no notifications)
class InboxSystem {
    constructor() {
        this.unreadMessages = 3;
        this.inboxButton = document.getElementById('inboxButton');
        this.inboxBadge = document.getElementById('inboxBadge');
        this.pageTransition = null;
        this.init();
    }

    init() {
        if (this.inboxButton && this.inboxBadge) {
            this.setupInboxButton();
        }
    }

    setPageTransition(pageTransition) {
        this.pageTransition = pageTransition;
    }

    setupInboxButton() {
        this.inboxButton.addEventListener('click', () => {
            this.unreadMessages = 0;
            this.inboxBadge.textContent = '0';
            this.inboxBadge.style.display = 'none';
            
            if (this.pageTransition) {
                this.pageTransition.navigateTo('messages/index.html');
            } else {
                alert('📨 Messages\n\nYou have no unread messages.');
            }
        });
    }

    updateBadge(count) {
        this.unreadMessages = count;
        if (this.inboxBadge) {
            this.inboxBadge.textContent = count;
            this.inboxBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// Initialize all systems when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Page Transition System
    const pageTransition = new PageTransition();
    
    // Initialize Theme Manager
    const themeManager = new ThemeManager();
    
    // Initialize Inbox System
    const inboxSystem = new InboxSystem();
    inboxSystem.setPageTransition(pageTransition);
    
    // Make page transition globally accessible for other scripts
    window.pageTransition = pageTransition;
    window.themeManager = themeManager;
    window.inboxSystem = inboxSystem;
});