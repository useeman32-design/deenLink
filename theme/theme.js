// theme.js - Universal Dark/Light Theme Management

// ============================================
// THEME MANAGEMENT SYSTEM
// ============================================

class ThemeManager {
    constructor() {
        this.isDarkMode = false;
        this.init();
    }

    // Initialize theme manager
    init() {
        this.checkAndApplyTheme();
        this.setupThemeListener();
        this.addGlobalTransitions();
    }

    // Check localStorage and apply theme
    checkAndApplyTheme() {
        // Get theme preference from localStorage
        const savedTheme = localStorage.getItem('isDarkMode');
        const body = document.body;
        
        // Update state
        this.isDarkMode = savedTheme === 'true';
        
        // Apply theme to body
        if (this.isDarkMode) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
        
        // Update any modals or popups
        this.updateDynamicElements();
        
        console.log(`Theme applied: ${this.isDarkMode ? 'Dark' : 'Light'}`);
    }

    // Update dynamic elements (modals, popups, etc.)
    updateDynamicElements() {
        // Update calculator modal if it exists
        const calculatorModal = document.querySelector('.zakat-calculator-modal');
        if (calculatorModal) {
            if (this.isDarkMode) {
                calculatorModal.classList.add('dark-theme');
                calculatorModal.classList.remove('light-theme');
            } else {
                calculatorModal.classList.add('light-theme');
                calculatorModal.classList.remove('dark-theme');
            }
        }

        // Update video modal if it exists
        const videoModal = document.querySelector('.video-modal');
        if (videoModal) {
            if (this.isDarkMode) {
                videoModal.classList.add('dark-theme');
                videoModal.classList.remove('light-theme');
            } else {
                videoModal.classList.add('light-theme');
                videoModal.classList.remove('dark-theme');
            }
        }

        // Update any other dynamic containers
        document.querySelectorAll('[data-theme-container]').forEach(container => {
            if (this.isDarkMode) {
                container.classList.add('dark-theme');
                container.classList.remove('light-theme');
            } else {
                container.classList.add('light-theme');
                container.classList.remove('dark-theme');
            }
        });
    }

    // Listen for theme changes
    setupThemeListener() {
        // Listen for storage events (when other pages change theme)
        window.addEventListener('storage', (event) => {
            if (event.key === 'isDarkMode') {
                this.checkAndApplyTheme();
            }
        });
        
        // Also check periodically (in case localStorage is changed from same page)
        setInterval(() => {
            this.checkAndApplyTheme();
        }, 1000);

        // Listen for custom theme change events
        document.addEventListener('themeChanged', (event) => {
            this.isDarkMode = event.detail.isDarkMode;
            this.checkAndApplyTheme();
        });
    }

    // Add global CSS transitions for theme switching
    addGlobalTransitions() {
        // This is handled by CSS, but we can add dynamic classes if needed
        if (!document.querySelector('#theme-transition-styles')) {
            const style = document.createElement('style');
            style.id = 'theme-transition-styles';
            style.textContent = `
                /* These transitions are now in theme.css */
            `;
            document.head.appendChild(style);
        }
    }

    // Toggle theme (if you want to add a toggle button later)
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('isDarkMode', this.isDarkMode);
        this.checkAndApplyTheme();
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { isDarkMode: this.isDarkMode }
        }));
    }

    // Get current theme
    getCurrentTheme() {
        return this.isDarkMode ? 'dark' : 'light';
    }

    // Check if dark mode is enabled
    isDarkModeEnabled() {
        return this.isDarkMode;
    }

    // Force theme (for testing or specific pages)
    setTheme(isDark) {
        this.isDarkMode = isDark;
        localStorage.setItem('isDarkMode', isDark);
        this.checkAndApplyTheme();
        
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { isDarkMode: isDark }
        }));
    }
}

// ============================================
// PAGE TRANSITION LOADER (Optional - if needed)
// ============================================

class PageLoader {
    constructor() {
        this.loader = document.getElementById('pageLoader');
        this.pageContent = document.getElementById('pageContent');
        this.init();
    }

    init() {
        if (!this.loader) return;
        
        // Show loader on page transitions
        this.setupPageTransitions();
        
        // Hide loader when page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => this.hide(), 100);
        });

        // Initial hide of loader
        setTimeout(() => {
            if (document.readyState === 'complete') {
                this.hide();
            }
        }, 100);
    }

    show(message = 'Loading...') {
        if (this.loader) {
            const loaderText = this.loader.querySelector('.loader-text');
            if (loaderText) {
                loaderText.textContent = message;
            }
            this.loader.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.loader) {
            this.loader.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        if (this.pageContent) {
            this.pageContent.style.opacity = '1';
        }
    }

    setupPageTransitions() {
        // Intercept link clicks for smooth transitions
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            
            if (!anchor) return;
            
            const href = anchor.getAttribute('href');
            
            // Skip if no href or external links
            if (!href || 
                href.startsWith('javascript:') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') ||
                href.startsWith('#') ||
                anchor.getAttribute('target') === '_blank') {
                return;
            }
            
            // Skip if external link
            if (href.startsWith('http') && !href.includes(window.location.origin)) {
                return;
            }
            
            // Check if same page
            if (this.isSamePage(href, window.location.href)) {
                return;
            }
            
            // Prevent default navigation
            e.preventDefault();
            
            // Show loader
            this.show();
            
            // Fade out current content
            if (this.pageContent) {
                this.pageContent.style.opacity = '0';
                this.pageContent.style.transition = 'opacity 0.3s ease';
            }
            
            // Navigate after delay
            setTimeout(() => {
                window.location.href = href;
            }, 1000);
        });
    }

    isSamePage(href, currentUrl) {
        // Get current page path without domain
        const currentPath = window.location.pathname;
        
        // Handle different href formats
        if (href === '' || href === '#' || href === './' || href === '/') {
            return currentPath.endsWith('/') || 
                   currentPath.endsWith('index.html') || 
                   currentPath === '/';
        }
        
        // Remove query strings and hashes for comparison
        const cleanHref = href.split('?')[0].split('#')[0];
        const cleanCurrentPath = currentPath.split('?')[0].split('#')[0];
        
        // Normalize paths
        const normalizePath = (path) => {
            path = path.replace(/^\/|\/$/g, '');
            path = path.replace(/index\.html$/i, '');
            return path;
        };
        
        const normalizedHref = normalizePath(cleanHref);
        const normalizedCurrent = normalizePath(cleanCurrentPath);
        
        return normalizedHref === normalizedCurrent;
    }
}

// ============================================
// NOTIFICATION SYSTEM (Optional - if needed)
// ============================================

class NotificationSystem {
    constructor() {
        this.notificationContainer = null;
        this.init();
    }

    init() {
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notifications-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(this.notificationContainer);
    }

    show(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background-color: ${type === 'success' ? 'var(--success-green)' : 'var(--error-red)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-weight: 500;
            animation: slideIn 0.3s ease forwards;
            transform: translateX(100%);
            opacity: 0;
        `;
        
        notification.textContent = message;
        this.notificationContainer.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Add CSS for animations if not already present
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================

// Create global instances
window.themeManager = new ThemeManager();
window.pageLoader = new PageLoader();
window.notifications = new NotificationSystem();

// Make theme functions globally available
window.toggleTheme = () => window.themeManager.toggleTheme();
window.setTheme = (isDark) => window.themeManager.setTheme(isDark);
window.getCurrentTheme = () => window.themeManager.getCurrentTheme();
window.isDarkMode = () => window.themeManager.isDarkModeEnabled();

// Show notification function
window.showNotification = (message, type = 'success', duration = 3000) => {
    window.notifications.show(message, type, duration);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Theme system initialized');
    
    // You can add page-specific initialization here
    // Example: Initialize specific page components if they exist
    if (document.getElementById('themeToggle')) {
        document.getElementById('themeToggle').addEventListener('click', () => {
            window.themeManager.toggleTheme();
        });
    }
});

// Also initialize immediately (in case DOM is already loaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager.init();
    });
} else {
    window.themeManager.init();
}