/*
 * Supabase connection for the Novelty Ola website and admin panel.
 *
 * Fill these in from Supabase → Project Settings → API:
 *   SUPABASE_URL      = "Project URL"        (https://xxxx.supabase.co)
 *   SUPABASE_ANON_KEY = "anon public" key
 *
 * Both values are safe to publish: the anon key can only do what the
 * database security rules in supabase/schema.sql allow.
 * Never put the "service_role" key here.
 */
window.NOVELTY_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  IMAGE_BUCKET: "site-images"
};
