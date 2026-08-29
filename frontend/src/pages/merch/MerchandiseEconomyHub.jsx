import React, { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getStudioProducts,
  getEligibleIPs,
  launchProductLine,
  restockProductInventory,
  updateProductPricing,
  liquidateStock,
} from "../../api/merchandiseEconomyApi";
import {
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Warehouse,
  Percent,
  Plus,
  RefreshCw,
  Trash2,
  Tag,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function MerchandiseEconomyHub() {
  const [products, setProducts] = useState([]);
  const [eligibleIPs, setEligibleIPs] = useState({ movies: [], tvShows: [], franchises: [] });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Launch Modal State
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedIpType, setSelectedIpType] = useState("MOVIE");
  const [selectedIpId, setSelectedIpId] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("ACTION_FIGURES_TOYS");
  const [tier, setTier] = useState("MASS_MARKET");
  const [retailPrice, setRetailPrice] = useState(29.99);
  const [initialUnits, setInitialUnits] = useState(10000);
  const [seasonalAffinity, setSeasonalAffinity] = useState("YEAR_ROUND");

  // Restock / Pricing Modal State
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [restockUnits, setRestockUnits] = useState(5000);
  const [editingPricingProduct, setEditingPricingProduct] = useState(null);
  const [editRetail, setEditRetail] = useState(29.99);
  const [editMarkdown, setEditMarkdown] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, ipRes] = await Promise.all([
        getStudioProducts(),
        getEligibleIPs(),
      ]);
      if (prodRes.success) setProducts(prodRes.data || prodRes.products || []);
      if (ipRes.success) setEligibleIPs(ipRes.eligibleIPs || {});
    } catch (err) {
      console.error("Failed to load merchandise data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    try {
      let chosenTitle = "Studio IP";
      if (selectedIpType === "MOVIE") {
        const m = eligibleIPs.movies?.find((x) => x._id === selectedIpId);
        if (m) chosenTitle = m.title;
      } else if (selectedIpType === "TV_SHOW") {
        const t = eligibleIPs.tvShows?.find((x) => x._id === selectedIpId);
        if (t) chosenTitle = t.title;
      } else {
        const f = eligibleIPs.franchises?.find((x) => x._id === selectedIpId);
        if (f) chosenTitle = f.name;
      }

      const res = await launchProductLine({
        ipType: selectedIpType,
        ipId: selectedIpId || "650c1f1e1f1e1f1e1f1e1f1e",
        ipTitle: chosenTitle,
        productName,
        category,
        tier,
        retailPrice: Number(retailPrice),
        initialBatchUnits: Number(initialUnits),
        seasonalAffinity,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setShowLaunchModal(false);
        setProductName("");
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to launch product line",
      });
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockingProduct) return;
    try {
      const res = await restockProductInventory(restockingProduct._id, {
        unitsCount: Number(restockUnits),
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setRestockingProduct(null);
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to restock inventory",
      });
    }
  };

  const handleUpdatePricing = async (e) => {
    e.preventDefault();
    if (!editingPricingProduct) return;
    try {
      const res = await updateProductPricing(editingPricingProduct._id, {
        retailPrice: Number(editRetail),
        discountMarkdownPercent: Number(editMarkdown),
      });
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setEditingPricingProduct(null);
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to update pricing",
      });
    }
  };

  const handleLiquidate = async (product) => {
    if (!window.confirm(`Liquidate remaining ${product.inventoryStock} units of "${product.productName}" at salvage rate?`)) {
      return;
    }
    try {
      const res = await liquidateStock(product._id);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to liquidate inventory",
      });
    }
  };

  // Cumulative Financial Totals
  const totalRevenue = products.reduce((sum, p) => sum + (p.totalGrossRevenue || 0), 0);
  const totalCost = products.reduce((sum, p) => sum + (p.totalProductionCost || 0), 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.totalNetProfit || 0), 0);
  const totalInventory = products.reduce((sum, p) => sum + (p.inventoryStock || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-900/30 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Merchandise Economy & IP Product Suite
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Monetize movie franchises, collectibles, apparel, and toys. Manage inventory batches, pricing elasticity, clearance markdowns, and storage fees.
            </p>
          </div>

          <button
            onClick={() => setShowLaunchModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" /> Manufacture New Product Line
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : "bg-red-950/40 border-red-500/30 text-red-300"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold uppercase hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Retail Gross</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Manufacturing Outlay</span>
            <p className="text-2xl font-bold text-red-400 mt-1">
              ${totalCost.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Net Commercial Profit</span>
            <p className="text-2xl font-bold text-white mt-1">
              ${totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 uppercase font-semibold">Warehouse Stock</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {totalInventory.toLocaleString()} Units
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Active Product Lines & Warehouse Depletion ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Merchandise Lines Manufactured</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Launch action figures, apparel, or limited edition collectibles from your blockbuster films and TV series to unlock high-margin passive cash flow.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod._id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-emerald-500/40 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {prod.category?.replace(/_/g, " ")}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1.5">{prod.productName}</h3>
                      <p className="text-xs text-slate-400">IP: {prod.ipTitle} ({prod.ipType})</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.status === "ACTIVE"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : prod.status === "DISCOUNTED"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {prod.status}
                    </span>
                  </div>

                  {/* Pricing & Stock Stats */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Retail Price:</span>
                      <span className="text-emerald-400 font-bold">
                        ${prod.retailPrice}
                        {prod.discountMarkdownPercent > 0 && ` (-${prod.discountMarkdownPercent}%)`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Unit Mfg Cost:</span>
                      <span className="text-white">${prod.unitManufacturingCost}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Inventory Remaining:</span>
                      <span className="text-amber-400 font-bold">{prod.inventoryStock.toLocaleString()} / {prod.totalUnitsProduced.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Units Sold:</span>
                      <span className="text-white">{prod.unitsSold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-850 pt-1.5">
                      <span>Net Profit:</span>
                      <span className="text-emerald-400 font-bold">${prod.totalNetProfit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setRestockingProduct(prod);
                        setRestockUnits(5000);
                      }}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <RefreshCw size={12} /> Restock
                    </button>
                    <button
                      onClick={() => {
                        setEditingPricingProduct(prod);
                        setEditRetail(prod.retailPrice);
                        setEditMarkdown(prod.discountMarkdownPercent || 0);
                      }}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Tag size={12} /> Pricing
                    </button>
                    <button
                      onClick={() => handleLiquidate(prod)}
                      disabled={prod.inventoryStock <= 0}
                      className="py-2 bg-red-950/40 hover:bg-red-900/60 disabled:opacity-30 text-red-300 border border-red-800/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Trash2 size={12} /> Liquidate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Launch Product Line */}
        {showLaunchModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-lg font-bold text-white">Manufacture New Merchandise Line</h3>

              <form onSubmit={handleLaunch} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      IP Type
                    </label>
                    <select
                      value={selectedIpType}
                      onChange={(e) => setSelectedIpType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                    >
                      <option value="MOVIE">Movie Release</option>
                      <option value="TV_SHOW">TV Series</option>
                      <option value="FRANCHISE">Franchise Universe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                    >
                      <option value="ACTION_FIGURES_TOYS">Action Figures & Toys</option>
                      <option value="APPAREL_CLOTHING">Apparel & Streetwear</option>
                      <option value="BOOKS_NOVELIZATIONS">Novelizations & Art Books</option>
                      <option value="LIMITED_COLLECTIBLES">Limited Edition Collectibles</option>
                      <option value="DIGITAL_COSMETICS">Digital Avatar Items</option>
                      <option value="SOUNDTRACKS_VINYL">Soundtracks & Vinyl</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Product Line Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. CyberCity 2099 Collector Action Figure"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Retail ($)
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Initial Units
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="1000"
                      value={initialUnits}
                      onChange={(e) => setInitialUnits(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Seasonal Affinity
                    </label>
                    <select
                      value={seasonalAffinity}
                      onChange={(e) => setSeasonalAffinity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs"
                    >
                      <option value="YEAR_ROUND">Year-Round</option>
                      <option value="SUMMER_BLOCKBUSTER">Summer Surge</option>
                      <option value="HOLIDAY_Q4">Q4 Holiday</option>
                      <option value="BACK_TO_SCHOOL">Back to School</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLaunchModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                  >
                    Order Production Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Restock */}
        {restockingProduct && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-bold text-white">Restock Inventory</h3>
              <p className="text-xs text-slate-400">Order batch for: {restockingProduct.productName}</p>

              <form onSubmit={handleRestock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Units to Produce
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    value={restockUnits}
                    onChange={(e) => setRestockUnits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRestockingProduct(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                  >
                    Authorize Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Price & Markdown */}
        {editingPricingProduct && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-bold text-white">Adjust Pricing & Discounts</h3>
              <p className="text-xs text-slate-400">{editingPricingProduct.productName}</p>

              <form onSubmit={handleUpdatePricing} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Base Retail Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={editRetail}
                    onChange={(e) => setEditRetail(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Clearance Markdown (%): {editMarkdown}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="5"
                    value={editMarkdown}
                    onChange={(e) => setEditMarkdown(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPricingProduct(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                  >
                    Save Price
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
