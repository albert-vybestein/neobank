type ErrorPayload = {
  error?: string;
};

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as ErrorPayload;
    return parsed.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function postJson<TRequest, TResponse>(url: string, payload: TRequest): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Request failed"));
  }

  return (await response.json()) as TResponse;
}

export async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Request failed"));
  }

  return (await response.json()) as TResponse;
}
