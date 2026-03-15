import { api } from "@/lib/api";

export async function getSessionClassification(sessionId: string) {
  return api.getSessionClassification(sessionId);
}
