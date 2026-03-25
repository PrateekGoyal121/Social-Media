import { useState } from "react";
import ChatAvatar from "./chatAvatar";
import { SearchIcon } from "./chatIcon";

const isImgUrl = (t = "") =>
  t.startsWith("https://res.cloudinary.com") ||
  /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(t);

const isImgMsg = (t = "") => {
  if (isImgUrl(t)) return true;
  if (t.startsWith("{")) {
    try { return !!JSON.parse(t).imageUrl; } catch { return false; }
  }
  return false;
};

const fmtTime = (d) => {
  if (!d) return "";
  const date = new Date(d), now = new Date(), diff = now - date;
  if (diff < 60000)    return "now";
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const preview = (lastMsg, isMe) => {
  if (!lastMsg?.text) return "Start a conversation";
  const pre = isMe ? "You: " : "";
  if (isImgMsg(lastMsg.text)) {
    try {
      const p = JSON.parse(lastMsg.text);
      if (p.caption) return `${pre}📷 ${p.caption}`;
    } catch { /* plain URL */ }
    return `${pre}📷 Photo`;
  }
  return `${pre}${lastMsg.text}`;
};

export default function ChatSidebar({
  chatList = [],
  allUsers = [],          // ← NEW: pass all users from your backend
  selectedUser,
  currentUserId,
  currentUser,
  onSelect,
  onProfileClick,
  isOnline,
}) {
  const [search, setSearch] = useState("");

  // Merge chatList + allUsers
  // chatList users take priority (they have lastMessage data)
  // allUsers who are NOT already in chatList get added at the bottom
  const chatListIds = new Set(chatList.map((c) => c?._id?.toString()));

  const usersWithoutChat = allUsers.filter(
    (u) =>
      u?._id?.toString() !== currentUserId?.toString() && // exclude self
      !chatListIds.has(u?._id?.toString())                // exclude already in chatList
  );

  // Convert plain users to same shape as chatList items
  const usersAsChat = usersWithoutChat.map((u) => ({
    _id: u._id,
    username: u.username,
    profilePic: u.profilePic,
    lastMessage: null, // no messages yet
  }));

  const mergedList = [...chatList, ...usersAsChat];

  const filtered = mergedList.filter((c) =>
    (c?.username || "").toLowerCase().includes(search.toLowerCase())
  );

  // Split into two groups for display
  const withMessages    = filtered.filter((c) => c.lastMessage);
  const withoutMessages = filtered.filter((c) => !c.lastMessage);

  return (
    <div className="w-full h-full flex flex-col bg-black">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => currentUser?._id && onProfileClick?.(currentUser._id)}
            className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
          >
            <ChatAvatar
              src={currentUser?.profilePic}
              name={currentUser?.username || ""}
              size="sm"
            />
            <span className="font-bold text-[15px] text-white">
              {currentUser?.username || ""}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 rounded-xl px-3.5 py-2.5">
          <span className="text-neutral-500 flex"><SearchIcon /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── Conversations (users you've messaged) ── */}
        {withMessages.length > 0 && (
          <>
            <p className="px-5 pt-4 pb-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Messages
            </p>
            {withMessages.map((chat) => renderRow(chat, { selectedUser, currentUserId, isOnline, onSelect }))}
          </>
        )}

        {/* ── All other users (no messages yet) ── */}
        {withoutMessages.length > 0 && (
          <>
            <p className="px-5 pt-4 pb-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Suggested
            </p>
            {withoutMessages.map((chat) => renderRow(chat, { selectedUser, currentUserId, isOnline, onSelect }))}
          </>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-neutral-600 text-sm py-10">No users found</p>
        )}
      </div>
    </div>
  );
}

// ── Shared row renderer ──────────────────────────────────────────────────────
function renderRow(chat, { selectedUser, currentUserId, isOnline, onSelect }) {
  if (!chat?._id) return null;
  const active    = selectedUser?._id === chat._id;
  const isMe      = chat.lastMessage?.sender?.toString() === currentUserId?.toString();
  const hasUnread = !isMe && chat.lastMessage && !chat.lastMessage.read;
  const online    = isOnline?.(chat._id);

  return (
    <button
      key={chat._id}
      type="button"
      onClick={() => onSelect(chat)}
      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors
        ${active ? "bg-neutral-900" : "hover:bg-neutral-950"}`}
    >
      <ChatAvatar
        src={chat.profilePic}
        name={chat.username || ""}
        size="md"
        online={online}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? "font-bold text-white" : "font-semibold text-neutral-200"}`}>
            {chat.username || "Unknown"}
          </p>
          <span className="text-[11px] text-neutral-500 ml-2 flex-shrink-0">
            {fmtTime(chat.lastMessage?.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <p className={`text-xs truncate ${hasUnread ? "font-semibold text-white" : "text-neutral-500"}`}>
            {preview(chat.lastMessage, isMe)}
          </p>
          {hasUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
        </div>
      </div>
    </button>
  );
}