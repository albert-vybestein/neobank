import { beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { POST as postContact } from "@/app/api/contact/route";
import { resetTestState } from "@/tests/integration/helpers";

function buildRequest(payload: unknown, ip = "127.0.0.1") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("contact api", () => {
  beforeEach(async () => {
    await resetTestState();
  });

  it("accepts valid submissions", async () => {
    const response = await postContact(
      buildRequest({
        name: "Alexis",
        email: "alexis@example.com",
        message: "I would like to discuss an enterprise integration.",
        website: ""
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toContain("contact_");
  });

  it("enforces rate limiting", async () => {
    for (let index = 0; index < 5; index += 1) {
      await postContact(
        buildRequest(
          {
            name: `Alexis ${index}`,
            email: `alexis+${index}@example.com`,
            message: "I would like to discuss an enterprise integration.",
            website: ""
          },
          "8.8.8.8"
        )
      );
    }

    const limited = await postContact(
      buildRequest(
        {
          name: "Rate Limited",
          email: "limited@example.com",
          message: "I would like to discuss an enterprise integration.",
          website: ""
        },
        "8.8.8.8"
      )
    );

    expect(limited.status).toBe(429);
  });
});
