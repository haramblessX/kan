import type Stripe from "stripe";

import type { dbClient } from "@kan/db/client";
import * as userRepo from "@kan/db/repository/user.repo";
import { notificationClient } from "@kan/email";
import { createLogger } from "@kan/logger";
import { createEmailUnsubscribeLink } from "@kan/shared";

const log = createLogger("auth");

// Subscription type for Supabase (replaces @better-auth/stripe)
interface Subscription {
  id: string;
  stripeCustomerId?: string | null;
  status: string;
  priceId?: string | null;
  currentPeriodEnd?: Date | null;
  currentPeriodStart?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function triggerWorkflow(
  db: dbClient,
  workflowId: string,
  subscription: Subscription,
  cancellationDetails?: Stripe.Subscription.CancellationDetails | null,
) {
  try {
    if (!subscription.stripeCustomerId || !notificationClient) return;

    const user = await userRepo.getByStripeCustomerId(
      db,
      subscription.stripeCustomerId,
    );

    if (!user || !notificationClient) return;

    const unsubscribeUrl = await createEmailUnsubscribeLink(user.id);

    log.info({ workflowId, userId: user.id }, "Triggering Novu workflow");
    await notificationClient.trigger({
      to: {
        subscriberId: user.id,
      },
      payload: {
        ...subscription,
        cancellationDetails,
        emailUnsubscribeUrl: unsubscribeUrl,
      },
      workflowId,
    });
    log.info({ workflowId, userId: user.id }, "Novu workflow triggered");
  } catch (error) {
    log.error({ err: error, workflowId }, "Error triggering workflow");
  }
}
