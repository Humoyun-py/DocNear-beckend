# Netlify deployment

Deploy each React client as a separate Netlify site and set its base directory
to `web/patient`, `web/doctor`, `web/admin`, or `web/clinic-owner`. Every app's
`netlify.toml` runs `npm run build`, publishes `dist`, and enables the React SPA
fallback. Set `VITE_API_BASE_URL` to the production HTTPS API URL in each site;
never place backend credentials in a Vite environment variable.
