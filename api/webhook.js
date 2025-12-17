import { createClient } from "@base44/sdk";

/**
 * Datapacks we care about
 */
const SELECTED_DATAPACKS = [
  "RoofCondition",
  "Measurements",
  "PropertyAttributes",
  "Structure",
  "Imagery",
  "Risk",
  "Parcel",
  "RoofGeometry",
  "Obstructions"
];

export default async function handler(req, res) {
  // Health check (GET / HEAD)
  if (req.method !== "POST") {
    return res.status(200).json({ status: "ok" });
  }

  try {
    const body = req.body;

    if (!body || !Array.isArray(body.products)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { requestId, products } = body;

    // Filter only datapacks we want
    const filtered = products.filter(p =>
      SELECTED_DATAPACKS.includes(p.type)
    );

    // Init Base44 client
    const base44 = createClient({
      apiKey: process.env.BASE44_API_KEY
    });

    let processed = 0;

    for (const product of filtered) {
      if (!product.propertyId) continue;

      await base44.entities.Property.update(product.propertyId, {
        eagleview_report_id: requestId,
        eagleview_report: product,
        enrichment_status: "complete",
        last_enrichment_date: new Date().toISOString()
      });

      processed++;
    }

    return res.status(200).json({
      success: true,
      processed
    });

  } catch (err) {
    console.error("[EagleView Webhook Error]", err);
    return res.status(500).json({
      error: "Webhook processing failed",
      message: err.message
    });
  }
}
