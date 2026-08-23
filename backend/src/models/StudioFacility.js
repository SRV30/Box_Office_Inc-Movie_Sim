import mongoose from "mongoose";

const studioFacilitySchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      required: true,
      index: true,
    },
    facilityType: {
      type: String,
      required: true,
      enum: ["SOUNDSTAGE_COMPLEX", "VFX_VIRTUAL_PRODUCTION_LED", "POST_PRODUCTION_SUITE", "BACKLOT_SET"],
    },
    tierLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    maintenanceCostPerWeek: {
      type: Number,
      required: true,
      default: 10000,
    },
    qualityBoost: {
      type: Number,
      default: 5,
    },
    rentalIncomePerWeek: {
      type: Number,
      default: 15000,
    },
    isRentedToThirdParty: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

studioFacilitySchema.index({ studioId: 1, facilityType: 1 }, { unique: true });

const StudioFacility = mongoose.model("StudioFacility", studioFacilitySchema);
export default StudioFacility;
