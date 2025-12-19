const renderProductNewsletter = require("./templates/productNewsletter");
const renderAnnouncementNewsletter = require("./templates/announcementNewsletter");
const renderPromotionNewsletter = require("./templates/promotionNewsletter");

function renderNewsletter({ campaignType, data }) {
  const year = new Date().getFullYear();

  switch (campaignType) {
    case "products":
      return renderProductNewsletter({ ...data, year });

    case "announcement":
      return renderAnnouncementNewsletter({ ...data, year });

    case "promotion":
      return renderPromotionNewsletter({ ...data, year });

    default:
      throw new Error("Invalid campaign type");
  }
}

module.exports = renderNewsletter;
