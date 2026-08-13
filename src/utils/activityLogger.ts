import { ActivityLog, ActivityType } from "../models/ActivityLog";

export const logActivity = async (
  type: ActivityType,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  await ActivityLog.create({ type, message, metadata });
};
