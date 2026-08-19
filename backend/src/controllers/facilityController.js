import StudioFacility from "../models/StudioFacility.js";
import Studio from "../models/Studio.js";
import { calculateFacilityUpgrade } from "../services/simulation/engines/facilityEngine.js";

export const getStudioFacilities = async (req, res, next) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    const studioId = studio ? studio._id : req.user.studioId;
    if (!studioId) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    const facilities = await StudioFacility.find({ studioId });
    return res.status(200).json({ success: true, data: facilities });
  } catch (error) {
    next(error);
  }
};

export const buildFacility = async (req, res, next) => {
  try {
    const { facilityType } = req.body;
    const studio = await Studio.findOne({ owner: req.user._id });
    const studioId = studio ? studio._id : req.user.studioId;
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const existing = await StudioFacility.findOne({ studioId, facilityType });
    const currentTier = existing ? existing.tierLevel : 0;
    const upgradeDetails = calculateFacilityUpgrade(facilityType, currentTier || 1);

    if (studio.money < upgradeDetails.cost) {
      return res.status(400).json({ success: false, message: "Insufficient studio funds to build facility" });
    }

    studio.money -= upgradeDetails.cost;
    await studio.save();

    let facility;
    if (existing) {
      existing.tierLevel = upgradeDetails.nextTier;
      existing.qualityBoost = upgradeDetails.qualityBoost;
      existing.maintenanceCostPerWeek = upgradeDetails.maintenanceCostPerWeek;
      existing.rentalIncomePerWeek = upgradeDetails.rentalIncomePerWeek;
      facility = await existing.save();
    } else {
      facility = await StudioFacility.create({
        studioId,
        facilityType,
        tierLevel: 1,
        qualityBoost: upgradeDetails.qualityBoost,
        maintenanceCostPerWeek: upgradeDetails.maintenanceCostPerWeek,
        rentalIncomePerWeek: upgradeDetails.rentalIncomePerWeek,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Facility ${facilityType} successfully commissioned`,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFacilityRental = async (req, res, next) => {
  try {
    const { facilityId, isRentedToThirdParty } = req.body;
    const studio = await Studio.findOne({ owner: req.user._id });
    const studioId = studio ? studio._id : req.user.studioId;

    const facility = await StudioFacility.findOne({ _id: facilityId, studioId });
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    facility.isRentedToThirdParty = isRentedToThirdParty;
    await facility.save();

    return res.status(200).json({
      success: true,
      message: `Facility third-party rental status updated to ${isRentedToThirdParty}`,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};
