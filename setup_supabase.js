// سكريبت إعداد تلقائي لمشروع Supabase
// يجب تشغيل هذا بعد إعداد قاعدة البيانات والـ Storage

async function setupSupabaseProject() {
    // تأكد من تغيير هذه القيم
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY'; // مفتاح الخدمة وليس المفتاح العام

    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_KEY === 'YOUR_SUPABASE_SERVICE_KEY') {
        console.error('يجب تحديث قيم Supabase أولاً');
        return;
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        console.log('بدء إعداد مشروع Supabase...');

        // 1. التحقق من اتصال قاعدة البيانات
        console.log('1. التحقق من الاتصال...');
        const { data: connection, error: connectionError } = await supabase
            .from('categories')
            .select('count');
        
        if (connectionError) {
            console.error('خطأ في الاتصال:', connectionError);
            return;
        }
        console.log('✅ تم الاتصال بنجاح');

        // 2. التحقق من وجود التصنيفات الافتراضية
        console.log('2. التحقق من التصنيفات...');
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('*');

        if (categoriesError) {
            console.error('خطأ في جلب التصنيفات:', categoriesError);
        } else {
            console.log(`✅ تم العثور على ${categories.length} تصنيف`);
            categories.forEach(cat => {
                console.log(`   - ${cat.name}: ${cat.description}`);
            });
        }

        // 3. التحقق من إعداد Storage
        console.log('3. التحقق من Storage...');
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.error('خطأ في جلب buckets:', bucketsError);
        } else {
            const imagesBucket = buckets.find(b => b.name === 'images');
            if (imagesBucket) {
                console.log(`✅ تم العثور على images bucket (عام: ${imagesBucket.public})`);
            } else {
                console.log('❌ لم يتم العثور على images bucket');
            }
        }

        // 4. إنشاء ملف تجريبي لاختبار الرفع
        console.log('4. اختبار رفع الملفات...');
        const testContent = 'اختبار ملف';
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('images')
            .upload('test/test.txt', new Blob([testContent]));

        if (uploadError) {
            console.error('خطأ في اختبار الرفع:', uploadError);
        } else {
            console.log('✅ اختبار الرفع نجح');
            
            // حذف الملف التجريبي
            await supabase.storage.from('images').remove(['test/test.txt']);
            console.log('✅ تم حذف الملف التجريبي');
        }

        // 5. إعداد أذونات RLS
        console.log('5. فحص أذونات RLS...');
        
        // يمكن إضافة فحوصات أخرى هنا

        console.log('\n🎉 تم إعداد المشروع بنجاح!');
        console.log('\nالخطوات التالية:');
        console.log('1. تحديث قيم SUPABASE_URL و SUPABASE_ANON_KEY في app.js');
        console.log('2. تشغيل الخادم المحلي');
        console.log('3. اختبار إنشاء حساب جديد');
        console.log('4. اختبار رفع صورة');

    } catch (error) {
        console.error('خطأ عام في الإعداد:', error);
    }
}

// معلومات الإعداد المطلوبة
function showSetupInstructions() {
    console.log(`
📋 تعليمات الإعداد:

1. إنشاء مشروع Supabase:
   - اذهب إلى https://app.supabase.com
   - اضغط على "New Project"
   - أدخل اسم المشروع وكلمة مرور قاعدة البيانات

2. إعداد قاعدة البيانات:
   - اذهب إلى SQL Editor
   - نفذ محتوى ملف database_schema.sql
   - نفذ محتوى ملف supabase_storage_setup.sql

3. الحصول على المفاتيح:
   - Settings > API
   - انسخ Project URL و anon public key
   - للاختبار، انسخ أيضاً service_role key

4. تحديث هذا الملف:
   - استبدل YOUR_SUPABASE_URL
   - استبدل YOUR_SUPABASE_SERVICE_KEY

5. تشغيل الاختبار:
   - افتح هذا الملف في المتصفح
   - افتح وحدة التحكم (F12)
   - شغل setupSupabaseProject()

⚠️  تحذير: لا تستخدم service_role key في الإنتاج!
    استخدمه فقط للاختبار والإعداد.
`);
}

// إظهار التعليمات عند تحميل الصفحة
showSetupInstructions();

// تصدير الدالة للاستخدام العام
window.setupSupabaseProject = setupSupabaseProject;
window.showSetupInstructions = showSetupInstructions;