export type CommunityType = "whatsapp" | "discord" | "telegram" | "slack";

export interface Community {
  id: string;
  name: string;
  type: CommunityType;
  url: string;
  language?: string;
  description?: string;
}

export interface CommunitiesConfig {
  communities: Community[];
  title?: string;
  description?: string;
}

