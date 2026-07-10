const History = require("../models/History");

// Get all history of logged-in user
exports.getHistory = async (req, res) => {
  try {
    const history = await History.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get dashboard statistics
exports.getDashboard = async (req, res) => {
  try {
    const history = await History.find({
      user: req.user.id,
    });

    const totalResumes = history.length;

    const highestATS =
      history.length > 0
        ? Math.max(...history.map((h) => h.atsScore))
        : 0;

    const averageATS =
      history.length > 0
        ? (
            history.reduce((sum, h) => sum + h.atsScore, 0) /
            history.length
          ).toFixed(2)
        : 0;

    const latestHistory =
      history.length > 0
        ? history[history.length - 1]
        : null;

    res.status(200).json({
      success: true,
      dashboard: {
        totalResumes,
        highestATS,
        averageATS,
        latestHistory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};