import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";

export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYSTACK_SECRET_KEY"];
        if (!secret) {
          return new Response("Server misconfigured", { status: 500 });
        }

        const rawBody = await request.text();

        // Paystack signs the raw body with your secret key — verify before trusting anything
        const signature = request.headers.get("x-paystack-signature");
        const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

        if (!signature || signature !== expected) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(rawBody) as {
          event: string;
          data: {
            reference: string;
            amount: number; // kobo
            currency: string;
            status: string;
            customer: { email: string };
            paid_at: string | null;
          };
        };

        if (event.event === "charge.success") {
          const tx = event.data;

          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { creditDeposit } = await import("@/lib/portfolio.server");

            const { data: profile, error: lookupError } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("email", tx.customer.email)
              .maybeSingle();

            if (lookupError) {
              console.error("[paystack webhook] profile lookup failed", lookupError.message);
            } else if (!profile) {
              console.error("[paystack webhook] no profile found for email", tx.customer.email);
            } else {
              // creditDeposit re-verifies the reference against Paystack's own API before
              // crediting anything — never trust the webhook payload's amount directly —
              // and is idempotent on duplicate reference. That idempotency is what makes it
              // safe to call from both here and /deposit/callback for the same reference:
              // whichever arrives first credits the wallet, the other is a harmless no-op.
              // This is the actual point of the webhook — it credits the deposit even if the
              // person never makes it back to /deposit/callback at all (closed the tab,
              // lost signal on the redirect, etc.), which a callback-only flow can't cover.
              await creditDeposit(supabaseAdmin, profile.id, tx.reference);
            }
          } catch (err) {
            // Still ack with 200 below — Paystack retries on non-2xx, and retrying a hard
            // failure (e.g. malformed payload) forever doesn't help. Logged for follow-up.
            console.error("[paystack webhook] failed to credit deposit", err);
          }
        }

        // Always 200 quickly, or Paystack will retry the same event repeatedly
        return new Response("OK", { status: 200 });
      },
    },
  },
});