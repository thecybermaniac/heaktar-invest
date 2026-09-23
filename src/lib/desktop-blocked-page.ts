export function renderDesktopBlockedPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Please use your phone — Heaktar Nigeria</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">📱</div>
      <h1>Heaktar Nigeria is mobile-only</h1>
      <p>Please open this link on your phone's browser to sign in and manage your investments.</p>
    </div>
  </body>
</html>`;
}
