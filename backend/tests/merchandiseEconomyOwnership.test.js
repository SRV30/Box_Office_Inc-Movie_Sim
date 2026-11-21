import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import {
  restockProductInventory,
  updateProductPricing,
  liquidateStock,
} from "../src/controllers/merchandiseEconomyController.js";
import Studio from "../src/models/Studio.js";
import MerchandiseProduct from "../src/models/MerchandiseProduct.js";

test("merchandise economy mutations reject cross-studio product IDs with 404", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const studioAId = new mongoose.Types.ObjectId();
  const foreignProductId = new mongoose.Types.ObjectId();

  const origStudioFindOne = Studio.findOne;
  const origProductFindOne = MerchandiseProduct.findOne;

  Studio.findOne = async () => ({ _id: studioAId, owner: userAId, money: 1000000 });
  MerchandiseProduct.findOne = async (query) => {
    if (query.studioId?.toString() === studioAId.toString()) {
      return null;
    }
    return { _id: foreignProductId, studioId: new mongoose.Types.ObjectId() };
  };

  const req = {
    user: { _id: userAId },
    params: { id: foreignProductId.toString() },
    body: { unitsCount: 5000, retailPrice: 25 },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseBody = data; } };
    },
  };

  await restockProductInventory(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Product not found");

  await updateProductPricing(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Product not found");

  await liquidateStock(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Product not found");

  Studio.findOne = origStudioFindOne;
  MerchandiseProduct.findOne = origProductFindOne;
});
