-- إنشاء جداول قاعدة البيانات لموقع رفع الصور

-- 1. جدول التصنيفات
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- لون التصنيف
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. جدول الصور
CREATE TABLE images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL, -- بالبايت
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. جدول العلامات (Tags)
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. جدول ربط الصور بالعلامات
CREATE TABLE image_tags (
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, tag_id)
);

-- 5. جدول المفضلة
CREATE TABLE favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, image_id)
);

-- 6. جدول التعليقات
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_category_id ON images(category_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_images_public ON images(is_public);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_comments_image_id ON comments(image_id);

-- إدراج بعض التصنيفات الافتراضية
INSERT INTO categories (name, description, color) VALUES
('طبيعة', 'صور المناظر الطبيعية والحياة البرية', '#22C55E'),
('أشخاص', 'صور شخصية وعائلية', '#3B82F6'),
('فن', 'الأعمال الفنية والإبداعية', '#8B5CF6'),
('تقنية', 'صور تقنية وتكنولوجيا', '#F59E0B'),
('طعام', 'صور الطعام والمشروبات', '#EF4444'),
('سفر', 'صور السفر والرحلات', '#06B6D4'),
('رياضة', 'صور رياضية', '#10B981'),
('منوع', 'صور متنوعة', '#6B7280');

-- إعداد Row Level Security (RLS)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للصور
CREATE POLICY "الصور العامة مرئية للجميع" ON images
    FOR SELECT USING (is_public = true);

CREATE POLICY "المستخدمون يمكنهم رؤية صورهم الخاصة" ON images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم رفع صور" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث صورهم" ON images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف صورهم" ON images
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات المفضلة
CREATE POLICY "المستخدمون يمكنهم إدارة مفضلاتهم" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- سياسات التعليقات
CREATE POLICY "الجميع يمكنهم قراءة التعليقات" ON comments
    FOR SELECT USING (true);

CREATE POLICY "المستخدمون المسجلون يمكنهم إضافة تعليقات" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف تعليقاتهم" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق الدالة على جدول الصور
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لزيادة عدد المشاهدات
CREATE OR REPLACE FUNCTION increment_view_count(image_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE images 
    SET view_count = view_count + 1 
    WHERE id = image_uuid;
END;
$$ LANGUAGE plpgsql;

-- دالة لزيادة عدد التحميلات
CREATE OR REPLACE FUNCTION increment_download_count(image_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE images 
    SET download_count = download_count + 1 
    WHERE id = image_uuid;
END;
$$ LANGUAGE plpgsql;