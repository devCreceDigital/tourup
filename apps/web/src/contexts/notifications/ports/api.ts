import type { NotificationsCapability } from "../domain/capability";

export interface NotificationsApiPort {
  getCapability(): Promise<NotificationsCapability>;
}
