function renderPromotionNewsletter({
  subject,
  bannerUrl,
  ctaText,
  ctaLink,
  year,
}) {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4ff; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; text-align: center; padding: 20px; }
        .banner { width: 100%; border-radius: 8px; }
        .cta-button { display: inline-block; background-color: #e47d2b; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${subject}</h1>
        <img src="${bannerUrl}" alt="Promotion Banner" class="banner"/>
        <div>
          <a href="${ctaLink}" class="cta-button">${ctaText}</a>
        </div>
        <p style="font-size:12px;">&copy; ${year} Nile Flow. All rights reserved.</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = renderPromotionNewsletter;
