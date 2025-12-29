// api/get-data.js

export default async function handler(req, res) {
    const API_KEY = process.env.QOYOD_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "API Key missing in environment variables" });
    }

    const headers = { 
        "API-KEY": API_KEY, 
        "Content-Type": "application/json" 
    };

    try {
        console.log("📡 جاري طلب فواتير 'جرير' مباشرة من خوادم قيود...");

        // بناء رابط الاستعلام باستخدام Ransack
        // 1. q[contact_name_cont]: ابحث عن أي مورد يحتوي اسمه على كلمة "جرير"
        // 2. q[s]: رتب النتائج حسب تاريخ الإصدار تنازلياً (الأحدث أولاً)
        // 3. q[status_not_eq]: استبعاد المسودات (اختياري حسب حاجتك)
        
        const searchTerm = encodeURIComponent("جرير");
        const queryParams = `q[contact_name_cont]=${searchTerm}&q[s]=issue_date desc`;
        
        // ملاحظة: استخدمنا endpoint "bills" لأنك تبحث عن فواتير مشتريات (Vendor Bills)
        // إذا كنت تقصد مبيعات، استبدلها بـ "invoices"
        const url = `https://www.qoyod.com/api/2.0/bills?${queryParams}`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
            // قراءة رسالة الخطأ من قيود إن وجدت
            const errorText = await response.text(); 
            throw new Error(`خطأ من المصدر (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // قيود يعيد مصفوفة الفواتير داخل مفتاح "bills"
        const targetedBills = data.bills || [];

        console.log(`✅ تم استلام ${targetedBills.length} فاتورة مطابقة من المصدر.`);

        // إرجاع النتائج (لا حاجة للفلترة هنا، البيانات وصلت نظيفة)
        return res.status(200).json({ 
            bills: { bills: targetedBills } 
        });

    } catch (error) {
        console.error("❌ Error fetching data:", error);
        return res.status(500).json({ 
            error: "فشل الاتصال بنظام قيود",
            details: error.message
        });
    }
}
