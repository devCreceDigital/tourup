import type { NotificationsApiPort } from "../ports/api";

export class LoadNotificationsCapability {
  constructor(private readonly api: NotificationsApiPort) {}

  execute() {
    return this.api.getCapability();
  }
}
