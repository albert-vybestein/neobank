import { ZodError } from "zod";

const MAX_PUBLIC_ERROR_LENGTH = 220;

function sanitizeErrorMessage(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.toLowerCase().includes("debug:")) {
    return "Request could not be verified.";
  }
  if (compact.length > MAX_PUBLIC_ERROR_LENGTH) {
    return `${compact.slice(0, MAX_PUBLIC_ERROR_LENGTH)}...`;
  }
  return compact;
}

export function getValidationMessage(error: unknown) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    if (issue) return issue.message;
  }

  if (error instanceof Error) {
    const safeMessage = sanitizeErrorMessage(error.message);
    if (safeMessage) return safeMessage;
  }

  return "Request could not be processed";
}
