import { useState } from "react";
import ChatAvatar from "./chatAvatar";
import { SearchIcon} from "./chatIcon";
import { deleteChat } from "../../services/chatService";

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
  allUsers = [],
  selectedUser,
  currentUserId,
  currentUser,
  onSelect,
  onProfileClick,
  isOnline,
  onDeleteChat,
}) {
  const [search,     setSearch]     = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [deleting,   setDeleting]   = useState(false);

  // Merge chatList + allUsers (Code 1 feature)
  const chatListIds = new Set(chatList.map((c) => c?._id?.toString()));

  const usersWithoutChat = allUsers.filter(
    (u) =>
      u?._id?.toString() !== currentUserId?.toString() &&
      !chatListIds.has(u?._id?.toString())
  );

  const usersAsChat = usersWithoutChat.map((u) => ({
    _id: u._id,
    username: u.username,
    profilePic: u.profilePic,
    lastMessage: null,
  }));

  const mergedList = [...chatList, ...usersAsChat];

  const filtered = mergedList.filter((c) =>
    (c?.username || "").toLowerCase().includes(search.toLowerCase())
  );

  // Split into two groups for display (Code 1 feature)
  const withMessages    = filtered.filter((c) => c.lastMessage);
  const withoutMessages = filtered.filter((c) => !c.lastMessage);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    await Promise.all([...selected].map((id) => deleteChat(id)));
    onDeleteChat?.([...selected]);
    setDeleting(false);
    exitSelectMode();
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          {selectMode ? (
            <>
              <button
                type="button"
                onClick={exitSelectMode}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Cancel
              </button>
              <span className="text-sm font-semibold text-white">
                {selected.size} selected
              </span>
            </>
          ) : (
            <>
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
                <span className="font-bold text-[15px] text-white">{currentUser?.username || ""}</span>
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Edit
                </button>
              </div>
            </>
          )}
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

        {/* Messages section */}
        {withMessages.length > 0 && (
          <>
            <p className="px-5 pt-4 pb-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Messages
            </p>
            {withMessages.map((chat) =>
              renderRow(chat, { selectedUser, currentUserId, isOnline, onSelect, selectMode, selected, toggleSelect })
            )}
          </>
        )}

        {/* Suggested section */}
        {withoutMessages.length > 0 && (
          <>
            <p className="px-5 pt-4 pb-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Suggested
            </p>
            {withoutMessages.map((chat) =>
              renderRow(chat, { selectedUser, currentUserId, isOnline, onSelect, selectMode, selected, toggleSelect })
            )}
          </>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-neutral-600 text-sm py-10">No users found</p>
        )}
      </div>

      {/* Bottom delete bar — only in select mode (Code 2 feature) */}
      {selectMode && (
        <div className="flex-shrink-0 border-t border-neutral-800 px-5 py-4 flex items-center justify-between bg-black">
          <button
            type="button"
            onClick={() => setSelected(new Set(filtered.map((c) => c._id)))}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selected.size === 0 || deleting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${selected.size > 0
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            {deleting ? "Deleting..." : `Delete${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared row renderer ──────────────────────────────────────────────────────
function renderRow(chat, { selectedUser, currentUserId, isOnline, onSelect, selectMode, selected, toggleSelect }) {
  if (!chat?._id) return null;
  const active    = selectedUser?._id === chat._id;
  const isMe      = chat.lastMessage?.sender?.toString() === currentUserId?.toString();
  const hasUnread = !isMe && chat.lastMessage && !chat.lastMessage.read;
  const online    = isOnline?.(chat._id);
  const isChecked = selected.has(chat._id);

  return (
    <button
      key={chat._id}
      type="button"
      onClick={() => {
        if (selectMode) { toggleSelect(chat._id); return; }
        onSelect(chat);
      }}
      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors
        ${active && !selectMode ? "bg-neutral-900" : "hover:bg-neutral-950"}`}
    >
      {/* Checkbox in select mode, avatar otherwise (Code 2 feature) */}
      {selectMode ? (
        <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
            ${isChecked ? "bg-blue-500 border-blue-500" : "border-neutral-500"}`}
          >
            {isChecked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        </div>
      ) : (
        <ChatAvatar
          src={chat.profilePic}
          name={chat.username || ""}
          size="md"
          online={online}
        />
      )}

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