-- إعداد Supabase Storage للصور

-- 1. إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- 2. إعداد سياسات الأمان للـ Storage

-- السماح للجميع بقراءة الصور العامة
CREATE POLICY "الجميع يمكنهم مشاهدة الصور العامة" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

-- السماح للمستخدمين المسجلين برفع الصور في مجلدهم الشخصي
CREATE POLICY "المستخدمون يمكنهم رفع صور في مجلدهم" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- السماح للمستخدمين بحذف صورهم الشخصية
CREATE POLICY "المستخدمون يمكنهم حذف صورهم" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- السماح للمستخدمين بتحديث صورهم الشخصية
CREATE POLICY "المستخدمون يمكنهم تحديث صورهم" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- إعداد حد أقصى لحجم الملف (5 ميجابايت)
-- هذا يتم في العميل (JavaScript) ولكن يمكن إضافة فحص إضافي هنا

-- دالة للتحقق من نوع الملف
CREATE OR REPLACE FUNCTION storage.check_file_type()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- التحقق من أن الملف هو صورة
    IF NEW.bucket_id = 'images' THEN
        IF NOT (NEW.metadata->>'mimetype' LIKE 'image/%') THEN
            RAISE EXCEPTION 'Only image files are allowed in images bucket';
        END IF;
        
        -- التحقق من حجم الملف (5 ميجابايت = 5242880 بايت)
        IF (NEW.metadata->>'size')::int > 5242880 THEN
            RAISE EXCEPTION 'File size must be less than 5MB';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- تطبيق الدالة على جدول storage.objects
CREATE TRIGGER check_file_type_trigger
    BEFORE INSERT OR UPDATE ON storage.objects
    FOR EACH ROW EXECUTE FUNCTION storage.check_file_type();

-- إعداد إضافي: دالة لتنظيف الملفات المحذوفة من قاعدة البيانات
CREATE OR REPLACE FUNCTION cleanup_deleted_images()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- حذف سجل الصورة من جدول images عند حذف الملف من Storage
    DELETE FROM images WHERE file_path = OLD.name;
    RETURN OLD;
END;
$$;

-- تطبيق دالة التنظيف
CREATE TRIGGER cleanup_images_trigger
    AFTER DELETE ON storage.objects
    FOR EACH ROW 
    WHEN (OLD.bucket_id = 'images')
    EXECUTE FUNCTION cleanup_deleted_images();

-- دالة لحذف الملفات غير المستخدمة (اختيارية - للصيانة)
CREATE OR REPLACE FUNCTION clean_unused_storage_files()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    file_record RECORD;
BEGIN
    -- البحث عن ملفات في Storage غير موجودة في جدول images
    FOR file_record IN 
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'images' 
        AND name NOT IN (SELECT file_path FROM images)
    LOOP
        -- حذف الملف غير المستخدم
        DELETE FROM storage.objects 
        WHERE bucket_id = 'images' AND name = file_record.name;
    END LOOP;
END;
$$;

-- يمكن تشغيل هذه الدالة دورياً للصيانة:
-- SELECT clean_unused_storage_files();