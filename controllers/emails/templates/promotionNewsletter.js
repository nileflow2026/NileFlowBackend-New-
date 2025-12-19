function renderProductNewsletter({ subject, products, year }) {
  const productCardsHtml = products
    .map(
      (product) => `
    <div class="product-card">
        <img src="${product.image}" alt="${product.productName}"> 
        <h3>${product.productName}</h3>
        <p>KES${product.price.toFixed(2)}</p>
        <a href="https://nileflowafrica.com/featured-products/${
          product.productId
        }" 
           style="display: inline-block; background-color: #e47d2b; color: #fff; padding: 8px 12px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; font-size: 14px;">
           View Product
        </a>
    </div>
  `
    )
    .join("");

  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4ff; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; }
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .product-card { text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 10px; }
        .product-card img { width: 100%; height: auto; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${subject}</h1>
        <div class="product-grid">${productCardsHtml}</div>
        <p>&copy; ${year} Nile Flow. All rights reserved.</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = renderProductNewsletter;
