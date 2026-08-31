import NewsItem from "../models/NewsItem.js";

export const getNews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.sentiment) query.sentiment = req.query.sentiment;
    if (req.query.region) query.region = req.query.region;

    const total = await NewsItem.countDocuments(query);
    const news = await NewsItem.find(query)
      .sort({ week: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNewsDetail = async (req, res) => {
  try {
    const newsItem = await NewsItem.findById(req.params.id).lean();
    if (!newsItem) {
      return res.status(404).json({ success: false, message: "News article not found" });
    }
    res.status(200).json({ success: true, newsItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
