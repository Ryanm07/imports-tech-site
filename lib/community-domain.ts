export type ProfileRole = "user" | "moderator" | "admin";
export type ProfileStatus = "active" | "blocked" | "banned" | "deleted";

export type PublicAuthor = {
  id: string;
  displayName: string;
};

export type PublicTopic = {
  id: string;
  category: string;
  title: string;
  body: string;
  author: PublicAuthor;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicReply = {
  id: string;
  topicId: string;
  body: string;
  author: PublicAuthor;
  createdAt: string;
  updatedAt: string;
};

type PublicTopicRow = Omit<PublicTopic, "author"> & {
  authorId: string;
  authorDisplayName: string;
};

type PublicReplyRow = Omit<PublicReply, "author"> & {
  authorId: string;
  authorDisplayName: string;
};

export function toPublicTopic(row: PublicTopicRow): PublicTopic {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    author: { id: row.authorId, displayName: row.authorDisplayName },
    replyCount: row.replyCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicReply(row: PublicReplyRow): PublicReply {
  return {
    id: row.id,
    topicId: row.topicId,
    body: row.body,
    author: { id: row.authorId, displayName: row.authorDisplayName },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function publicCommunityPayload(
  topics: PublicTopicRow[],
  replies: PublicReplyRow[] = [],
) {
  return {
    topics: topics.map(toPublicTopic),
    replies: replies.map(toPublicReply),
  };
}

export function canModerate(role: ProfileRole) {
  return role === "moderator" || role === "admin";
}

export function canManageRoles(role: ProfileRole) {
  return role === "admin";
}

export function canManageSettings(role: ProfileRole) {
  return role === "admin";
}

export function canChangeRole(input: {
  actorId: string;
  actorRole: ProfileRole;
  targetId: string;
  nextRole: ProfileRole;
  currentTargetRole: ProfileRole;
  adminCount: number;
}) {
  if (!canManageRoles(input.actorRole)) return false;
  if (input.actorId === input.targetId) return false;
  if (
    input.currentTargetRole === "admin" &&
    input.nextRole !== "admin" &&
    input.adminCount <= 1
  ) {
    return false;
  }
  return true;
}

export type ProfileState = {
  status: ProfileStatus;
  blockType: "temporary" | "permanent" | null;
  blockedUntil: string | null;
};

export function resolveProfileState(profile: ProfileState, now = new Date()) {
  if (profile.status === "banned" || profile.status === "deleted") {
    return { allowed: false, shouldActivate: false };
  }
  if (profile.status !== "blocked") {
    return { allowed: true, shouldActivate: false };
  }
  if (profile.blockType === "permanent") {
    return { allowed: false, shouldActivate: false };
  }
  const blockedUntil = profile.blockedUntil
    ? new Date(profile.blockedUntil).getTime()
    : Number.POSITIVE_INFINITY;
  if (blockedUntil > now.getTime()) {
    return { allowed: false, shouldActivate: false };
  }
  return { allowed: true, shouldActivate: true };
}
