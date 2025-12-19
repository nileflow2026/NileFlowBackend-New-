function renderAnnouncementNewsletter({ subject, message, year }) {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4ff; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 20px; }
        .header { background-color: #1a202c; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; font-size: 16px; color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
        </div>
        <p style="text-align:center; font-size:12px;">&copy; ${year} Nile Flow. All rights reserved.</p>
      </div>
    </body>
  </html>
  `;
}

module.exports = renderAnnouncementNewsletter;
