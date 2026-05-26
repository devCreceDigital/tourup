import type { NotificationsApiPort } from "../ports/api";
import type { NotificationsCapability } from "../domain/capability";

export class NotificationsServiceApi implements NotificationsApiPort {
  constructor(private readonly baseUrl: string) {}

  async getCapability(): Promise<NotificationsCapability> {
    const response = await fetch(`${this.baseUrl}/notifications/capability`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("notifications capability request failed.");
    }
    return response.json() as Promise<NotificationsCapability>;
  }
}
