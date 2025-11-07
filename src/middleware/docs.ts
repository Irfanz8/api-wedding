import { Context } from 'hono'
import { apiDocumentation } from '../api-docs'

export const serveApiDocs = async (c: Context) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Wedding Invitation API - Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/api-docs-json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
            });
          };
        </script>
      </body>
    </html>
  `
  return c.html(html)
}

export const serveApiDocsJson = async (c: Context) => {
  return c.json(apiDocumentation)
}