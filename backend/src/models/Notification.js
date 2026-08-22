import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  gameStateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameState",
    required: true,
  },
  type: {
    type: String,
    default: "SYSTEM",
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

notificationSchema.index({ gameStateId: 1, createdAt: -1 });
notificationSchema.index({ gameStateId: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
