const supportedPrivyMethods = ["passkey", "google", "twitter", "wallet"] as const;

export type PrivyLoginMethod = (typeof supportedPrivyMethods)[number];

export type PrivyLoginMethodConfig = {
  hasExplicitConfiguration: boolean;
  methods: PrivyLoginMethod[];
};

export function getPrivyLoginMethodConfig(): PrivyLoginMethodConfig {
  const raw = process.env.NEXT_PUBLIC_PRIVY_LOGIN_METHODS?.trim();
  if (!raw) {
    return {
      hasExplicitConfiguration: false,
      methods: []
    };
  }

  const normalized = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => (value === "x" ? "twitter" : value));

  const methods = Array.from(new Set(normalized)).filter((value): value is PrivyLoginMethod =>
    (supportedPrivyMethods as readonly string[]).includes(value)
  );

  return {
    hasExplicitConfiguration: true,
    methods
  };
}
