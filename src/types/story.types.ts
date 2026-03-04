export type StoryType = 'photo' | 'video' | 'audio' | 'location';
// Durée en minutes (30min à 3 jours = 4320 minutes)
export type StoryDuration = number;

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: StoryType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  duration: StoryDuration;
  caption?: string;
  createdAt: any;
  expiresAt: any;
  views: string[];
  replies: StoryReply[];
}

export interface StoryReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  createdAt: any;
}

export interface ContactStories {
  userId: string;
  userName: string;
  userAvatar?: string;
  stories: Story[];
  hasUnviewed: boolean;
  lastStoryTime: any;
}
