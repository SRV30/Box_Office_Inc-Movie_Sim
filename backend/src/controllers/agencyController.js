import TalentAgency from "../models/TalentAgency.js";
import Studio from "../models/Studio.js";
import { calculatePackageDiscount, evaluatePackageCommission } from "../services/simulation/engines/agencyEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";

export const getStudioAgencies = async (req, res, next) => {
  try {
    const agencies = await TalentAgency.find({ studioId: req.user.studioId });
    return res.status(200).json({ success: true, data: agencies });
  } catch (error) {
    next(error);
  }
};

export const signAgencyPackage = async (req, res, next) => {
  try {
    const { agencyName, packageValue, talentCount } = req.body;
    let agency;
    let discountInfo;
    let costInfo;

    await withTransaction(async (session) => {
      agency = await TalentAgency.findOne({ studioId: req.user.studioId, agencyName }).session(session);
      if (!agency) {
        const [newAgency] = await TalentAgency.create(
          [
            {
              studioId: req.user.studioId,
              agencyName,
              relationshipScore: 50,
            },
          ],
          { session }
        );
        agency = newAgency;
      }

      discountInfo = calculatePackageDiscount(agency.relationshipScore, talentCount);
      costInfo = evaluatePackageCommission(packageValue, discountInfo.discountPercentage);

      const studio = await Studio.findById(req.user.studioId).session(session);
      if (!studio) {
        const error = new Error("Studio not found");
        error.statusCode = 404;
        throw error;
      }

      if (studio.money < costInfo.finalPrice) {
        const error = new Error("Insufficient studio funds for talent agency package deal");
        error.statusCode = 400;
        throw error;
      }

      studio.money -= costInfo.finalPrice;
      await studio.save({ session });

      agency.packagedDealsCount += 1;
      agency.relationshipScore = Math.min(100, agency.relationshipScore + 5);
      agency.tier = discountInfo.relationshipTier;
      await agency.save({ session });
    });

    return res.status(201).json({
      success: true,
      message: `Talent package successfully signed with ${agencyName}`,
      data: { agency, costInfo, discountInfo },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
