// api/get-data.js

export default async function handler(req, res) {
    const API_KEY = process.env.QOYOD_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "API Key missing" });
    }

    const headers = { 
        "API-KEY": API_KEY,
        "Accept": "application/json"
    };

    try {
        // 1️⃣ جلب الفواتير (بدون فلترة قاتلة)
        const invUrl = "https://www.qoyod.com/api/2.0/invoices?limit=500";

        // 2️⃣ جلب العملاء
        const custUrl = "https://www.qoyod.com/api/2.0/customers?limit=500";

        // 3️⃣ جلب منتج الآجل
        const prodUrl = "https://www.qoyod.com/api/2.0/products?q[sku_eq]=754500950512";

        const invRes = await fetch(invUrl, { headers });
        if (!invRes.ok) throw new Error("فشل جلب الفواتير من قيود");

        const custRes = await fetch(custUrl, { headers });
        const prodRes = await fetch(prodUrl, { headers });

        const invData = await invRes.json();
        const custData = custRes.ok ? await custRes.json() : { customers: [] };
        const prodData = prodRes.ok ? await prodRes.json() : { products: [] };

        const targetProduct =
            prodData.products && prodData.products.length > 0
                ? prodData.products[0]
                : null;

        return res.status(200).json({
            invoices: { invoices: invData.invoices || [] },
            customers: { customers: custData.customers || [] },
            target_product: targetProduct
        });

    } catch (error) {
        console.error("Qoyod API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}