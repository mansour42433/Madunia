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
        // 1️⃣ جلب الفواتير غير المدفوعة فقط (الحل الصحيح)
        const invUrl =
            "https://www.qoyod.com/api/2.0/invoices" +
            "?q[status_not_eq]=Draft" +
            "&q[status_not_eq]=Voided" +
            "&q[status_not_eq]=Paid" +
            "&limit=500";

        // 2️⃣ جلب العملاء
        const custUrl = "https://www.qoyod.com/api/2.0/customers?limit=500";

        // 3️⃣ جلب منتج الآجل
        const prodUrl = "https://www.qoyod.com/api/2.0/products?q[sku_eq]=754500950512";

        const [invRes, custRes, prodRes] = await Promise.all([
            fetch(invUrl, { headers }),
            fetch(custUrl, { headers }),
            fetch(prodUrl, { headers })
        ]);

        if (!invRes.ok) {
            throw new Error("فشل جلب الفواتير من قيود");
        }

        const invData = await invRes.json();
        const custData = await custRes.json();
        const prodData = await prodRes.json();

        const targetProduct =
            prodData.products && prodData.products.length
                ? prodData.products[0]
                : null;

        return res.status(200).json({
            invoices: { invoices: invData.invoices || [] },
            customers: { customers: custData.customers || [] },
            target_product: targetProduct
        });

    } catch (err) {
        console.error("QOYOD ERROR:", err);
        return res.status(500).json({ error: err.message });
    }
}