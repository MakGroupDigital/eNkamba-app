# Feature: Story Replies Create/Use Conversations

## Overview
When users reply to a story, the system now automatically creates or uses an existing conversation with the story owner, and includes the story reference with media in the message.

## Problem Solved
Previously, story replies were only stored in the story document itself and optionally sent to a conversation if one was provided. This meant:
- No automatic conversation creation
- Story replies didn't appear in chat
- Users couldn't continue the conversation naturally
- Story media wasn't included in the reply

## Solution Implemented

### 1. Enhanced `replyToStory` Function
The function now handles the complete flow:

**New signature:**
```typescript
replyToStory(
  storyId: string,
  message: string,
  storyOwnerId: string,
  storyOwnerName: string,
  storyMediaUrl?: string,
  storyType?: StoryType
)
```

**Flow:**
1. Add reply to story document (existing behavior)
2. Search for existing conversation with story owner
3. Create new conversation if none exists
4. Send message with story reference and media
5. Update conversation's last message

### 2. Conversation Search & Creation
```typescript
// Search for existing conversation
const q = query(
  collection(db, 'conversations'),
  where('participants', 'array-contains', currentUser.uid)
);

const snapshot = await getDocs(q);
for (const docSnapshot of snapshot.docs) {
  const data = docSnapshot.data();
  if (data.participants.includes(storyOwnerId)) {
    conversationId = docSnapshot.id;
    break;
  }
}

// Create if not found
if (!conversationId) {
  const docRef = await addDoc(collection(db, 'conversations'), {
    participants: [currentUser.uid, storyOwnerId],
    participantNames: [currentUser.displayName, storyOwnerName],
    lastMessage: '',
    lastMessageTime: Timestamp.now(),
    createdAt: Timestamp.now(),
    unreadCount: 0,
  });
  conversationId = docRef.id;
}
```

### 3. Story Reply Message Format
Messages are sent with type `story_reply` and include metadata:

```typescript
{
  senderId: currentUser.uid,
  senderName: currentUser.displayName,
  text: message,
  messageType: 'story_reply',
  timestamp: Timestamp.now(),
  isRead: false,
  metadata: {
    storyId: string,
    storyOwnerId: string,
    storyOwnerName: string,
    storyMediaUrl?: string,  // Photo/video/audio URL
    storyType?: 'photo' | 'video' | 'audio' | 'location'
  }
}
```

### 4. Story Reply Display in Chat
Added special rendering for story reply messages:

**Visual components:**
- Purple border to indicate story reply
- Story media preview (photo, video, or audio icon)
- Story owner name overlay
- User's reply text below

**Supported story types:**
- Photo: Shows image thumbnail
- Video: Shows video thumbnail
- Audio: Shows music icon with gradient background
- Location: (no media preview)

**Example rendering:**
```
┌─────────────────────────────────┐
│ Réponse à une story             │ ← Purple header
│ ┌─────────────────────────────┐ │
│ │     [Story Media Preview]   │ │ ← Photo/video/audio
│ │  Story de John Doe          │ │ ← Owner name overlay
│ └─────────────────────────────┘ │
│ Super story! 🔥                 │ ← Reply text
└─────────────────────────────────┘
```

### 5. Updated Story Viewer Integration
Modified the story viewer callback to pass all necessary information:

**Before:**
```typescript
onReply={async (storyId, message) => {
  const story = viewingStories.stories.find(s => s.id === storyId);
  if (story) {
    const conversation = conversations.find(c => 
      c.participants?.includes(story.userId)
    );
    await replyToStory(storyId, message, conversation?.id);
  }
}}
```

**After:**
```typescript
onReply={async (storyId, message) => {
  const story = viewingStories.stories.find(s => s.id === storyId);
  if (story) {
    await replyToStory(
      storyId, 
      message, 
      story.userId, 
      story.userName,
      story.mediaUrl,
      story.type
    );
  }
}}
```

## User Experience

### Scenario 1: First Reply to Story (No Existing Conversation)
1. User views friend's story
2. User types reply: "Nice photo!"
3. System creates new conversation with friend
4. Message appears in conversation with story preview
5. Friend receives notification
6. Friend can reply in the same conversation

### Scenario 2: Reply to Story (Existing Conversation)
1. User views friend's story (already has conversation)
2. User types reply: "Love this!"
3. Message is added to existing conversation
4. Story preview is included
5. Conversation continues naturally

### Scenario 3: Multiple Story Replies
1. User replies to multiple stories from same person
2. All replies go to same conversation
3. Each reply shows its respective story preview
4. Conversation history is preserved

## Benefits

1. **Seamless Integration**: Story replies naturally become chat messages
2. **Context Preservation**: Story media is included so both parties remember what was discussed
3. **Conversation Continuity**: Users can continue chatting after replying to a story
4. **No Duplicate Conversations**: System reuses existing conversations
5. **Rich Media Display**: Story previews make replies more engaging
6. **Better UX**: Users don't need to manually start a conversation after replying

## Technical Details

### Files Modified

1. **src/hooks/useStories.ts**
   - Enhanced `replyToStory` function
   - Added conversation search and creation
   - Added message sending with metadata
   - Added `getDocs` import

2. **src/app/dashboard/miyiki-chat/page.tsx**
   - Updated story viewer callback
   - Passes story owner info and media

3. **src/app/dashboard/miyiki-chat/[id]/conversation-client.tsx**
   - Added story reply message rendering
   - Displays story media preview
   - Shows story owner name
   - Purple theme for story replies

### Database Structure

**Story Document:**
```
stories/{storyId}
  - userId: string
  - userName: string
  - type: 'photo' | 'video' | 'audio' | 'location'
  - mediaUrl?: string
  - replies: Array<{
      userId: string,
      userName: string,
      message: string,
      createdAt: Timestamp
    }>
```

**Conversation Document:**
```
conversations/{conversationId}
  - participants: [userId1, userId2]
  - participantNames: [name1, name2]
  - lastMessage: string
  - lastMessageTime: Timestamp
  
  messages/{messageId}
    - senderId: string
    - text: string
    - messageType: 'story_reply'
    - metadata: {
        storyId: string,
        storyOwnerId: string,
        storyMediaUrl?: string,
        storyType?: string
      }
```

## Future Enhancements

1. **Story Expiration Handling**: Show placeholder when story expires
2. **Direct Story Navigation**: Click story preview to view full story
3. **Story Reply Notifications**: Special notification type for story replies
4. **Story Reply Analytics**: Track which stories get most replies
5. **Group Story Replies**: Support replying to group stories

## Testing Checklist

- [x] Reply to story without existing conversation → Creates new conversation
- [x] Reply to story with existing conversation → Uses existing conversation
- [x] Story media preview displays correctly (photo, video, audio)
- [x] Multiple replies to same person go to same conversation
- [x] Story owner name displays correctly
- [x] Reply text displays below story preview
- [x] Conversation list updates with new message
- [x] Last message shows "Réponse à story: {message}"
