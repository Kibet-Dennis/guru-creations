# guru-creations

## Paid guest posts

The standalone journal at `blog1.html` supports paid guest-post submissions with up to 5 photos (10 MB each) and 1 video (100 MB maximum), including political articles and poster artwork. Guest posts publish automatically only after the selected payment provider confirms the exact plan price. A post and its public media remain available for the selected 24-hour, 3-day, 7-day, or 30-day term, then are removed by the scheduled cleanup function. The public article feed reads only currently published posts from Supabase; the existing `posts.json` entries remain the journal's built-in articles.

Publishing uses Supabase Edge Functions, PostgreSQL and private Supabase Storage uploads because GitHub Pages cannot safely create payment sessions or verify payment-provider callbacks. Uploads stay private before payment. The backend checks each uploaded file’s bucket, size, declared type and file signature before starting payment, then publishes it to the read-only public media bucket only after payment confirmation. Keep every provider secret and the Supabase service-role key in Supabase Function Secrets; never put them in browser JavaScript.

Common profanity is checked as writers type and checked again on the server in the author name, title, summary, and article. The checks are a basic blocklist, not a complete moderation system; poster and video image text is not OCR-scanned, so use human review or add a trusted OCR/moderation service before relying on checks for text embedded in media. Political posts are accepted under `Politics & Elections`.

### Setup

1. Create a Supabase project and apply the three migrations in order: `supabase/migrations/202610150001_paid_blog_posts.sql`, `supabase/migrations/202610150002_private_blog_media.sql`, then `supabase/migrations/202610150003_politics_category.sql`.
2. Set `supabaseUrl` and the project’s public anon key in `JS/blog-config.js`. The anon key is intended for browser use; do not put the service-role key there. Submissions stay disabled until these public project settings are configured, and the server functions and payment-provider secrets below must also be deployed before accepting payments.
3. Deploy the functions in `supabase/functions/` to the project. Set the Supabase Function Secret `SITE_URL` to the public site base URL, for example `https://example.github.io/guru-creations` for a GitHub Pages project site, with no trailing slash. From a machine with the Supabase CLI linked to the project, deploy `mpesa-quote`, `prepare-post-upload`, `create-post-checkout`, `verify-mpesa-payment`, `mpesa-callback`, `capture-paypal-order`, `confirm-stripe-session`, `stripe-webhook`, and `cleanup-blog-posts`.
4. Add provider credentials as Supabase Function Secrets:

   - Stripe: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Register `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` as a Stripe webhook for `checkout.session.completed`.
   - PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_ENVIRONMENT` (`sandbox` or `production`).
   - M-Pesa Daraja: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_SECRET`, and `MPESA_ENVIRONMENT` (`sandbox` or `production`). Generate `MPESA_CALLBACK_SECRET` as a long random value (at least 32 characters), for example with `openssl rand -hex 32`. Use `CustomerPayBillOnline` by default; set `MPESA_TRANSACTION_TYPE` if the shortcode is configured for a different Daraja transaction type. The callback URL is formed by the function and protected by the callback secret.
   - Cleanup: `BLOG_CLEANUP_SECRET`, generated as a long random value, for example with `openssl rand -hex 32`.
5. Test with provider sandbox credentials before accepting real payments. M-Pesa plans are converted from USD to KES using the current public USD/KES rate and rounded to the nearest shilling; the checkout form displays the quote before submission.
6. Schedule `cleanup-blog-posts` in the Supabase Dashboard to run every 15 minutes. Send `POST` requests with `Authorization: Bearer <BLOG_CLEANUP_SECRET>`. This removes expired/abandoned posts, media and old rate-limit hashes; without the schedule, expired media can remain in storage.

Set secrets from the linked project with the Supabase CLI, for example:

```sh
supabase secrets set SITE_URL="https://example.github.io/guru-creations"
supabase secrets set BLOG_CLEANUP_SECRET="..."
supabase secrets set STRIPE_SECRET_KEY="..." STRIPE_WEBHOOK_SECRET="..."
supabase secrets set PAYPAL_CLIENT_ID="..." PAYPAL_CLIENT_SECRET="..." PAYPAL_ENVIRONMENT="sandbox"
supabase secrets set MPESA_CONSUMER_KEY="..." MPESA_CONSUMER_SECRET="..." MPESA_SHORTCODE="..." MPESA_PASSKEY="..." MPESA_CALLBACK_SECRET="<generated-long-random-value>" MPESA_ENVIRONMENT="sandbox"
```

Replace example values locally; never commit actual credentials. `SITE_URL` may include the GitHub Pages repository path, but no trailing slash.

The plans are $2 for 24 hours, $5 for 3 days, $10 for 7 days, and $25 for 30 days. Payment verification and publishing happen server-side; public clients cannot create or edit paid posts directly. The article dialog safely displays approved image and video formats as media, never as executable HTML.
