// استخدام الإعدادات من ملف config.js
let supabase = null;

// التحقق من وجود ملف الإعدادات وتهيئة Supabase
function initializeSupabase() {
    if (typeof CONFIG === 'undefined') {
        console.error('ملف الإعدادات (config.js) غير محمل');
        showNotification('خطأ: ملف الإعدادات غير موجود', 'error');
        return false;
    }

    if (!validateConfig()) {
        showNotification('خطأ: يجب إعداد اتصال Supabase في ملف config.js', 'error');
        return false;
    }

    // إنشاء العميل باستخدام الإعدادات
    supabase = window.supabase.createClient(
        CONFIG.SUPABASE.URL, 
        CONFIG.SUPABASE.ANON_KEY
    );

    console.log('✅ تم تهيئة Supabase بنجاح');
    return true;
}

// متغيرات عامة
let currentUser = null;
let currentImages = [];
let currentPage = 1;
let selectedFiles = [];

// الحصول على الإعدادات من ملف config.js
const IMAGES_PER_PAGE = getConfig('UI.IMAGES_PER_PAGE') || 12;
const MAX_FILE_SIZE = getConfig('SUPABASE.MAX_FILE_SIZE') || 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = getConfig('SUPABASE.ALLOWED_FILE_TYPES') || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const SEARCH_DEBOUNCE_MS = getConfig('UI.SEARCH_DEBOUNCE_MS') || 300;
const NOTIFICATION_DURATION = getConfig('UI.NOTIFICATION_DURATION') || 5000;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // تهيئة Supabase أولاً
        if (!initializeSupabase()) {
            return;
        }

        // تحميل التصنيفات
        await loadCategories();
        
        // تحميل الصور
        await loadImages();
        
        // تحقق من حالة المستخدم
        await checkUserSession();
        
        // ربط الأحداث
        bindEvents();
        
        console.log('✅ تم تحميل التطبيق بنجاح');
        showNotification('مرحباً بك! تم تحميل الموقع بنجاح', 'success');

    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        showNotification('خطأ في تحميل التطبيق: ' + error.message, 'error');
    }
});

// تحقق من جلسة المستخدم
async function checkUserSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
    }
}

// تحديث واجهة المستخدم للمستخدم المسجل
function updateUIForLoggedInUser() {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
    document.getElementById('user-email').textContent = currentUser.email;
    document.querySelector('[data-section="my-images"]').style.display = 'block';
    document.getElementById('comment-form').style.display = 'block';
    document.getElementById('login-prompt').style.display = 'none';
}

// تحديث واجهة المستخدم للمستخدم غير المسجل
function updateUIForLoggedOutUser() {
    document.getElementById('auth-buttons').style.display = 'flex';
    document.getElementById('user-menu').style.display = 'none';
    document.querySelector('[data-section="my-images"]').style.display = 'none';
    document.getElementById('comment-form').style.display = 'none';
    document.getElementById('login-prompt').style.display = 'block';
}

// ربط الأحداث
function bindEvents() {
    // أحداث التنقل
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });

    // أحداث المصادقة
    document.getElementById('login-btn').addEventListener('click', () => showAuthModal('login'));
    document.getElementById('register-btn').addEventListener('click', () => showAuthModal('register'));
    document.getElementById('logout-btn').addEventListener('click', signOut);

    // أحداث المودال
    document.getElementById('close-modal').addEventListener('click', closeImageModal);
    document.getElementById('close-auth-modal').addEventListener('click', closeAuthModal);

    // أحداث البحث والفلترة
    document.getElementById('search-input').addEventListener('input', debounce(filterImages, SEARCH_DEBOUNCE_MS));
    document.getElementById('category-filter').addEventListener('change', filterImages);
    document.getElementById('sort-filter').addEventListener('change', filterImages);

    // أحداث رفع الصور
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // أحداث النماذج
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    document.getElementById('image-form').addEventListener('submit', handleImageUpload);
    
    // أحداث إضافية
    document.getElementById('cancel-upload').addEventListener('click', cancelUpload);
    document.getElementById('load-more-btn').addEventListener('click', loadMoreImages);

    // إغلاق المودال بالنقر خارجه
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// عرض قسم معين
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // تحميل بيانات القسم
    if (sectionName === 'my-images' && currentUser) {
        loadUserImages();
    } else if (sectionName === 'categories') {
        loadCategoriesPage();
    }
}

// تحميل التصنيفات
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) throw error;

        const categoryFilter = document.getElementById('category-filter');
        const imageCategory = document.getElementById('image-category');
        
        // مسح التصنيفات الموجودة
        categoryFilter.innerHTML = '<option value="">جميع التصنيفات</option>';
        imageCategory.innerHTML = '<option value="">اختر تصنيف</option>';

        data.forEach(category => {
            categoryFilter.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            imageCategory.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });

    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
        showNotification('خطأ في تحميل التصنيفات', 'error');
    }
}

// تحميل الصور
async function loadImages(page = 1, reset = true) {
    try {
        if (reset) {
            document.getElementById('loading').style.display = 'block';
            currentImages = [];
            currentPage = 1;
        }

        const startIndex = (page - 1) * IMAGES_PER_PAGE;
        
        let query = supabase
            .from('images')
            .select(`
                *,
                categories(name, color),
                profiles:user_id(email)
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(startIndex, startIndex + IMAGES_PER_PAGE - 1);

        // تطبيق الفلاتر
        const categoryFilter = document.getElementById('category-filter').value;
        const searchQuery = document.getElementById('search-input').value.trim();
        const sortFilter = document.getElementById('sort-filter').value;

        if (categoryFilter) {
            query = query.eq('category_id', categoryFilter);
        }

        if (searchQuery) {
            query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        if (sortFilter !== 'created_at') {
            query = query.order(sortFilter, { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;

        if (reset) {
            currentImages = data;
        } else {
            currentImages = [...currentImages, ...data];
        }

        renderImages();
        
        // إظهار/إخفاء زر تحميل المزيد
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (data.length === IMAGES_PER_PAGE) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }

        document.getElementById('loading').style.display = 'none';

    } catch (error) {
        console.error('خطأ في تحميل الصور:', error);
        showNotification('خطأ في تحميل الصور', 'error');
        document.getElementById('loading').style.display = 'none';
    }
}

// عرض الصور
function renderImages() {
    const grid = document.getElementById('images-grid');
    const loading = document.getElementById('loading');
    
    if (currentImages.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-images"></i>
                <h3>لا توجد صور</h3>
                <p>لم يتم العثور على صور مطابقة للبحث</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = currentImages.map(image => `
        <div class="image-card fade-in" onclick="openImageModal('${image.id}')">
            <img src="${getImageUrl(image.file_path)}" alt="${image.title}" class="image-card-image" loading="lazy">
            <div class="image-card-content">
                <h3 class="image-card-title">${image.title}</h3>
                <p class="image-card-description">${image.description || 'لا يوجد وصف'}</p>
                <div class="image-card-meta">
                    <span class="image-card-category" style="background-color: ${image.categories?.color || '#3b82f6'}20; color: ${image.categories?.color || '#3b82f6'}">
                        ${image.categories?.name || 'بدون تصنيف'}
                    </span>
                    <span>
                        <i class="fas fa-eye"></i> ${image.view_count}
                    </span>
                </div>
            </div>
        </div>
    `).join('') + loading.outerHTML;
}

// الحصول على رابط الصورة
function getImageUrl(filePath) {
    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
}

// فتح مودال عرض الصورة
async function openImageModal(imageId) {
    try {
        // زيادة عدد المشاهدات
        await supabase.rpc('increment_view_count', { image_uuid: imageId });

        // جلب تفاصيل الصورة
        const { data: image, error } = await supabase
            .from('images')
            .select(`
                *,
                categories(name, color),
                profiles:user_id(email)
            `)
            .eq('id', imageId)
            .single();

        if (error) throw error;

        // تحديث المودال
        document.getElementById('modal-image').src = getImageUrl(image.file_path);
        document.getElementById('modal-title').textContent = image.title;
        document.getElementById('modal-description').textContent = image.description || 'لا يوجد وصف';
        document.getElementById('modal-views').textContent = image.view_count + 1;
        document.getElementById('modal-downloads').textContent = image.download_count;
        document.getElementById('modal-date').textContent = new Date(image.created_at).toLocaleDateString('ar');

        // تحميل العلامات
        await loadImageTags(imageId);
        
        // تحميل التعليقات
        await loadComments(imageId);

        // إعداد أزرار الإجراءات
        document.getElementById('download-btn').onclick = () => downloadImage(image);
        document.getElementById('share-btn').onclick = () => shareImage(image);
        document.getElementById('favorite-btn').onclick = () => toggleFavorite(imageId);

        // إعداد نموذج التعليق
        document.getElementById('submit-comment').onclick = () => addComment(imageId);

        // إظهار المودال
        document.getElementById('image-modal').style.display = 'block';

    } catch (error) {
        console.error('خطأ في فتح الصورة:', error);
        showNotification('خطأ في تحميل تفاصيل الصورة', 'error');
    }
}

// تحميل علامات الصورة
async function loadImageTags(imageId) {
    try {
        const { data, error } = await supabase
            .from('image_tags')
            .select('tags(name)')
            .eq('image_id', imageId);

        if (error) throw error;

        const tagsContainer = document.getElementById('modal-tags');
        if (data.length > 0) {
            tagsContainer.innerHTML = data.map(item => 
                `<span class="tag">${item.tags.name}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '<span class="tag">لا توجد علامات</span>';
        }

    } catch (error) {
        console.error('خطأ في تحميل العلامات:', error);
    }
}

// تحميل التعليقات
async function loadComments(imageId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id(email)
            `)
            .eq('image_id', imageId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const commentsList = document.getElementById('comments-list');
        if (data.length > 0) {
            commentsList.innerHTML = data.map(comment => `
                <div class="comment">
                    <div class="comment-author">${comment.profiles?.email || 'مستخدم'}</div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-date">${new Date(comment.created_at).toLocaleDateString('ar')}</div>
                </div>
            `).join('');
        } else {
            commentsList.innerHTML = '<p>لا توجد تعليقات بعد</p>';
        }

    } catch (error) {
        console.error('خطأ في تحميل التعليقات:', error);
    }
}

// إضافة تعليق
async function addComment(imageId) {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول لإضافة تعليق', 'error');
        return;
    }

    const commentText = document.getElementById('comment-text').value.trim();
    if (!commentText) {
        showNotification('يرجى كتابة تعليق', 'error');
        return;
    }

    try {
        const { error } = await supabase
            .from('comments')
            .insert({
                image_id: imageId,
                user_id: currentUser.id,
                content: commentText
            });

        if (error) throw error;

        document.getElementById('comment-text').value = '';
        await loadComments(imageId);
        showNotification('تم إضافة التعليق بنجاح', 'success');

    } catch (error) {
        console.error('خطأ في إضافة التعليق:', error);
        showNotification('خطأ في إضافة التعليق', 'error');
    }
}

// تحميل الصورة
async function downloadImage(image) {
    try {
        // زيادة عدد التحميلات
        await supabase.rpc('increment_download_count', { image_uuid: image.id });

        // تحميل الملف
        const imageUrl = getImageUrl(image.file_path);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('تم تحميل الصورة بنجاح', 'success');

    } catch (error) {
        console.error('خطأ في تحميل الصورة:', error);
        showNotification('خطأ في تحميل الصورة', 'error');
    }
}

// مشاركة الصورة
function shareImage(image) {
    const url = `${window.location.origin}?image=${image.id}`;
    
    if (navigator.share) {
        navigator.share({
            title: image.title,
            text: image.description,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('تم نسخ رابط الصورة', 'success');
        });
    }
}

// إدارة الرفع
function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول لرفع الصور', 'error');
        showAuthModal('login');
        return;
    }

    const validFiles = files.filter(file => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            showNotification(`${file.name} نوع ملف غير مدعوم`, 'error');
            return false;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
            showNotification(`${file.name} كبير جداً (الحد الأقصى ${maxSizeMB} ميجابايت)`, 'error');
            return false;
        }
        
        return true;
    });

    if (validFiles.length > 0) {
        selectedFiles = validFiles;
        showUploadForm(validFiles[0]); // عرض أول صورة فقط
    }
}

function showUploadForm(file) {
    // إنشاء معاينة الصورة
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = `
            <img src="${e.target.result}" alt="معاينة" class="preview-image">
        `;
    };
    reader.readAsDataURL(file);

    // إظهار النموذج
    document.getElementById('upload-area').style.display = 'none';
    document.getElementById('upload-form').style.display = 'block';
    
    // تعبئة اسم الملف كعنوان افتراضي
    document.getElementById('image-title').value = file.name.split('.')[0];
}

async function handleImageUpload(e) {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        showNotification('لم يتم اختيار ملف', 'error');
        return;
    }

    const file = selectedFiles[0];
    const title = document.getElementById('image-title').value.trim();
    const description = document.getElementById('image-description').value.trim();
    const categoryId = document.getElementById('image-category').value;
    const tags = document.getElementById('image-tags').value.trim();
    const isPublic = document.getElementById('is-public').checked;

    if (!title) {
        showNotification('يرجى إدخال عنوان للصورة', 'error');
        return;
    }

    try {
        // إظهار شريط التقدم
        const submitBtn = document.getElementById('submit-upload');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';

        // إنشاء اسم ملف فريد
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        // رفع الملف إلى Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // إضافة معلومات الصورة إلى قاعدة البيانات
        const { data: imageData, error: dbError } = await supabase
            .from('images')
            .insert({
                user_id: currentUser.id,
                title: title,
                description: description,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                mime_type: file.type,
                category_id: categoryId || null,
                is_public: isPublic
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // إضافة العلامات
        if (tags) {
            await addImageTags(imageData.id, tags);
        }

        showNotification('تم رفع الصورة بنجاح!', 'success');
        cancelUpload();
        
        // تحديث الصور إذا كان في الصفحة الرئيسية
        if (document.getElementById('home').classList.contains('active')) {
            loadImages();
        }

    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        showNotification('خطأ في رفع الصورة: ' + error.message, 'error');
    } finally {
        const submitBtn = document.getElementById('submit-upload');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> رفع الصورة';
    }
}

// إضافة علامات للصورة
async function addImageTags(imageId, tagsString) {
    const tagNames = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    for (const tagName of tagNames) {
        try {
            // البحث عن العلامة أو إنشاؤها
            let { data: tag, error } = await supabase
                .from('tags')
                .select('id')
                .eq('name', tagName)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!tag) {
                // إنشاء علامة جديدة
                const { data: newTag, error: createError } = await supabase
                    .from('tags')
                    .insert({ name: tagName })
                    .select()
                    .single();

                if (createError) throw createError;
                tag = newTag;
            }

            // ربط العلامة بالصورة
            await supabase
                .from('image_tags')
                .insert({
                    image_id: imageId,
                    tag_id: tag.id
                });

        } catch (error) {
            console.error('خطأ في إضافة علامة:', tagName, error);
        }
    }
}

function cancelUpload() {
    document.getElementById('upload-area').style.display = 'block';
    document.getElementById('upload-form').style.display = 'none';
    document.getElementById('image-form').reset();
    document.getElementById('preview-container').innerHTML = '';
    selectedFiles = [];
}

// تسجيل الدخول
async function handleSignIn(e) {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        updateUIForLoggedInUser();
        closeAuthModal();
        showNotification('تم تسجيل الدخول بنجاح', 'success');

    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('خطأ: ' + error.message, 'error');
    }
}

// إنشاء حساب
async function handleSignUp(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    if (password !== confirmPassword) {
        showNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        showNotification('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني', 'success');
        switchAuthForm('login');

    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        showNotification('خطأ: ' + error.message, 'error');
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        updateUIForLoggedOutUser();
        showNotification('تم تسجيل الخروج بنجاح', 'success');
        showSection('home');

    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        showNotification('خطأ في تسجيل الخروج', 'error');
    }
}

// إظهار مودال المصادقة
function showAuthModal(mode = 'login') {
    switchAuthForm(mode);
    document.getElementById('auth-modal').style.display = 'block';
}

// إغلاق مودال المصادقة
function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

// إغلاق مودال الصورة
function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

// تبديل نموذج المصادقة
function switchAuthForm(mode) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (mode === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// فلترة الصور
function filterImages() {
    loadImages(1, true);
}

// تحميل المزيد من الصور
function loadMoreImages() {
    currentPage++;
    loadImages(currentPage, false);
}

// تحميل صور المستخدم
async function loadUserImages() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('images')
            .select(`
                *,
                categories(name, color)
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // تحديث الإحصائيات
        const totalViews = data.reduce((sum, img) => sum + img.view_count, 0);
        const totalDownloads = data.reduce((sum, img) => sum + img.download_count, 0);

        document.getElementById('my-images-count').textContent = data.length;
        document.getElementById('my-views-count').textContent = totalViews;
        document.getElementById('my-downloads-count').textContent = totalDownloads;

        // عرض الصور
        const grid = document.getElementById('my-images-grid');
        if (data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-images"></i>
                    <h3>لا توجد صور</h3>
                    <p>ابدأ برفع صورتك الأولى!</p>
                    <button class="btn btn-primary" onclick="showSection('upload')">
                        <i class="fas fa-cloud-upload-alt"></i> رفع صورة
                    </button>
                </div>
            `;
        } else {
            grid.innerHTML = data.map(image => `
                <div class="image-card fade-in" onclick="openImageModal('${image.id}')">
                    <img src="${getImageUrl(image.file_path)}" alt="${image.title}" class="image-card-image">
                    <div class="image-card-content">
                        <h3 class="image-card-title">${image.title}</h3>
                        <p class="image-card-description">${image.description || 'لا يوجد وصف'}</p>
                        <div class="image-card-meta">
                            <span class="image-card-category" style="background-color: ${image.categories?.color || '#3b82f6'}20; color: ${image.categories?.color || '#3b82f6'}">
                                ${image.categories?.name || 'بدون تصنيف'}
                            </span>
                            <span>
                                <i class="fas fa-eye"></i> ${image.view_count}
                                <i class="fas fa-download" style="margin-right: 10px;"></i> ${image.download_count}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('خطأ في تحميل صور المستخدم:', error);
        showNotification('خطأ في تحميل صورك', 'error');
    }
}

// تحميل صفحة التصنيفات
async function loadCategoriesPage() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select(`
                *,
                images!inner(count)
            `)
            .order('name');

        if (error) throw error;

        const grid = document.getElementById('categories-grid');
        grid.innerHTML = data.map(category => `
            <div class="category-card" style="border-color: ${category.color}" onclick="filterByCategory('${category.id}')">
                <h3 style="color: ${category.color}">${category.name}</h3>
                <p>${category.description}</p>
                <div class="category-count">${category.images?.length || 0}</div>
                <small>صورة</small>
            </div>
        `).join('');

    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
        showNotification('خطأ في تحميل التصنيفات', 'error');
    }
}

// فلترة حسب التصنيف
function filterByCategory(categoryId) {
    document.getElementById('category-filter').value = categoryId;
    showSection('home');
    filterImages();
}

// عرض التنبيهات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;

    document.getElementById('notifications').appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, NOTIFICATION_DURATION);
}

// دالة تأخير للبحث
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// التعامل مع تغيير حالة المصادقة
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        updateUIForLoggedInUser();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForLoggedOutUser();
    }
});

// دالة لمعالجة رابط مشاركة صورة محددة
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageId = urlParams.get('image');
    if (imageId) {
        setTimeout(() => openImageModal(imageId), 1000);
    }
});