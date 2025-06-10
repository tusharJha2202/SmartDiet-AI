export const CONFIG = {
    // API Configuration
    API_KEY: 'AIzaSyAeMIxg2rshk2ZWPac4yV8QWhXnnRibgMQ',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    
    // Generation Settings
    GENERATION_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
    },
    
    // UI Settings
    UI: {
        MODAL_ANIMATION_DURATION: 300,
        ERROR_MESSAGE_DURATION: 5000,
        LOADING_MIN_DURATION: 1000,
    },
    
    // PDF Settings
    PDF: {
        MARGIN: 20,
        LINE_HEIGHT: 7,
        MAX_LINES_PER_PAGE: 35,
        FONT_SIZES: {
            TITLE: 20,
            HEADER: 14,
            CONTENT: 12,
            FOOTER: 10
        }
    },
    
    // Form Validation
    VALIDATION: {
        MIN_AGE: 13,
        MAX_AGE: 120,
        MIN_WEIGHT: 30,
        MAX_WEIGHT: 300,
        MIN_HEIGHT_CM: 100,
        MAX_HEIGHT_CM: 250,
        MIN_HEIGHT_FT: 3.3,
        MAX_HEIGHT_FT: 8.2
    },
    
    // Budget Ranges
    BUDGET_RANGES: {
        'budget': '₹100-200',
        'moderate': '₹200-400',
        'premium': '₹400-600',
        'luxury': '₹600+'
    }
};