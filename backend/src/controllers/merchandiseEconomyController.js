import MerchandiseProduct from "../models/MerchandiseProduct.js";
import Studio from "../models/Studio.js";
import Movie from "../models/Movie.js";
import TVShow from "../models/TVShowModel.js";
import Franchise from "../models/Franchise.js";
import {
  CATEGORY_CONFIGS,
  calculateRestockBatchCost,
  calculateLiquidationValue,
  simulateWeeklyProductSales,
} from "../services/simulation/engines/merchandiseEconomyEngine.js";

/**
 * Lists all merchandise product lines for the authenticated studio
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
 * Returns studio IPs eligible to spawn merchandise lines
 */
export async function getEligibleIPs(req, res, next) {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const [movies, tvShows, franchises] = await Promise.all([
      Movie.find({ studioId: studio._id, status: "RELEASED" }).select("title genre worldwideGross quality"),
      TVShow.find({ studioId: studio._id }).select("title genre quality popularity"),
      Franchise.find({ studioId: studio._id }).select("name popularity totalRevenue"),
    ]);

    res.status(200).json({
      success: true,
      eligibleIPs: {
        movies,
        tvShows,
        franchises,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Launches a new product line with initial batch production
 */
export async function launchProductLine(req, res, next) {
  try {
    const {
      ipType = "MOVIE",
      ipId,
      ipTitle,
      productName,
      category = "ACTION_FIGURES_TOYS",
      tier = "MASS_MARKET",
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

    const studioCash = studio.money || studio.cash || 0;
    if (studioCash < manufacturingCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Manufacturing batch requires $${manufacturingCost.toLocaleString()} but studio has $${studioCash.toLocaleString()}.`,
      });
    }

    if (studio.money !== undefined) studio.money -= manufacturingCost;
    if (studio.cash !== undefined) studio.cash = Math.max(0, studio.cash - manufacturingCost);
    await studio.save();

    const product = await MerchandiseProduct.create({
      studioId: studio._id,
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
    });

    res.status(201).json({
      success: true,
      message: `Product line "${product.productName}" launched and stocked with ${totalUnits.toLocaleString()} units!`,
      product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restocks additional inventory units
 */
export async function restockProductInventory(req, res, next) {
  try {
    const { id } = req.params;
    const { unitsCount = 10000 } = req.body;

    const product = await MerchandiseProduct.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const units = Math.max(1000, Number(unitsCount));
    const cost = calculateRestockBatchCost(product.unitManufacturingCost, units);

    const studio = await Studio.findById(product.studioId);
    const studioCash = studio?.money || studio?.cash || 0;

    if (studioCash < cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Restocking requires $${cost.toLocaleString()}.`,
      });
    }

    if (studio) {
      if (studio.money !== undefined) studio.money -= cost;
      if (studio.cash !== undefined) studio.cash = Math.max(0, studio.cash - cost);
      await studio.save();
    }

    product.inventoryStock += units;
    product.totalUnitsProduced += units;
    product.totalProductionCost += cost;
    product.status = "ACTIVE";
    await product.save();

    res.status(200).json({
      success: true,
      message: `Successfully restocked ${units.toLocaleString()} units of "${product.productName}".`,
      product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates pricing or discount clearance percentage
 */
export async function updateProductPricing(req, res, next) {
  try {
    const { id } = req.params;
    const { retailPrice, discountMarkdownPercent } = req.body;

    const product = await MerchandiseProduct.findById(id);
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
 * Liquidates remaining unsold stock
 */
export async function liquidateStock(req, res, next) {
  try {
    const { id } = req.params;
    const product = await MerchandiseProduct.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const liquidation = calculateLiquidationValue(product);
    if (liquidation.unitsLiquidated === 0) {
      return res.status(400).json({ success: false, message: "No stock to liquidate" });
    }

    const studio = await Studio.findById(product.studioId);
    if (studio) {
      if (studio.money !== undefined) studio.money += liquidation.payout;
      if (studio.cash !== undefined) studio.cash += liquidation.payout;
      await studio.save();
    }

    product.inventoryStock = 0;
    product.status = "LIQUIDATED";
    product.totalGrossRevenue += liquidation.payout;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Liquidated ${liquidation.unitsLiquidated.toLocaleString()} units for $${liquidation.payout.toLocaleString()} cash recovery.`,
      product,
      payout: liquidation.payout,
    });
  } catch (error) {
    next(error);
  }
}
