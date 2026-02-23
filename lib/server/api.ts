import { ZodError } from "zod";

export function getValidationMessage(error: unknown) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    if (issue) return issue.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request could not be processed";
}
