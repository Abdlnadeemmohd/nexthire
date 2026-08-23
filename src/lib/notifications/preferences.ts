import { prisma } from "../prisma";
import { NotificationCategory, DigestFrequency } from "../events/types";

export interface UserPreferencesMap {
  APPLICATIONS: boolean;
  MESSAGES: boolean;
  INTERVIEWS: boolean;
  JOBS: boolean;
  TALENT_INTELLIGENCE: boolean;
  BILLING: boolean;
  SECURITY: boolean; // Always true, locked
  SYSTEM: boolean;
}

export interface UserNotificationPreferencesData {
  userId: string;
  emailEnabled: boolean;
  preferences: UserPreferencesMap;
  digestFrequency: DigestFrequency;
  updatedAt: Date;
}

export const DEFAULT_CATEGORY_PREFERENCES: UserPreferencesMap = {
  APPLICATIONS: true,
  MESSAGES: true,
  INTERVIEWS: true,
  JOBS: true,
  TALENT_INTELLIGENCE: true,
  BILLING: true,
  SECURITY: true,
  SYSTEM: true,
};

/**
 * Security and account-critical categories that cannot be disabled
 */
export const MANDATORY_CATEGORIES: NotificationCategory[] = ["SECURITY"];

/**
 * Checks if a category is mandatory and cannot be opted out of
 */
export function isCategoryMandatory(category: NotificationCategory): boolean {
  return MANDATORY_CATEGORIES.includes(category);
}

/**
 * Retrieves or initializes persistent server-side preferences for a user
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<UserNotificationPreferencesData> {
  let record = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!record) {
    try {
      record = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          preferences: JSON.stringify(DEFAULT_CATEGORY_PREFERENCES),
          digestFrequency: "WEEKLY",
        },
      });
    } catch (e) {
      // Handle potential race condition on initial creation
      record = await prisma.notificationPreference.findUnique({
        where: { userId },
      });
    }
  }

  let parsedPrefs: UserPreferencesMap = { ...DEFAULT_CATEGORY_PREFERENCES };
  if (record?.preferences) {
    try {
      const stored = JSON.parse(record.preferences);
      parsedPrefs = {
        ...DEFAULT_CATEGORY_PREFERENCES,
        ...stored,
        SECURITY: true, // Always locked to true
      };
    } catch (err) {
      parsedPrefs = { ...DEFAULT_CATEGORY_PREFERENCES };
    }
  }

  return {
    userId,
    emailEnabled: record?.emailEnabled ?? true,
    preferences: parsedPrefs,
    digestFrequency: (record?.digestFrequency as DigestFrequency) || "WEEKLY",
    updatedAt: record?.updatedAt || new Date(),
  };
}

/**
 * Updates persistent server-side notification preferences with mandatory override enforcement
 */
export async function updateUserNotificationPreferences(
  userId: string,
  updates: {
    emailEnabled?: boolean;
    digestFrequency?: DigestFrequency;
    preferences?: Partial<UserPreferencesMap>;
  }
): Promise<UserNotificationPreferencesData> {
  const current = await getUserNotificationPreferences(userId);

  const updatedPrefs: UserPreferencesMap = {
    ...current.preferences,
    ...(updates.preferences || {}),
    SECURITY: true, // Enforce locked security override
  };

  const updatedRecord = await prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      emailEnabled: updates.emailEnabled ?? current.emailEnabled,
      preferences: JSON.stringify(updatedPrefs),
      digestFrequency: updates.digestFrequency ?? current.digestFrequency,
    },
    update: {
      emailEnabled: updates.emailEnabled ?? current.emailEnabled,
      preferences: JSON.stringify(updatedPrefs),
      digestFrequency: updates.digestFrequency ?? current.digestFrequency,
    },
  });

  return {
    userId,
    emailEnabled: updatedRecord.emailEnabled,
    preferences: updatedPrefs,
    digestFrequency: updatedRecord.digestFrequency as DigestFrequency,
    updatedAt: updatedRecord.updatedAt,
  };
}
