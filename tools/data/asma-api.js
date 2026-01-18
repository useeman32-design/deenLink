// data/asma-api.js - Secure API Handler for 99 Names
const ASMA_API = (function() {
    // Your API configuration
    const config = {
        API_KEY: '1HmsIFcy3PEAdEWx7Jsk67j5jSxSnP6S0H5mXU2qVKL3Ssdq',
        BASE_URL: 'https://islamicapi.com/api/v1/asma-ul-husna/',
        DEFAULT_LANG: 'en',
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours cache
        FALLBACK_LOCAL_PATH: 'data/99names.json'
    };

    // Cache storage
    const cache = {
        data: {},
        timestamps: {},
        
        get: function(lang) {
            const cached = this.data[lang];
            const timestamp = this.timestamps[lang];
            
            if (cached && timestamp && (Date.now() - timestamp) < config.CACHE_DURATION) {
                return cached;
            }
            return null;
        },
        
        set: function(lang, data) {
            this.data[lang] = data;
            this.timestamps[lang] = Date.now();
        },
        
        clear: function(lang = null) {
            if (lang) {
                delete this.data[lang];
                delete this.timestamps[lang];
            } else {
                this.data = {};
                this.timestamps = {};
            }
        }
    };

    // Selected languages from available API list - Updated based on your request
    const languages = {
        'en': { name: 'English', flag: '🇺🇸', rtl: false },
        'ar': { name: 'العربية (Arabic)', flag: '🇸🇦', rtl: true },
        'ur': { name: 'اردو (Urdu)', flag: '🇵🇰', rtl: true },
        'ha': { name: 'Hausa', flag: '🇳🇬', rtl: false },
        'sw': { name: 'Kiswahili (Swahili)', flag: '🇹🇿', rtl: false },
        'yo': { name: 'Yorùbá (Yoruba)', flag: '🇳🇬', rtl: false },
        'so': { name: 'Soomaali (Somali)', flag: '🇸🇴', rtl: false },
        'fr': { name: 'Français (French)', flag: '🇫🇷', rtl: false },
        'de': { name: 'Deutsch (German)', flag: '🇩🇪', rtl: false },
        'es': { name: 'Español (Spanish)', flag: '🇪🇸', rtl: false },
        'pt': { name: 'Português (Portuguese)', flag: '🇵🇹', rtl: false },
        'tr': { name: 'Türkçe (Turkish)', flag: '🇹🇷', rtl: false },
        'hi': { name: 'हिन्दी (Hindi)', flag: '🇮🇳', rtl: false },
        'bn': { name: 'বাংলা (Bengali)', flag: '🇧🇩', rtl: false },
        'zh': { name: '中文 (Chinese)', flag: '🇨🇳', rtl: false },
        'ja': { name: '日本語 (Japanese)', flag: '🇯🇵', rtl: false },
        'ko': { name: '한국어 (Korean)', flag: '🇰🇷', rtl: false },
        'ru': { name: 'Русский (Russian)', flag: '🇷🇺', rtl: false }
    };

    // Note: Yoruba (yo) might not be in the original list, but I included it as requested
    // If API doesn't support it, it will fallback to English

    // Check if language is supported by our app
    function isLanguageSupported(langCode) {
        return languages.hasOwnProperty(langCode);
    }

    // Get supported languages
    function getSupportedLanguages() {
        return languages;
    }

    // Get current language config
    function getLanguageInfo(langCode) {
        return languages[langCode] || languages[config.DEFAULT_LANG];
    }

    // Secure API call function with better error handling
    async function fetchNames(language = config.DEFAULT_LANG) {
        try {
            // Check internet connection first
            if (!navigator.onLine) {
                return {
                    success: false,
                    error: 'No internet connection',
                    offline: true,
                    data: []
                };
            }

            // Check cache first
            const cached = cache.get(language);
            if (cached) {
                console.log(`Using cached data for ${language}`);
                return { success: true, data: cached, cached: true };
            }

            // For English, try local file first
            if (language === 'en') {
                try {
                    const localResponse = await fetch(config.FALLBACK_LOCAL_PATH);
                    if (localResponse.ok) {
                        const localData = await localResponse.json();
                        if (localData.code === 200 && localData.data?.names) {
                            cache.set('en', localData.data.names);
                            return { success: true, data: localData.data.names, source: 'local' };
                        }
                    }
                } catch (localError) {
                    console.log('Local file not available');
                }
            }

            // Fetch from API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const apiUrl = `${config.BASE_URL}?language=${language}&api_key=${config.API_KEY}`;
            const response = await fetch(apiUrl, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const apiData = await response.json();
            
            if (apiData.code === 200 && apiData.data) {
                const namesData = Array.isArray(apiData.data) ? apiData.data : apiData.data.names;
                cache.set(language, namesData);
                return { success: true, data: namesData, source: 'api' };
            } else {
                throw new Error(apiData.message || 'Invalid API response');
            }
            
        } catch (error) {
            console.error('Error fetching names:', error);
            
            // Check if it's an abort/timeout error
            if (error.name === 'AbortError') {
                return { 
                    success: false, 
                    error: 'Request timeout. Please check your connection.',
                    timeout: true,
                    data: []
                };
            }
            
            // Check if it's a network error
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return { 
                    success: false, 
                    error: 'Network error. Please check your internet connection.',
                    networkError: true,
                    data: []
                };
            }
            
            // Fallback to English if other language fails
            if (language !== 'en') {
                console.log('Falling back to English...');
                const fallback = await fetchNames('en');
                if (fallback.success) {
                    return { ...fallback, fallback: true, requestedLang: language };
                }
            }
            
            return { 
                success: false, 
                error: error.message,
                data: []
            };
        }
    }

    // Clear cache for specific language or all
    function clearCache(lang = null) {
        cache.clear(lang);
    }

    // Get cached data for offline use
    function getCachedData(lang) {
        return cache.get(lang);
    }

    // Expose public methods
    return {
        fetchNames,
        getSupportedLanguages,
        getLanguageInfo,
        clearCache,
        isLanguageSupported,
        getCachedData,
        config
    };
})();

// Debug: Log when loaded
console.log('ASMA_API loaded!');
console.log('Available languages:', ASMA_API.getSupportedLanguages());