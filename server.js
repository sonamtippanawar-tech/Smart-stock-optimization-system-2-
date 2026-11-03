const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Demo data is stored in memory. Restarting the server resets it.
let inventory = [
  { id: 1, name: "Wireless Mouse", sku: "ELE-001", category: "Electronics", quantity: 12, minStock: 10, dailySales: 2, leadTime: 5, unitCost: 450 },
  { id: 2, name: "Notebook", sku: "STA-002", category: "Stationery", quantity: 65, minStock: 20, dailySales: 3, leadTime: 4, unitCost: 35 },
  { id: 3, name: "USB-C Cable", sku: "ELE-003", category: "Electronics", quantity: 7, minStock: 15, dailySales: 2, leadTime: 6, unitCost: 180 },
  { id: 4, name: "Water Bottle", sku: "ACC-004", category: "Accessories", quantity: 28, minStock: 12, dailySales: 1, leadTime: 3, unitCost: 220 }
];
let nextId = 5;

function optimize(item) {
  // Reorder point = expected demand during lead time + safety stock.
  const safetyStock = Math.ceil(item.dailySales * 2);
  const reorderPoint = Math.ceil(item.dailySales * item.leadTime + safetyStock);
  const targetStock = Math.ceil(item.dailySales * (item.leadTime + 14) + safetyStock);
  const suggestedOrder = Math.max(0, targetStock - item.quantity);
  return {
    safetyStock,
    reorderPoint,
    targetStock,
    suggestedOrder,
    status: item.quantity <= reorderPoint ? "Reorder now" :
      item.quantity <= reorderPoint * 1.5 ? "Low stock" : "Healthy"
  };
}

app.get("/api/inventory", (req, res) => {
  res.json(inventory.map(item => ({ ...item, optimization: optimize(item) })));
});

app.post("/api/inventory", (req, res) => {
  const { name, sku, category, quantity, minStock, dailySales, leadTime, unitCost } = req.body;
  if (!name || !sku || quantity == null || dailySales == null || leadTime == null) {
    return res.status(400).json({ error: "Name, SKU, quantity, daily sales and lead time are required." });
  }
  if (inventory.some(x => x.sku.toLowerCase() === String(sku).toLowerCase())) {
    return res.status(409).json({ error: "That SKU already exists." });
  }
  const item = {
    id: nextId++, name: String(name).trim(), sku: String(sku).trim(),
    category: category || "General", quantity: Math.max(0, Number(quantity)),
    minStock: Math.max(0, Number(minStock || 0)), dailySales: Math.max(0, Number(dailySales)),
    leadTime: Math.max(0, Number(leadTime)), unitCost: Math.max(0, Number(unitCost || 0))
  };
  inventory.push(item);
  res.status(201).json({ ...item, optimization: optimize(item) });
});

app.put("/api/inventory/:id", (req, res) => {
  const item = inventory.find(x => x.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Product not found." });
  const allowed = ["name", "sku", "category", "quantity", "minStock", "dailySales", "leadTime", "unitCost"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = ["quantity", "minStock", "dailySales", "leadTime", "unitCost"].includes(key)
      ? Math.max(0, Number(req.body[key])) : String(req.body[key]).trim();
  }
  res.json({ ...item, optimization: optimize(item) });
});

app.delete("/api/inventory/:id", (req, res) => {
  const before = inventory.length;
  inventory = inventory.filter(x => x.id !== Number(req.params.id));
  if (inventory.length === before) return res.status(404).json({ error: "Product not found." });
  res.json({ message: "Product deleted." });
});

app.get("/api/summary", (req, res) => {
  const enriched = inventory.map(x => ({ ...x, optimization: optimize(x) }));
  res.json({
    totalProducts: inventory.length,
    totalUnits: inventory.reduce((sum, x) => sum + x.quantity, 0),
    inventoryValue: inventory.reduce((sum, x) => sum + x.quantity * x.unitCost, 0),
    lowStock: enriched.filter(x => x.optimization.status !== "Healthy").length,
    reorderItems: enriched.filter(x => x.optimization.status === "Reorder now").length
  });
});

app.listen(PORT, () => console.log(`Smart Inventory System running at http://localhost:${PORT}`));