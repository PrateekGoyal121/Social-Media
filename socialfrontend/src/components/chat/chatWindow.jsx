import { useRef, useEffect } from "react";
import { MessageBubble, TypingBubble, DateDivider } from "./chatBubble";

const sameDay = (a, b) => {
  if (!a || !b) return true;
  const da = new Date(a), db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth()    === db.getMonth()    &&
    da.getDate()     === db.getDate()
  );
};

export default function ChatWindow({
  messages = [], currentUserId, selectedUser,
  otherTyping, reactions = {}, onReact, onProfileClick,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  if (!selectedUser) return null;

  return (
    <div
      style={{
        flex: 1,           /* fills ALL remaining height between header and input */
        overflowY: "auto", /* scrolls internally — never pushes input off screen  */
        overflowX: "hidden",
        padding: "16px",
        background: "#000",
        /* hide scrollbar */
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {messages.map((msg, idx) => {
        if (!msg?._id) return null;
        const prev     = messages[idx - 1];
        const next     = messages[idx + 1];
        const isMe     = msg.sender?.toString() === currentUserId?.toString();
        const isLast   = !next || next.sender?.toString() !== msg.sender?.toString();
        const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);

        return (
          <div key={msg._id}>
            {showDate && <DateDivider date={msg.createdAt} />}
            <MessageBubble
              msg={msg}
              isMe={isMe}
              isLast={isLast}
              selectedUser={selectedUser}
              reaction={reactions[msg._id]}
              onReact={onReact}
              onProfileClick={onProfileClick}
            />
          </div>
        );
      })}

      {otherTyping && <TypingBubble selectedUser={selectedUser} />}
      <div ref={bottomRef} />
    </div>
  );
}