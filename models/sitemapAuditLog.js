const mongoose = require("mongoose");

const sitemapAuditLogSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    redirectTarget: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      enum: ["removed", "flagged"],
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    auditRunId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for quick lookups by run and by URL
sitemapAuditLogSchema.index({ auditRunId: 1 });
sitemapAuditLogSchema.index({ url: 1, createdAt: -1 });

module.exports = mongoose.model("SitemapAuditLog", sitemapAuditLogSchema);
