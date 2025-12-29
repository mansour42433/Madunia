// api/get-data.js

export default async function handler(req, res) {
    const API_KEY = process.env.QOYOD_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "API Key missing" });
    }

    const headers = { 
        "API-KEY": API_KEY, 
        "Content-Type": "application/json" 
    };

    try {
        // 1. جلب الفواتير (نستبعد المسودات والملغاة)
        // ملاحظة: status_not_eq=Paid يعني نجلب الغير مدفوعة فقط، إذا كنت تريد المدفوعة أيضاً احذف هذا الفلتر
        // حسب طلبك "كاش مع المندوب" عادة تكون Approved وليست Paid في النظام بعد
        const invUrl = "https://www.qoyod.com/api/2.0/invoices?q[status_not_eq]=Draft&q[status_not_eq]=Voided&limit=500";
        
        // 2. جلب العملاء لربط الأسماء
        const custUrl = "https://www.qoyod.com/api/2.0/customers?limit=500";

        // 3. جلب منتج "خدمة فاتورة آجلة" لمعرفة الـ ID الخاص به بدقة
        const prodUrl = "https://www.qoyod.com/api/2.0/products?q[sku_eq]=754500950512";

        // تنفيذ الطلبات بالتوازي
        const [invRes, custRes, prodRes] = await Promise.all([
            fetch(invUrl, { headers }),
            fetch(custUrl, { headers }),
            fetch(prodUrl, { headers })
        ]);

        if (!invRes.ok) throw new Error("فشل الاتصال بقيود");

        const invData = await invRes.json();
        const custData = await custRes.json();
        const prodData = await prodRes.json();

        // تحديد منتج الأجل
        const targetProduct = prodData.products && prodData.products.length > 0 ? prodData.products[0] : null;

        return res.status(200).json({ 
            invoices: { invoices: invData.invoices || [] },
            customers: { customers: custData.customers || [] },
            target_product: targetProduct 
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
