// api/get-data.js

export default async function handler(req, res) {
    const API_KEY = process.env.QOYOD_API_KEY;

    // 1. التحقق من وجود المفتاح
    if (!API_KEY) {
        return res.status(500).json({ error: "API Key missing in environment variables" });
    }

    const headers = { 
        "API-KEY": API_KEY, 
        "Content-Type": "application/json" 
    };

    try {
        console.log("📡 جاري طلب فواتير المبيعات (Invoices) لنظام المناديب...");

        // 2. إعداد رابط الاستعلام الصحيح
        // - نطلب 'invoices' (مبيعات) وليس 'bills' (مشتريات)
        // - نستبعد المسودات (Draft) والملغاة (Voided)
        // - نطلب حد 500 فاتورة لنغطي شغل المناديب الأخير
        
        const url = "https://www.qoyod.com/api/2.0/invoices?q[status_not_eq]=Draft&q[status_not_eq]=Voided&limit=500";

        // طلب الفواتير
        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(`Qoyod API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // جلب قائمة الفواتير
        const invoices = data.invoices || [];

        // 3. (خطوة إضافية مهمة) جلب أسماء العملاء
        // قيود يعطي في الفاتورة contact_id، نحتاج الاسم لعرضه في الجدول
        const custUrl = "https://www.qoyod.com/api/2.0/customers?limit=500";
        const custResponse = await fetch(custUrl, { headers });
        const custData = await custResponse.json();


        console.log(`✅ تم استلام ${invoices.length} فاتورة مبيعات.`);

        // 4. إرجاع البيانات بالتنسيق الذي ينتظره ملف HTML
        return res.status(200).json({ 
            invoices: { invoices: invoices },
            customers: { customers: custData.customers || [] }
        });

    } catch (error) {
        console.error("❌ Error fetching data:", error);
        return res.status(500).json({ 
            error: "فشل الاتصال بنظام قيود",
            details: error.message
        });
    }
}
