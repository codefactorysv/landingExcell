# Excell Solutions Landing

Static landing page served by a lightweight Node.js + Express backend. The backend exposes `POST /api/send-estimate` and sends estimate requests through Resend.

## Requirements

- Node.js 18.17 or newer
- A Resend API key
- A sender address or domain authorized by Resend

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:

   ```env
   RESEND_API_KEY=your_resend_api_key
   CONTACT_EMAIL=codefactorysvsv@gmail.com
   FROM_EMAIL=Excell Solutions <your_verified_sender@example.com>
   PORT=8000
   TRUST_PROXY=1
   ALLOWED_ORIGINS=
   ```

3. Start the server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:8000`.

Use `npm start` instead of `npm run dev` for production. Run the automated API tests with:

```bash
npm test
```

## VPS deployment

Run the Node server behind a reverse proxy such as Nginx and forward the public domain to the port configured in `PORT`. The landing and API are served from the same process, so the frontend uses the portable relative endpoint `/api/send-estimate` and does not require permissive CORS.

Set `TRUST_PROXY` to the number of reverse proxies in front of Node. If the frontend is intentionally hosted on a different origin, list the approved origins in `ALLOWED_ORIGINS`, separated by commas.

Static-only hosting such as GitHub Pages cannot execute the contact backend. The complete form works when the project is started with Node on the VPS or another Node-compatible host.

## Security

- Never commit `.env` or expose `RESEND_API_KEY` in browser code.
- Keep `FROM_EMAIL` set to a sender authorized by Resend.
- Change `CONTACT_EMAIL` without modifying application code.
- The endpoint validates all fields, escapes email content, uses a honeypot, limits request size, checks origins, and rate-limits submissions.
