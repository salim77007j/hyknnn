# 🚀 دليل البدء السريع - موقع مشاركة الصور

## خطوات سريعة للتشغيل (5 دقائق)

### 1️⃣ إنشاء مشروع Supabase
```
1. اذهب إلى https://app.supabase.com
2. اضغط "New Project"
3. أدخل اسم المشروع + كلمة مرور قوية
4. انتظر 2 دقيقة لإعداد المشروع
```

### 2️⃣ إعداد قاعدة البيانات
```sql
-- انسخ والصق هذا في SQL Editor في Supabase
-- (من ملف database_schema.sql - الكود كامل موجود في الملف)

-- 1. إنشاء الجداول
CREATE TABLE categories (...);
CREATE TABLE images (...);
-- ... باقي الجداول

-- 2. إنشاء السياسات
CREATE POLICY "الصور العامة مرئية للجميع" ON images...
-- ... باقي السياسات
```

### 3️⃣ إعداد Storage
```sql
-- انسخ والصق هذا في SQL Editor
-- (من ملف supabase_storage_setup.sql)

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

CREATE POLICY "الجميع يمكنهم مشاهدة الصور العامة" ON storage.objects...
-- ... باقي السياسات
```

### 4️⃣ الحصول على المفاتيح
```
1. اذهب إلى Settings > API في Supabase
2. انسخ:
   - Project URL
   - anon public key
```

### 5️⃣ تحديث الإعدادات
في ملف `config.js`:
```javascript
const CONFIG = {
    SUPABASE: {
        URL: 'https://xxxxxxxx.supabase.co',     // ضع رابط مشروعك
        ANON_KEY: 'eyJ0eXAiOiJKV1QiLCJhbG...',  // ضع المفتاح العام
    },
    // ... باقي الإعدادات
};
```

### 6️⃣ تشغيل الموقع
```bash
# Python
python -m http.server 8000

# أو Node.js
npx live-server

# أو VS Code
# استخدم إضافة Live Server
```

### 7️⃣ اختبار التشغيل
```
1. افتح http://localhost:8000
2. يجب أن ترى الصفحة الرئيسية
3. جرب إنشاء حساب جديد
4. جرب رفع صورة تجريبية
```

---

## 🔧 إعداد متقدم (اختياري)

### أدوات التطوير المفيدة
```bash
# VS Code Extensions مفيدة
- Live Server
- Prettier
- ES6 String HTML
```

### إعداد HTTPS المحلي (للتطوير)
```bash
# باستخدام mkcert
mkcert localhost 127.0.0.1 ::1
```

### إعداد PWA (Progressive Web App)
```javascript
// في config.js
FEATURES: {
    ENABLE_PWA: true
}
```

---

## 🆘 حل المشاكل السريع

### ❌ "خطأ في الاتصال بـ Supabase"
```
✅ تحقق من:
- Project URL صحيح؟
- Anon Key صحيح؟
- المشروع فعال؟
```

### ❌ "فشل في رفع الصورة"
```
✅ تحقق من:
- حجم الصورة < 5MB؟
- تم إعداد Storage؟
- bucket 'images' موجود؟
```

### ❌ "لا تظهر الصور"
```
✅ تحقق من:
- bucket عام (public)؟
- Storage policies صحيحة؟
- لا توجد أخطاء في Console؟
```

### ❌ مشاكل في المصادقة
```
✅ تحقق من:
- Email provider مفعل في Supabase؟
- RLS policies صحيحة؟
```

---

## 📁 هيكل الملفات النهائي

```
📁 موقع-مشاركة-الصور/
├── 📄 index.html              ← الصفحة الرئيسية
├── 📄 setup.html              ← صفحة اختبار الإعداد  
├── 📄 styles.css              ← التصميم
├── 📄 app.js                  ← الكود الرئيسي
├── 📄 config.js               ← الإعدادات
├── 📄 database_schema.sql     ← إعداد قاعدة البيانات
├── 📄 supabase_storage_setup.sql ← إعداد Storage
├── 📄 setup_supabase.js       ← سكريبت الإعداد
├── 📄 README.md               ← الدليل الكامل
└── 📄 QUICK_START.md          ← هذا الملف
```

---

## 🎯 خطوات ما بعد التشغيل

### تخصيص الموقع
```javascript
// في config.js يمكنك تغيير:
- ألوان التصميم
- عدد الصور في الصفحة  
- حجم الملفات المسموح
- التصنيفات الافتراضية
```

### إضافة ميزات جديدة
```
- نظام التقييم (Stars)
- الألبومات الشخصية
- إشعارات الإعجابات
- خاصية المتابعة
```

### نشر الموقع
```
- Vercel (مجاني)
- Netlify (مجاني)  
- GitHub Pages
- Firebase Hosting
```

---

## 🔗 روابط مفيدة

- [وثائق Supabase](https://supabase.com/docs)
- [مرجع JavaScript APIs](https://supabase.com/docs/reference/javascript)
- [دليل Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**🎉 مبروك! موقعك جاهز للاستخدام**

لأي مساعدة إضافية، راجع ملف `README.md` للتفاصيل الكاملة أو استخدم صفحة `setup.html` لاختبار الإعداد.
