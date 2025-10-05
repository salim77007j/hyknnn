// ملف الإعدادات العامة للتطبيق
// يمكن تخصيص جميع الإعدادات من هنا

const CONFIG = {
    // إعدادات Supabase - يجب تحديثها
    SUPABASE: {
        URL: 'YOUR_SUPABASE_URL',
        ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
        // إعدادات إضافية
        STORAGE_BUCKET: 'images',
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB بالبايت
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        THUMBNAILS_ENABLED: false // إذا كنت تريد إنشاء مصغرات تلقائياً
    },

    // إعدادات واجهة المستخدم
    UI: {
        IMAGES_PER_PAGE: 12,
        SEARCH_DEBOUNCE_MS: 300,
        NOTIFICATION_DURATION: 5000, // 5 ثوان
        THEME: 'light', // light أو dark
        LANGUAGE: 'ar',
        DIRECTION: 'rtl'
    },

    // إعدادات الأمان
    SECURITY: {
        MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        ENABLE_IMAGE_COMPRESSION: true,
        COMPRESSION_QUALITY: 0.8, // جودة الضغط (0.1 - 1.0)
        MAX_COMMENTS_PER_USER_PER_DAY: 50,
        RATE_LIMIT_UPLOADS_PER_HOUR: 10
    },

    // إعدادات الميزات
    FEATURES: {
        ENABLE_COMMENTS: true,
        ENABLE_FAVORITES: true,
        ENABLE_SHARING: true,
        ENABLE_DOWNLOAD_TRACKING: true,
        ENABLE_VIEW_TRACKING: true,
        ENABLE_TAGS: true,
        ENABLE_CATEGORIES: true,
        ENABLE_USER_PROFILES: true,
        ENABLE_DARK_MODE: true,
        ENABLE_PWA: false // Progressive Web App
    },

    // إعدادات تصنيفات افتراضية
    DEFAULT_CATEGORIES: [
        { name: 'طبيعة', description: 'صور المناظر الطبيعية والحياة البرية', color: '#22C55E' },
        { name: 'أشخاص', description: 'صور شخصية وعائلية', color: '#3B82F6' },
        { name: 'فن', description: 'الأعمال الفنية والإبداعية', color: '#8B5CF6' },
        { name: 'تقنية', description: 'صور تقنية وتكنولوجيا', color: '#F59E0B' },
        { name: 'طعام', description: 'صور الطعام والمشروبات', color: '#EF4444' },
        { name: 'سفر', description: 'صور السفر والرحلات', color: '#06B6D4' },
        { name: 'رياضة', description: 'صور رياضية', color: '#10B981' },
        { name: 'منوع', description: 'صور متنوعة', color: '#6B7280' }
    ],

    // إعدادات المشاركة
    SHARING: {
        ENABLE_SOCIAL_SHARING: true,
        SOCIAL_PLATFORMS: ['facebook', 'twitter', 'whatsapp', 'telegram'],
        OG_TITLE: 'موقع مشاركة الصور',
        OG_DESCRIPTION: 'شارك صورك واستكشف إبداعات الآخرين',
        OG_IMAGE: '/assets/og-image.jpg'
    },

    // إعدادات SEO
    SEO: {
        SITE_NAME: 'موقع مشاركة الصور',
        SITE_DESCRIPTION: 'منصة لمشاركة الصور واستكشاف الإبداعات',
        SITE_KEYWORDS: 'صور، مشاركة، تصوير، فن، إبداع',
        SITE_AUTHOR: 'MiniMax Agent',
        ENABLE_SITEMAP: true,
        ENABLE_ROBOTS_TXT: true
    },

    // إعدادات التحليلات (اختيارية)
    ANALYTICS: {
        ENABLE_ANALYTICS: false,
        GOOGLE_ANALYTICS_ID: '', // GA4 Measurement ID
        ENABLE_USER_TRACKING: false,
        TRACK_PAGE_VIEWS: true,
        TRACK_UPLOADS: true,
        TRACK_DOWNLOADS: true
    },

    // إعدادات التخزين المؤقت
    CACHE: {
        ENABLE_SERVICE_WORKER: false,
        CACHE_IMAGES: true,
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 ساعة
        OFFLINE_MODE: false
    },

    // إعدادات التطوير
    DEBUG: {
        ENABLE_CONSOLE_LOGS: true,
        ENABLE_ERROR_REPORTING: false,
        SHOW_DEBUG_INFO: false,
        MOCK_DATA: false // استخدام بيانات وهمية للتطوير
    }
};

// دالة التحقق من صحة الإعدادات
function validateConfig() {
    const errors = [];

    // التحقق من إعدادات Supabase
    if (CONFIG.SUPABASE.URL === 'YOUR_SUPABASE_URL') {
        errors.push('يجب تحديث SUPABASE_URL في ملف config.js');
    }

    if (CONFIG.SUPABASE.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        errors.push('يجب تحديث SUPABASE_ANON_KEY في ملف config.js');
    }

    // التحقق من أحجام الملفات
    if (CONFIG.SUPABASE.MAX_FILE_SIZE !== CONFIG.SECURITY.MAX_UPLOAD_SIZE) {
        console.warn('تحذير: أحجام الملفات المسموحة غير متطابقة');
    }

    // عرض الأخطاء
    if (errors.length > 0) {
        console.error('أخطاء في الإعدادات:', errors);
        return false;
    }

    console.log('✅ تم التحقق من الإعدادات بنجاح');
    return true;
}

// دالة لتحديث إعدادات معينة
function updateConfig(section, key, value) {
    if (CONFIG[section] && CONFIG[section].hasOwnProperty(key)) {
        CONFIG[section][key] = value;
        localStorage.setItem(`config_${section}_${key}`, JSON.stringify(value));
        console.log(`تم تحديث ${section}.${key} إلى:`, value);
    } else {
        console.error(`الإعداد ${section}.${key} غير موجود`);
    }
}

// دالة لتحميل الإعدادات المحفوظة
function loadSavedConfig() {
    Object.keys(CONFIG).forEach(section => {
        Object.keys(CONFIG[section]).forEach(key => {
            const saved = localStorage.getItem(`config_${section}_${key}`);
            if (saved) {
                try {
                    CONFIG[section][key] = JSON.parse(saved);
                } catch (e) {
                    console.warn(`خطأ في تحميل الإعداد ${section}.${key}`);
                }
            }
        });
    });
}

// دالة لإعادة تعيين الإعدادات الافتراضية
function resetConfigToDefaults() {
    localStorage.clear();
    location.reload();
}

// دالة لتصدير الإعدادات
function exportConfig() {
    const configData = JSON.stringify(CONFIG, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    
    URL.revokeObjectURL(url);
}

// دالة لاستيراد الإعدادات
function importConfig(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedConfig = JSON.parse(e.target.result);
            Object.assign(CONFIG, importedConfig);
            console.log('تم استيراد الإعدادات بنجاح');
        } catch (error) {
            console.error('خطأ في استيراد الإعدادات:', error);
        }
    };
    reader.readAsText(file);
}

// دالة للحصول على إعداد معين
function getConfig(path) {
    const parts = path.split('.');
    let current = CONFIG;
    
    for (const part of parts) {
        if (current[part] === undefined) {
            return null;
        }
        current = current[part];
    }
    
    return current;
}

// دالة لتطبيق الثيم
function applyTheme() {
    const theme = getConfig('UI.THEME');
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// دالة لتطبيق اللغة والاتجاه
function applyLanguageSettings() {
    const language = getConfig('UI.LANGUAGE');
    const direction = getConfig('UI.DIRECTION');
    
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
}

// دالة لتهيئة الإعدادات عند تحميل الصفحة
function initializeConfig() {
    loadSavedConfig();
    
    if (!validateConfig()) {
        console.error('فشل في التحقق من الإعدادات');
        return false;
    }
    
    applyTheme();
    applyLanguageSettings();
    
    return true;
}

// إعدادات متقدمة للمطورين
const ADVANCED_CONFIG = {
    // إعدادات قاعدة البيانات
    DATABASE: {
        ENABLE_RLS: true,
        AUTO_VACUUM: true,
        CONNECTION_POOLING: true,
        TIMEOUT: 30000 // 30 ثانية
    },

    // إعدادات الأداء
    PERFORMANCE: {
        ENABLE_LAZY_LOADING: true,
        IMAGE_QUALITY: 'auto', // auto, high, medium, low
        ENABLE_CDN: false,
        CDN_URL: '',
        PRELOAD_IMAGES: 3 // عدد الصور للتحميل المسبق
    },

    // إعدادات الأمان المتقدمة
    ADVANCED_SECURITY: {
        CSRF_PROTECTION: true,
        XSS_PROTECTION: true,
        CONTENT_SECURITY_POLICY: true,
        RATE_LIMITING: true,
        IP_BLACKLIST: [],
        SUSPICIOUS_ACTIVITY_DETECTION: false
    },

    // إعدادات النسخ الاحتياطي
    BACKUP: {
        AUTO_BACKUP: false,
        BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 ساعة
        BACKUP_RETENTION: 7, // 7 أيام
        INCLUDE_IMAGES: false // النسخ الاحتياطي للصور
    }
};

// تصدير الكائنات للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ADVANCED_CONFIG };
} else {
    window.CONFIG = CONFIG;
    window.ADVANCED_CONFIG = ADVANCED_CONFIG;
    window.validateConfig = validateConfig;
    window.updateConfig = updateConfig;
    window.loadSavedConfig = loadSavedConfig;
    window.resetConfigToDefaults = resetConfigToDefaults;
    window.exportConfig = exportConfig;
    window.importConfig = importConfig;
    window.getConfig = getConfig;
    window.initializeConfig = initializeConfig;
}

// تهيئة تلقائية عند تحميل الصفحة
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeConfig();
    });
}