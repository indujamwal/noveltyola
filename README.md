# Novelty Ola website + admin panel

Website for **www.noveltyola.com**, with an admin panel at **www.noveltyola.com/admin** to manage content, photos and enquiries.

- **Website** – plain HTML, CSS and JavaScript. No build step.
- **Database, logins and photos** – [Supabase](https://supabase.com) (free plan is enough).
- **Hosting** – [Vercel](https://vercel.com), deployed straight from this GitHub repository.
- **Google Sheet + email alerts** (optional) – the Google Apps Script in `google-apps-script/`.

## What you can change in the admin panel

| Section | What it controls |
|---|---|
| Dashboard | New enquiries, today / 7 / 30 day counts, enquiries by outlet |
| Enquiries | Every website enquiry: search, filter, set status (New / Contacted / Booked / Closed), add notes, delete, download CSV |
| Cover & offers | Badge, headline, name, paragraph, tick badges, buttons, big "2027" text, countdown, enquiry popup |
| Models & prices | Add / edit / hide / reorder models, price, EMI, tagline, **upload photos**, choose cover photos |
| Outlets | Cities, area, address, phone, flagship, order |
| Services | The "Everything under one roof" cards and their icons |
| FAQs | Questions and answers |
| Business details | Phone, WhatsApp, address, hours, outlet numbers, outlet/city counts, About text |
| Site settings | Google search title and description, Google Sheet script link |
| Admin users | Who is allowed to sign in |

The website always loads instantly with the built-in content in `js/defaults.js`, then swaps in the latest content from Supabase. If Supabase is ever down, visitors still see a working site.

---

## One-time setup

### 1. Supabase

1. Create a free account at **supabase.com** → **New project**. Name it `novelty-ola`, choose region **Mumbai (ap-south-1)**, set a database password and save it somewhere safe.
2. Open **SQL Editor → New query**. Open `supabase/schema.sql`, change `admin@noveltyola.com` on the last lines to **your own email**, paste the whole file and click **Run**. This creates the tables, security rules, the `site-images` photo bucket and all current website content.
3. Go to **Authentication → Users → Add user → Create new user**. Use the same email and a strong password, and tick **Auto confirm user**.
4. Go to **Authentication → URL Configuration**. Set **Site URL** to `https://www.noveltyola.com` and add `https://www.noveltyola.com/admin/` under **Redirect URLs** (needed for "Forgot password").
5. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key into `js/config.js`:

   ```js
   window.NOVELTY_CONFIG = {
     SUPABASE_URL: "https://xxxxxxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi...",
     IMAGE_BUCKET: "site-images"
   };
   ```

   The anon key is meant to be public; the database rules decide what it can do. **Never** put the `service_role` key in this project.

### 2. GitHub

1. Create a repository called `noveltyola` (Private is fine for Vercel).
2. Upload every file and folder in this project (keep the folder structure), including `js/config.js` with your Supabase details, and commit.

### 3. Vercel

1. Sign in to **vercel.com** with your GitHub account → **Add New → Project** → import `noveltyola`.
2. Framework preset: **Other**. Leave Build Command and Output Directory empty. Click **Deploy**.
3. Open the test link Vercel gives you (`noveltyola.vercel.app`) and check `/admin` signs you in.
4. **Settings → Domains** → add `www.noveltyola.com` and `noveltyola.com`. Vercel shows the DNS records to add.
5. In **GoDaddy → My Products → noveltyola.com → DNS**, remove the old "Parked" A record for `@` and any old `www` record, then add exactly what Vercel shows (usually an **A** record `@` → `76.76.21.21` and a **CNAME** `www` → `cname.vercel-dns.com`). Vercel adds the SSL padlock automatically once DNS is verified.

From then on, every change committed to GitHub goes live on Vercel within about a minute. Content changes made in the admin panel need no deploy at all.

### 4. Google Sheet + email alerts (optional)

Enquiries are always saved in Supabase and shown in the admin panel. To also add them to a Google Sheet and get an email for each one:

1. Open the Google Sheet → **Extensions → Apps Script**, paste `google-apps-script/Code.gs`, and set `SHEET_ID` to the long ID in the sheet's link.
2. Run `testEnquiry` once and allow access, then **Deploy → New deployment → Web app** (Execute as: Me, Who has access: Anyone).
3. Paste the `/exec` link into **Admin → Site settings → Google Sheet script link** and save.

---

## Everyday use

- **Change prices, photos, text, outlets** → sign in at `/admin`, edit, **Save**. The site shows it on the next page load.
- **Seasonal cover** (Lohri, Holi, Diwali…) → *Cover & offers*: change the badge, headline, big text and countdown date.
- **Add another admin** → create their login in Supabase (Authentication → Users), then add their email under *Admin users*.
- **Change design or layout** → edit the files and commit to GitHub; Vercel redeploys automatically.

## Files

```
index.html                 Public website
css/site.css               Website styles
js/config.js               Supabase URL + anon key  ← fill in
js/defaults.js             Built-in content (fallback) and service icons
js/site.js                 Website logic: loads content, forms, popup, countdown
admin/                     Admin panel (index.html, admin.css, admin.js)
assets/models/             Starting model photos
supabase/schema.sql        Database, security rules, photo bucket, starting content
google-apps-script/Code.gs Optional Google Sheet + email alerts
vercel.json                Hosting headers (keeps /admin out of Google)
robots.txt                 Keeps /admin out of search results
```

## Security notes

- Only emails in the `admins` table can change content, upload photos or read enquiries. Signing up is not enough; an existing admin must add the email.
- Visitors can only read live content and submit enquiries (name ≤ 100 characters, valid Indian mobile, message ≤ 1000 characters).
- To stop anyone creating Supabase accounts at all, turn off **Authentication → Providers → Email → Allow new users to sign up** after creating your admin users.
