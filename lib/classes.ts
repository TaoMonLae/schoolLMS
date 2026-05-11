import { Prisma } from "@prisma/client";

export function normalizeClassName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function classMutationErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A class with this name already exists for that academic year.";
  }
  return "Class could not be saved. Please check the form and try again.";
}
