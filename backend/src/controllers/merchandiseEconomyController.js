import MerchandiseProduct from "../models/MerchandiseProduct.js";
import Studio from "../models/Studio.js";
import {
  CATEGORY_CONFIGS,
  calculateRestockBatchCost,
  calculateLiquidationValue,
} from "../services/simulation/engines/merchandiseEconomyEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

/**
 * Returns all merchandise products for player studio
 */
export async function getStudioProducts(req, res, next) {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const products = await MerchandiseProduct.find({ studioId: studio._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets product line detail by ID (studio-scoped)
 */
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const product = await MerchandiseProduct.findOne({ _id: id, studioId: studio._id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const liquidation = calculateLiquidationValue(product);
    res.status(200).json({ success: true, product, liquidation });
  } catch (error) {
    next(error);
  }
}

/**
 * Launches a new physical product line attached to an IP (transactional)
 */
export async function launchProductLine(req, res, next) {
  try {
    const {
      ipType,
      ipId,
      ipTitle,
      productName,
      category,
      tier = "STANDARD",
      retailPrice,
      initialBatchUnits = 10000,
      seasonalAffinity = "YEAR_ROUND",
    } = req.body;

    if (!ipId || !productName) {
      return res.status(400).json({
        success: false,
        message: "ipId and productName are required",
      });
    }

    const catConfig = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.ACTION_FIGURES_TOYS;
    const unitCost = catConfig.baseCost;
    const finalRetail = Number(retailPrice) || catConfig.suggestedRetail;
    const totalUnits = Math.max(1000, Number(initialBatchUnits) || 10000);

    const manufacturingCost = calculateRestockBatchCost(unitCost, totalUnits);

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const studioCash = studio.money || 0;
    if (studioCash < manufacturingCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Manufacturing batch requires $${manufacturingCost.toLocaleString()} but studio has $${studioCash.toLocaleString()}.`,
      });
    }

    let createdProduct = null;

    await withTransaction(async (session) => {
      const s = await Studio.findOne({
        _id: studio._id,
        money: { $gte: manufacturingCost },
      }).session(session);

      if (!s) {
        throw new Error("Insufficient funds for manufacturing");
      }

      s.money -= manufacturingCost;
      await s.save({ session });

      const [product] = await MerchandiseProduct.create(
        [
          {
            studioId: s._id,
            ipType,
            ipId,
            ipTitle: ipTitle || "Studio IP",
            productName: productName.trim(),
            category,
            tier,
            unitManufacturingCost: unitCost,
            retailPrice: finalRetail,
            inventoryStock: totalUnits,
            totalUnitsProduced: totalUnits,
            totalProductionCost: manufacturingCost,
            seasonalAffinity,
            status: "ACTIVE",
          },
        ],
        { session }
      );

      createdProduct = product;
    });

    res.status(201).json({
      success: true,
      message: `Product line "${createdProduct.productName}" launched and stocked with ${totalUnits.toLocaleString()} units!`,
      product: createdProduct,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restocks additional inventory units (studio-scoped & atomic)
 */
export async function restockProductInventory(req, res, next) {
  try {
    const { id } = req.params;
    const { unitsCount = 10000 } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const product = await MerchandiseProduct.findOne({ _id: id, studioId: studio._id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const units = Math.max(1000, Number(unitsCount));
    const cost = calculateRestockBatchCost(product.unitManufacturingCost, units);

    const studioCash = studio.money || 0;
    if (studioCash < cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Restocking requires $${cost.toLocaleString()}.`,
      });
    }

    let updatedProduct = null;

    await withTransaction(async (session) => {
      const s = await Studio.findOne({
        _id: studio._id,
        money: { $gte: cost },
      }).session(session);

      if (!s) {
        throw new Error("Insufficient funds for restock");
      }

      s.money -= cost;
      await s.save({ session });

      const p = await MerchandiseProduct.findOne({ _id: id, studioId: s._id }).session(session);
      p.inventoryStock += units;
      p.totalUnitsProduced += units;
      p.totalProductionCost += cost;
      p.status = "ACTIVE";
      await p.save({ session });

      updatedProduct = p;
    });

    res.status(200).json({
      success: true,
      message: `Successfully restocked ${units.toLocaleString()} units of "${updatedProduct.productName}".`,
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates pricing or discount clearance percentage (studio-scoped)
 */
export async function updateProductPricing(req, res, next) {
  try {
    const { id } = req.params;
    const { retailPrice, discountMarkdownPercent } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const product = await MerchandiseProduct.findOne({ _id: id, studioId: studio._id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (retailPrice !== undefined) {
      product.retailPrice = Math.max(1, Number(retailPrice));
    }
    if (discountMarkdownPercent !== undefined) {
      product.discountMarkdownPercent = Math.max(0, Math.min(80, Number(discountMarkdownPercent)));
      if (product.discountMarkdownPercent > 0 && product.status === "ACTIVE") {
        product.status = "DISCOUNTED";
      }
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product pricing adjusted successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Liquidates remaining unsold stock (studio-scoped, atomic & idempotent)
 */
export async function liquidateStock(req, res, next) {
  try {
    const { id } = req.params;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const product = await MerchandiseProduct.findOne({ _id: id, studioId: studio._id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const liquidation = calculateLiquidationValue(product);
    if (liquidation.unitsLiquidated === 0 || product.status === "LIQUIDATED") {
      return res.status(400).json({ success: false, message: "No stock to liquidate" });
    }

    let updatedProduct = null;

    await withTransaction(async (session) => {
      const p = await MerchandiseProduct.findOne({ _id: id, studioId: studio._id }).session(session);
      if (!p || p.inventoryStock <= 0 || p.status === "LIQUIDATED") {
        throw new Error("No stock available for liquidation");
      }

      const s = await Studio.findById(studio._id).session(session);
      s.money += liquidation.payout;
      await s.save({ session });

      p.inventoryStock = 0;
      p.status = "LIQUIDATED";
      p.totalGrossRevenue += liquidation.payout;
      await p.save({ session });

      updatedProduct = p;
    });

    res.status(200).json({
      success: true,
      message: `Liquidated ${liquidation.unitsLiquidated.toLocaleString()} units for $${liquidation.payout.toLocaleString()} cash recovery.`,
      product: updatedProduct,
      payout: liquidation.payout,
    });
  } catch (error) {
    next(error);
  }
}
