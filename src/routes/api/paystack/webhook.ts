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

          // TODO: idempotent credit — e.g.
          // const existing = await db.transactions.findByReference(tx.reference);
          // if (existing) return new Response("OK", { status: 200 }); // already processed
          // await db.transaction(async (trx) => {
          //   await trx.transactions.insert({ reference: tx.reference, amountKobo: tx.amount, status: "success" });
          //   await trx.wallets.credit({ email: tx.customer.email, amountKobo: tx.amount });
          // });
        }

        // Always 200 quickly, or Paystack will retry the same event repeatedly
        return new Response("OK", { status: 200 });
      },
    },
  },
});