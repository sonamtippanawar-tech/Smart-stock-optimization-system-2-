const API = "/api";
const $ = id => document.getElementById(id);
let products = [];

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

async function loadDashboard() {
  try {
    const [items, summary] = await Promise.all([
      request(`${API}/inventory`), request(`${API}/summary`)
    ]);
    products = items;
    $("totalProducts").textContent = summary.totalProducts;
    $("totalUnits").textContent = summary.totalUnits.toLocaleString("en-IN");
    $("inventoryValue").textContent = money(summary.inventoryValue);
    $("lowStock").textContent = summary.lowStock;
    $("reorderCount").textContent = `${summary.reorderItems} products need immediate reorder`;
    renderProducts();
  } catch (error) {
    $("inventoryBody").innerHTML = `<tr><td colspan="7" class="empty">${error.message}. Is the server running?</td></tr>`;
  }
}

function renderProducts() {
  const term = $("search").value.toLowerCase();
  const filtered = products.filter(p => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(term));
  if (!filtered.length) {
    $("inventoryBody").innerHTML = '<tr><td colspan="7" class="empty">No matching products found.</td></tr>';
    return;
  }
  $("inventoryBody").innerHTML = filtered.map(p => {
    const opt = p.optimization;
    const cls = opt.status === "Healthy" ? "healthy" : opt.status === "Low stock" ? "low" : "reorder";
    return `<tr>
      <td><span class="product-name">${escapeHtml(p.name)}</span><span class="sub">${escapeHtml(p.category)}</span></td>
      <td>${escapeHtml(p.sku)}<span class="sub">Min: ${p.minStock} units</span></td>
      <td class="qty">${p.quantity} units</td>
      <td>${opt.reorderPoint} units</td>
      <td><strong>${opt.suggestedOrder} units</strong><span class="sub">Target: ${opt.targetStock}</span></td>
      <td><span class="status ${cls}">${opt.status}</span></td>
      <td><button class="action" data-edit="${p.id}">Edit</button><button class="action delete" data-delete="${p.id}">Delete</button></td>
    </tr>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function openForm(product = null) {
  $("productForm").reset();
  $("formError").textContent = "";
  $("productId").value = product ? product.id : "";
  $("dialogTitle").textContent = product ? "Edit product" : "Add product";
  $("name").value = product?.name || "";
  $("sku").value = product?.sku || "";
  $("category").value = product?.category || "";
  $("quantity").value = product?.quantity ?? 0;
  $("minStock").value = product?.minStock ?? 5;
  $("dailySales").value = product?.dailySales ?? 1;
  $("leadTime").value = product?.leadTime ?? 5;
  $("unitCost").value = product?.unitCost ?? 0;
  $("productDialog").showModal();
}

$("addBtn").addEventListener("click", () => openForm());
$("closeDialog").addEventListener("click", () => $("productDialog").close());
$("cancelBtn").addEventListener("click", () => $("productDialog").close());
$("search").addEventListener("input", renderProducts);

$("inventoryBody").addEventListener("click", async event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) {
    const product = products.find(p => p.id === Number(editId));
    if (product) openForm(product);
  }
  if (deleteId && confirm("Delete this product from inventory?")) {
    try {
      await request(`${API}/inventory/${deleteId}`, { method: "DELETE" });
      await loadDashboard();
    } catch (error) { alert(error.message); }
  }
});

$("productForm").addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("productId").value;
  const payload = {
    name: $("name").value, sku: $("sku").value, category: $("category").value,
    quantity: Number($("quantity").value), minStock: Number($("minStock").value),
    dailySales: Number($("dailySales").value), leadTime: Number($("leadTime").value),
    unitCost: Number($("unitCost").value)
  };
  try {
    await request(id ? `${API}/inventory/${id}` : `${API}/inventory`, {
      method: id ? "PUT" : "POST", body: JSON.stringify(payload)
    });
    $("productDialog").close();
    await loadDashboard();
  } catch (error) { $("formError").textContent = error.message; }
});

loadDashboard();