# Changes Summary

This document summarises all improvements made to both the backend (`CClearn/`) and the mobile app (`CClearn-app/`). Nothing has been committed — these are staged edits for review.

---

## Backend (`apps/backend`)

### New endpoint: `PATCH /auth/me`

Added a profile-update endpoint so users can persist their first name, last name, and profile image URL after upload.

- **`auth.controller.ts`** — added `@Patch('me')` handler that calls `authService.updateProfile`
- **`auth.service.ts`** — added `updateProfile(userId, dto)` that calls `usersService.saveUser`
- **`users.service.ts`** — added `saveUser(user)` wrapper around `repository.save`

### `GET /auth/me` — communities field names corrected

The `AuthCommunity` shape returned by this endpoint previously used `id` and `name`. All consumers (mobile app and web frontend) expected `communityId` and `communityName`, so the field names were corrected to match.

- **`shared-types/src/auth.ts`** — `AuthCommunity`: renamed `id → communityId`, `name → communityName`
- **`auth.service.ts`** — new method `getUserCommunityMemberships` replaces `getUserCommunities`; maps `communityId`/`communityName` explicitly

### `POST /communities/join` — returns Community instead of CommunityMember

The mobile app navigates to the joined community after joining, so the endpoint now returns the full `CommunityDto` (same as `GET /communities/:id`) instead of a `CommunityMemberDto`.

- **`communities.service.ts`** — `joinByCode` now returns `CommunityDto`

### `GET /communities/mine` — returns full Community objects

Previously returned a minimal `{ id, name, role }` shape. Now returns full `CommunityDto[]` so the mobile app can display all community details without a second request.

- **`communities.service.ts`** — `getUserCommunities` now returns `CommunityDto[]`

### Community members — `firstName` and `lastName` added

Member list responses now include `firstName` and `lastName` alongside `userName`, giving clients flexibility in how they display member identity.

- **`shared-types/src/community.ts`** — `CommunityMember`: added `firstName`, `lastName`
- **`communities.service.ts`** — `toMemberDto` now includes `firstName`, `lastName`

### `POST /communities/:id/members` — `role` is optional

The `role` field in `AddMemberDto` is now optional and defaults to `COMMUNITY_MEMBER`, so callers don't need to supply it when inviting a standard member.

- **`dto/add-member.dto.ts`** — `role` decorated with `@IsOptional()`
- **`communities.service.ts`** — `addMember` uses `dto.role ?? CommunityMemberRole.COMMUNITY_MEMBER`

### Announcements — author name fields added

Announcement objects now include `authorFirstName` and `authorLastName` so clients can display who posted each announcement without a separate user lookup.

- **`shared-types/src/announcement.ts`** — `Announcement`: added `authorFirstName`, `authorLastName`
- **`announcements.service.ts`** — all queries now eager-load `author` relation; `toDto` maps `authorFirstName`/`authorLastName`; `create` and `update` re-fetch entity after save to include the relation

### Messages — sender name fields added

Message objects now include `senderFirstName` and `senderLastName` (already had `userName`) for richer display options.

- **`shared-types/src/community.ts`** — `CommunityMessage`: added `senderFirstName`, `senderLastName`
- **`community.service.ts`** — `toDto` maps `senderFirstName`/`senderLastName` from `message.user`

### `totalPages` added to all paginated responses

All paginated list responses now include a `totalPages` field alongside `total`, `page`, and `limit`, making client-side pagination logic simpler.

- **`shared-types/src/api-response.ts`** — `PaginatedResult<T>`: added `totalPages: number`
- **`communities.service.ts`** — `findAll` and `findMembers` include `totalPages`
- **`community.service.ts`** — `findAll` (messages) includes `totalPages`

### Test fixes

Updated unit tests to match the above service changes:

- **`announcements.service.spec.ts`** — mock announcement now has `author` object; `findAll` test checks `relations: { author: true }` and `authorFirstName`; `create`/`update` tests mock the post-save `findOne` call
- **`auth.service.spec.ts`** — mock `communitiesService` renamed from `getUserCommunities` → `getUserCommunityMemberships`; mock `usersService` includes `saveUser`

---

## Shared Types (`packages/shared-types`)

| File | Change |
|------|--------|
| `auth.ts` | `AuthCommunity`: `id → communityId`, `name → communityName` |
| `community.ts` | `CommunityMember`: added `firstName`, `lastName`; `CommunityMessage`: added `senderFirstName`, `senderLastName` |
| `announcement.ts` | `Announcement`: added `authorFirstName`, `authorLastName` |
| `api-response.ts` | `PaginatedResult<T>`: added `totalPages` |

---

## Web Frontend (`apps/frontend`)

Updated to avoid breaking from shared-types field renames:

- **`AuthContext.tsx`** — community lookup uses `c.communityId` (was `c.id`)
- **`AdminLayout.tsx`** — community selector uses `communityId`/`communityName` (was `id`/`name`)
- **`AuthContext.test.tsx`** — mock community updated to `{ communityId, communityName, role }`
- **`CommunityChatPage.tsx`** — chat input `pb` increased from 2 → 3 so the input isn't flush with the bottom edge on mobile browsers

---

## Mobile App (`CClearn-app`)

### Type corrections (`src/types/`)

All local type definitions were brought into sync with the actual backend responses.

| File | Changes |
|------|---------|
| `user.ts` | `CommunityMembership`: removed `id`, kept `communityId`/`communityName`/`role`; `AuthProfile.profileImageUrl` is now `string \| null` |
| `community.ts` | `Community`: `joinCode → code`; added `isActive`, `messageCount`, `announcementCount`, `createdBy`; `description` is `string \| null`; `CommunityMember`: now includes `communityId`, `userName`, `firstName`, `lastName`, `userEmail`; `CommunityStats`: renamed fields to `totalMembers`/`totalMessages`/`totalAnnouncements` |
| `message.ts` | `Message`: `content → message`, `senderId → userId`; added `userName`, `userRole`, `attachmentName`; `SendMessageDto`: `content → message`; added `attachmentName` |
| `announcement.ts` | `Announcement`: `authorId → createdBy`; added `authorFirstName`, `authorLastName` |

### Service fixes (`src/services/`)

- **`auth.ts`** — added `updateProfile({ firstName?, lastName?, profileImageUrl? })` calling `PATCH /auth/me`
- **`communities.ts`** — `joinCommunity` body sends `{ code }` explicitly; `regenerateJoinCode` return type uses `code` field
- **`messages.ts`** — `totalPages` computed from `total / limit` as a fallback

### Screen fixes (`src/screens/`)

**ChatScreen**
- `setText('')` now only called after a successful send (was reset on error too)
- Send payload uses `message` field instead of `content`
- `isOwn` check uses `item.userId` instead of `item.senderId`
- Attachment type sent as `'IMAGE'` (uppercase enum value, was `'image'`)
- Input row bottom padding increased from 6 → 16 so the send button isn't clipped on iOS

**AnnouncementsScreen**
- `handleSave` now wraps the mutation in try/catch and shows an `Alert` on failure (was silently swallowing errors)

**CommunityScreen**
- Join code display uses `community.code` (was `community.joinCode`)
- Stats use `totalMembers`, `totalMessages`, `totalAnnouncements` (were `memberCount`, `messageCount`, `announcementCount`)

**CommunityInfoScreen**
- Join code display uses `community.code`

**MembersScreen**
- Added pagination: `page` state, Next/Previous buttons, page X of Y display
- Search input resets page to 1 on change
- Uses `member.userName` in remove-confirmation Alert

**ProfileScreen**
- After uploading a new profile photo, now calls `updateProfile({ profileImageUrl: upload.url })` then `refreshProfile()` to persist the URL to the backend (was only updating local state)
- Uses `user.profileImageUrl` instead of `user.profileImage`
- Shows `uploadingImage` loading state during upload
- Shows an error `Alert` if the upload fails

### Component fixes (`src/components/`)

- **`ChatMessage.tsx`** — uses `message.message` (was `message.content`)
- **`MemberListItem.tsx`** — displays `member.userName` and `member.userEmail` (was calling `formatName(firstName, lastName)`)
- **`CommunityCard.tsx`** — guards description render with `!!community.description` for `string | null` safety

---

## API.md

Updated to reflect all endpoint and response shape changes listed above:
- `GET /auth/me` communities array uses `communityId`/`communityName`
- New `PATCH /auth/me` section
- `GET /communities/mine` returns full Community objects
- `POST /communities/join` returns Community object
- `POST /communities/:id/members` — `role` is optional
- `GET /communities/:id/members` — member shape includes `firstName`, `lastName`
- All paginated responses include `totalPages`
- Announcement objects include `authorFirstName`, `authorLastName`
# Test commit 1
# Test commit 2
# Test commit 3
# Run 2 commit 1
# Run 2 commit 2
# Run 2 commit 3
