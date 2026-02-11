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

    // دالة مساعدة لجلب كافة الصفحات بشكل آمن ومستقر
    async function fetchAllPages(baseUrl) {
        let allItems = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}`;
            try {
                const response = await fetch(url, { headers });
                if (!response.ok) {
                    hasMore = false;
                    break;
                }
                
                const data = await response.json();
                const keys = Object.keys(data);
                const items = data[keys[0]] || [];

                if (items.length === 0) {
                    hasMore = false;
                } else {
                    allItems = allItems.concat(items);
                    page++;
                    // حد أمان (20 صفحة = 2000 سجل) لضمان عدم حدوث Timeout في Vercel
                    if (page > 20) hasMore = false; 
                }
            } catch (e) {
                hasMore = false;
                break;
            }
        }
        return allItems;
    }

    try {
        // 1️⃣ جلب الفواتير المعلقة فقط (الموافق عليها والمدفوعة جزئياً)
        const invBaseUrl = "https://api.qoyod.com/2.0/invoices?q[status_not_eq]=Draft&q[status_not_eq]=Voided&q[status_not_eq]=Paid&per_page=100";
        
        // 2️⃣ جلب العملاء لربط الأسماء
        const custBaseUrl = "https://api.qoyod.com/2.0/customers?per_page=100";

        // 3️⃣ جلب منتج الآجل (للتأكد من SKU)
        const prodUrl = "https://api.qoyod.com/2.0/products?q[sku_eq]=754500950512";

        const [invoices, customers, prodRes] = await Promise.all([
            fetchAllPages(invBaseUrl),
            fetchAllPages(custBaseUrl),
            fetch(prodUrl, { headers })
        ]);

        const prodData = await prodRes.json();
        const targetProduct = prodData.products && prodData.products.length ? prodData.products[0] : null;

        return res.status(200).json({
            invoices: { invoices: invoices },
            customers: { customers: customers },
            target_product: targetProduct
        });

    } catch (err) {
        console.error("QOYOD ERROR:", err);
        return res.status(500).json({ error: "فشل في جلب البيانات من قيود. تأكد من مفتاح الـ API." });
    }
}
