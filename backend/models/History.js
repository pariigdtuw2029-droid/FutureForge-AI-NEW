const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumeName: {
      type: String,
    },

    skills: {
      type: [String],
      default: [],
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    atsScore: {
      type: Number,
      default: 0,
    },

    recommendedProjects: {
      type: [String],
      default: [],
    },

    roadmap: {
      type: Object,
      default: {},
    },

    jobDescription: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("History", historySchema);