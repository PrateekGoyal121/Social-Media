import { useState, useRef } from "react";
import ChatAvatar from "./chatAvatar";
import { CheckIcon, CheckReadIcon } from "./chatIcon";
import { deleteMessage } from "../../services/chatService";

const REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

const fmtTime = (d) =>
  !d ? "" : new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const isImgUrl = (t = "") =>
  t.startsWith("https://res.cloudinary.com") ||
  /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(t);

const isEmojiOnly = (t = "") => {
  try {
    // Exclude plain ASCII digits/symbols — only allow actual pictographic emoji
    return /^\p{Emoji}+$/u.test(t) && 
           !/^[\p{ASCII}]+$/u.test(t) &&   // ← exclude ASCII (digits, punctuation)
           [...t].length <= 3;
  } catch { return false; }
};

// A message can be "image + caption" stored as JSON, or plain text / URL
const parseMsg = (text = "") => {
  if (text.startsWith("{")) {
    try {
      const p = JSON.parse(text);
      if (p.imageUrl) return { imageUrl: p.imageUrl, caption: p.caption || "" };
    } catch { /* fall through */ }
  }
  if (isImgUrl(text)) return { imageUrl: text, caption: "" };
  return { imageUrl: null, caption: "" };
};

export function MessageBubble({ msg, isMe, isLast, selectedUser, reaction, onReact, onProfileClick, onDelete }) {
  const [hover,    setHover]    = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMenu,   setShowMenu]   = useState(false); // ✅ delete menu
  const longPressTimer = useRef(null); // ✅ long press

  if (!msg) return null;

  // ✅ Long press handlers
  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  };
  const handlePressEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  // ✅ Delete handler
  const handleDelete = async (deleteFor) => {
    setShowMenu(false);
    const res = await deleteMessage(msg._id, deleteFor);
    if (res?.success) onDelete?.(msg._id, deleteFor);
  };

  const text = String(msg.text ?? "");
  const parsed  = parseMsg(text);
  const isImg   = !!parsed.imageUrl && !imgError;
  const isHeart = !isImg && text === "❤️";
  const isEmoji = !isImg && !isHeart && isEmojiOnly(text);

  // Bubble alignment
  const alignSelf  = isMe ? "flex-end" : "flex-start";
  const rowDir     = isMe ? "row-reverse" : "row";

  const bubbleBg   = isMe
    ? "linear-gradient(135deg,#833ab4,#c1326a,#fd1d1d)"
    : "#1c1c1c";
  const bubbleRadius = isImg
    ? (isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px")
    : (isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px");

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: alignSelf,
      marginBottom: isLast ? 14 : 3,
    }}>
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: rowDir, position: "relative"  }}
        onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {setHover(false);}}
      onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
      >
        {/* Other user avatar */}
        {!isMe && (
          <div style={{ width: 28, flexShrink: 0, alignSelf: "flex-end" }}>
            {isLast && (
              <button
                type="button"
                onClick={() => selectedUser?._id && onProfileClick?.(selectedUser._id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <ChatAvatar src={selectedUser?.profilePic} name={selectedUser?.username || ""} size="xs" />
              </button>
            )}
          </div>
        )}

        <div style={{ position: "relative", maxWidth: 280 }}>

          {/* Hover reaction bar */}
          {hover && !showMenu && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)",
              [isMe ? "right" : "left"]: 0,
              background: "#1c1c1c",
              border: "1px solid #2a2a2a",
              borderRadius: 30,
              padding: "5px 10px",
              display: "flex", gap: 4,
              whiteSpace: "nowrap",
              zIndex: 10,
              animation: "fadeUp 0.12s ease",
              boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}>
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => onReact?.(msg._id, e)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 20, padding: "2px 3px",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(ev) => ev.currentTarget.style.transform = "scale(1.3)"}
                  onMouseLeave={(ev) => ev.currentTarget.style.transform = "scale(1)"}
                >
                  {e}
                </button>
              ))}
              {/* ✅ Delete button in reaction bar */}
              <div style={{ width: 1, background: "#2a2a2a", height: 20, margin: "0 4px" }} />
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", color: "#888" }}
                title="Delete"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          )}
          {/* ✅ Delete menu (on trash click or long press) */}
          {showMenu && (
            <>
              {/* backdrop */}
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 20 }}
              />
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                [isMe ? "right" : "left"]: 0,
                background: "#1c1c1c",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                overflow: "hidden",
                zIndex: 30,
                minWidth: 180,
                boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
              }}>
                {isMe && (
                  <button
                    type="button"
                    onClick={() => handleDelete("everyone")}
                    style={{
                      width: "100%", padding: "12px 16px", background: "none",
                      border: "none", cursor: "pointer", color: "#ff4444",
                      fontSize: 14, textAlign: "left", display: "flex",
                      alignItems: "center", gap: 10,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    🗑️ Delete for everyone
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete("me")}
                  style={{
                    width: "100%", padding: "12px 16px", background: "none",
                    border: "none", cursor: "pointer", color: "#ccc",
                    fontSize: 14, textAlign: "left", display: "flex",
                    alignItems: "center", gap: 10,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  🗑️ Delete for me
                </button>
                <button
                  type="button"
                  onClick={() => setShowMenu(false)}
                  style={{
                    width: "100%", padding: "12px 16px", background: "none",
                    border: "none", cursor: "pointer", color: "#666",
                    fontSize: 14, textAlign: "left",
                    borderTop: "1px solid #2a2a2a",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ── Content ─────────────────────────────────────────── */}

          {isImg ? (
            // Image bubble (with optional caption below)
            <div
              onDoubleClick={() => onReact?.(msg._id, "❤️")}
              style={{
                overflow: "hidden",
                borderRadius: bubbleRadius,
                cursor: "pointer",
                background: "#1c1c1c",
              }}
            >
              <img
                src={parsed.imageUrl}
                alt="photo"
                onError={() => setImgError(true)}
                style={{
                  display: "block",
                  maxWidth: 240,
                  maxHeight: 300,
                  width: "100%",
                  objectFit: "cover",
                }}
              />
              {parsed.caption && (
                <div style={{
                  padding: "6px 12px 8px",
                  fontSize: 13,
                  color: "#fff",
                  background: isMe
                    ? "linear-gradient(135deg,#833ab4,#c1326a)"
                    : "#1c1c1c",
                  lineHeight: 1.4,
                }}>
                  {parsed.caption}
                </div>
              )}
            </div>

          ) : isHeart ? (
            <div
              onDoubleClick={() => onReact?.(msg._id, "❤️")}
              style={{ fontSize: 38, cursor: "pointer", userSelect: "none", lineHeight: 1 }}
            >
              {text}
            </div>

          ) : isEmoji ? (
            <div
              onDoubleClick={() => onReact?.(msg._id, "❤️")}
              style={{ fontSize: 32, cursor: "pointer", userSelect: "none", padding: "0 4px", lineHeight: 1 }}
            >
              {text}
            </div>

          ) : (
            // Text bubble
            <div
              onDoubleClick={() => onReact?.(msg._id, "❤️")}
              style={{
                background: bubbleBg,
                borderRadius: bubbleRadius,
                padding: "10px 14px",
                fontSize: 14,
                color: "#fff",
                lineHeight: 1.5,
                wordBreak: "break-word",
                cursor: "pointer",
                userSelect: "none",
                boxShadow: isMe ? "0 2px 12px rgba(131,58,180,0.25)" : "none",
              }}
            >
              {text}
            </div>
          )}

          {/* Reaction badge */}
          {reaction && (
            <button
              type="button"
              onClick={() => onReact?.(msg._id, reaction)}
              style={{
                position: "absolute",
                bottom: -14,
                [isMe ? "right" : "left"]: 4,
                background: "#1c1c1c",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: "2px 6px",
                fontSize: 14,
                cursor: "pointer",
                zIndex: 2,
                animation: "popIn 0.15s ease",
              }}
            >
              {reaction}
            </button>
          )}
        </div>
      </div>

      {/* Timestamp + read receipt */}
      {isLast && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          marginTop: 5,
          paddingRight: isMe ? 4 : 0,
          paddingLeft:  isMe ? 0 : 36,
        }}>
          <span style={{ fontSize: 11, color: "#555" }}>{fmtTime(msg.createdAt)}</span>
          {isMe && (msg.read ? <CheckReadIcon /> : <CheckIcon />)}
        </div>
      )}
    </div>
  );
}

export function TypingBubble({ selectedUser }) {
  if (!selectedUser) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 14 }}>
      <ChatAvatar src={selectedUser.profilePic} name={selectedUser.username || ""} size="xs" />
      <div style={{
        background: "#1c1c1c",
        borderRadius: "20px 20px 20px 4px",
        padding: "10px 16px",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#666", display: "inline-block",
            animation: `typingBounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

export function DateDivider({ date }) {
  if (!date) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
      <span style={{
        fontSize: 11, color: "#555",
        background: "#111",
        padding: "4px 14px",
        borderRadius: 20,
        border: "1px solid #1a1a1a",
      }}>
        {new Date(date).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
      </span>
    </div>
  );
}