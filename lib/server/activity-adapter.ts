import { randomUUID } from "node:crypto";

import { appendJsonItem } from "@/lib/server/json-store";
import type {
  AnalyticsEventInput,
  ContactSubmissionInput,
  PredictionOrderInput,
  TradeOrderInput
} from "@/lib/validation";

type StoredContactSubmission = ContactSubmissionInput & {
  id: string;
  createdAt: string;
};

type StoredAnalyticsEvent = AnalyticsEventInput & {
  id: string;
  createdAt: string;
};

type StoredTradeOrder = TradeOrderInput & {
  id: string;
  createdAt: string;
  status: "accepted";
};

type StoredPredictionOrder = PredictionOrderInput & {
  id: string;
  createdAt: string;
  status: "accepted";
};

function createRecordId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export async function saveContactSubmission(input: ContactSubmissionInput) {
  const submission: StoredContactSubmission = {
    ...input,
    id: createRecordId("contact"),
    createdAt: new Date().toISOString()
  };

  await appendJsonItem("contact-submissions.json", submission);
  return submission;
}

export async function saveAnalyticsEvent(input: AnalyticsEventInput) {
  const event: StoredAnalyticsEvent = {
    ...input,
    id: createRecordId("event"),
    createdAt: new Date().toISOString()
  };

  await appendJsonItem("analytics-events.json", event);
  return event;
}

export async function saveTradeOrder(input: TradeOrderInput) {
  const order: StoredTradeOrder = {
    ...input,
    id: createRecordId("trade"),
    createdAt: new Date().toISOString(),
    status: "accepted"
  };

  await appendJsonItem("trade-orders.json", order);
  return order;
}

export async function savePredictionOrder(input: PredictionOrderInput) {
  const order: StoredPredictionOrder = {
    ...input,
    id: createRecordId("prediction"),
    createdAt: new Date().toISOString(),
    status: "accepted"
  };

  await appendJsonItem("prediction-orders.json", order);
  return order;
}
