import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function() {
                return !this.googleId},
      minlength: 6,
    },

    googleId: {
    type: String,
    default: null,
    },

    authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
    },

    refreshTokens: [
      {
        tokenHash: {
          type: String,
          required: true,
          index: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],

    isDisabled: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["player", "admin", "operations"],
      default: "player",
    },

    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Studio",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
