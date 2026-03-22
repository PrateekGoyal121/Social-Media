import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";
import {
  getChatList,
  getChat,
  sendMessage,
  sendImageMessage,
  markAsRead,
} from "../services/chatService";
import ChatSidebar from "../components/chat/chatSidebar";
import ChatHeader  from "../components/chat/chatHeader";
import ChatWindow  from "../components/chat/chatWindow";
import ChatInput   from "../components/chat/chatInput";

export default function Chat() {
  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();

  const currentUserId = user?._id?.toString() ?? null;

  const [chatList,     setChatList]     = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState("");
  const [otherTyping,  setOtherTyping]  = useState(false);
  const [reactions,    setReactions]    = useState({});
  const [mobilePane,   setMobilePane]   = useState("list");
  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const [isDesktop,    setIsDesktop]    = useState(window.innerWidth >= 768);

  // ── Refs (never go stale inside socket callbacks) ──────────────────
  const myIdRef        = useRef(currentUserId);
  const chatIdRef      = useRef(null);          // currently open chat partner ID
  const typingTimer    = useRef(null);
  const myTypingTimer  = useRef(null);
  const messagesRef    = useRef([]);            // mirror of messages state for callbacks

  // Keep refs in sync
  myIdRef.current = currentUserId;

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Resize listener ────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Chat list refresh ──────────────────────────────────────────────
  const refreshList = useCallback(() =>
    getChatList().then((r) => { if (r?.success) setChatList(r.chats ?? []); }), []);

  useEffect(() => { refreshList(); }, [refreshList]);

  // ── Socket setup (runs once) ───────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      const uid = myIdRef.current;
      if (uid) {
        socket.emit("join", uid);
        console.log("✅ Socket joined:", uid);
      }
    };

    const onReceiveMessage = (msg) => {
      const myId   = myIdRef.current;
      const chatId = chatIdRef.current;

      if (!myId || !msg) return;

      // Normalise IDs — backend may send ObjectId objects or strings
      const sId = msg.sender?._id?.toString()   ?? msg.sender?.toString()   ?? "";
      const rId = msg.receiver?._id?.toString() ?? msg.receiver?.toString() ?? "";

      console.log("📨 receiveMessage", { sId, rId, chatId, myId });

      // Check if this message belongs to the currently open conversation
      const isOpenChat =
        chatId &&
        ((sId === chatId && rId === myId) ||
         (sId === myId   && rId === chatId));

      if (isOpenChat) {
        setMessages((prev) => {
          // Deduplicate by _id
          const id = msg._id?.toString();
          if (prev.some((m) => m._id?.toString() === id)) return prev;
          return [...prev, msg];
        });
        setOtherTyping(false);
      }

      // Always update sidebar last-message preview
      const otherUserId = sId === myId ? rId : sId;
      setChatList((prev) => {
        const idx = prev.findIndex((c) => c._id?.toString() === otherUserId);
        if (idx === -1) {
          // New conversation — refresh the whole list
          refreshList();
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], lastMessage: msg };
        return next;
      });
    };

    const onTyping = ({ senderId }) => {
      if (senderId?.toString() === chatIdRef.current) {
        setOtherTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), 2500);
      }
    };

    const onOnlineUsers = (ids) => setOnlineUsers(ids.map(String));

    // Register listeners
    socket.on("connect",        onConnect);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("typing",         onTyping);
    socket.on("onlineUsers",    onOnlineUsers);

    // If already connected when this effect runs, join immediately
    if (socket.connected && myIdRef.current) {
      socket.emit("join", myIdRef.current);
    }

    return () => {
      socket.off("connect",        onConnect);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("typing",         onTyping);
      socket.off("onlineUsers",    onOnlineUsers);
      clearTimeout(typingTimer.current);
      clearTimeout(myTypingTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-join socket whenever the authenticated user changes ─────────
  useEffect(() => {
    if (currentUserId && socket.connected) {
      socket.emit("join", currentUserId);
    }
  }, [currentUserId]);

  // ── Select a conversation ──────────────────────────────────────────
  const handleSelect = useCallback((chat) => {
    if (!chat?._id) return;
    const newChatId = chat._id.toString();
    if (newChatId === chatIdRef.current) return;

    // Update the ref FIRST so the socket callback sees the new ID immediately
    chatIdRef.current = newChatId;

    setSelectedUser(chat);
    setMessages([]);
    setOtherTyping(false);
    setText("");
    setReactions({});
    if (!isDesktop) setMobilePane("chat");

    getChat(chat._id).then((r) => {
      if (!r?.success) return;
      const fetched = r.messages ?? [];
      setMessages((prev) => {
        // Keep any live messages that arrived via socket after we cleared
        const fetchedIds = new Set(fetched.map((m) => m._id?.toString()));
        const live       = prev.filter((m) => !fetchedIds.has(m._id?.toString()));
        return [...fetched, ...live];
      });
      markAsRead(chat._id);
    });
  }, [isDesktop]);

  // ── Send a text message ────────────────────────────────────────────
  const handleSend = useCallback(async (overrideText) => {
    // Guard against React synthetic events being passed accidentally
    if (overrideText && typeof overrideText === "object" && overrideText.preventDefault) {
      overrideText = undefined;
    }

    const raw     = overrideText !== undefined ? overrideText : text;
    const payload = `${raw ?? ""}`.trim();

    if (!payload || !selectedUser) return;

    // Optimistically clear the input
    if (overrideText === undefined) setText("");

    const res = await sendMessage({
      receiverId: selectedUser._id,
      text: payload,
    });

    if (res?.success) {
      setMessages((prev) => {
        const id = res.message._id?.toString();
        if (prev.some((m) => m._id?.toString() === id)) return prev;
        return [...prev, res.message];
      });
      setChatList((prev) =>
        prev.map((c) =>
          c._id?.toString() === selectedUser._id?.toString()
            ? { ...c, lastMessage: res.message }
            : c
        )
      );
    } else {
      // Restore text on failure
      if (overrideText === undefined) setText(payload);
    }
  }, [text, selectedUser]);

  // ── Send an image message ──────────────────────────────────────────
  const handleImageSend = useCallback(async (file, caption = "") => {
    if (!file || !selectedUser) return;
    const res = await sendImageMessage({ receiverId: selectedUser._id, file, caption });
    if (res?.success) {
      setMessages((prev) => {
        const id = res.message._id?.toString();
        if (prev.some((m) => m._id?.toString() === id)) return prev;
        return [...prev, res.message];
      });
      setChatList((prev) =>
        prev.map((c) =>
          c._id?.toString() === selectedUser._id?.toString()
            ? { ...c, lastMessage: res.message }
            : c
        )
      );
    }
  }, [selectedUser]);

  // ── Typing indicator ───────────────────────────────────────────────
  const handleTextChange = useCallback((newVal) => {
    setText(newVal);
    if (!selectedUser || !socket.connected) return;
    // Throttle: only emit once per 1.5 s
    if (myTypingTimer.current) return;
    socket.emit("typing", {
      receiverId: selectedUser._id?.toString(),
      senderId:   myIdRef.current,         // always fresh via ref
    });
    myTypingTimer.current = setTimeout(() => {
      myTypingTimer.current = null;
    }, 1500);
  }, [selectedUser]);

  // ── Keyboard shortcut ──────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // ── Reactions ──────────────────────────────────────────────────────
  const handleReact = useCallback((msgId, emoji) =>
    setReactions((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === emoji ? undefined : emoji,
    })), []);

  // ── Profile navigation ─────────────────────────────────────────────
  const handleProfileClick = useCallback((id) => {
    if (id) navigate(`/profile/${id}`);
  }, [navigate]);

  const isOnline = useCallback(
    (userId) => onlineUsers.includes(userId?.toString()),
    [onlineUsers]
  );

  const showSidebar = isDesktop || mobilePane === "list";
  const showChat    = isDesktop || mobilePane === "chat";

  return (
    <div className="fixed top-0 left-0 right-0 bottom-14 md:left-20 md:bottom-0 flex bg-black overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div
        className={`
          ${showSidebar ? "flex" : "hidden"}
          flex-col h-full overflow-hidden shrink-0
          w-full md:w-[360px] md:border-r md:border-[#1a1a1a]
        `}
      >
        <ChatSidebar
          chatList={chatList}
          selectedUser={selectedUser}
          currentUserId={currentUserId}
          currentUser={user}
          onSelect={handleSelect}
          onProfileClick={handleProfileClick}
          isOnline={isOnline}
        />
      </div>

      {/* ── CHAT CONTENT ── */}
      <div
        className={`
          ${showChat ? "flex" : "hidden"}
          flex-col h-full overflow-hidden flex-1 min-w-0
        `}
      >
        {selectedUser ? (
          <>
            <ChatHeader
              selectedUser={selectedUser}
              isMobile={!isDesktop}
              onBack={() => setMobilePane("list")}
              onProfileClick={handleProfileClick}
              isOnline={isOnline(selectedUser._id)}
            />
            <ChatWindow
              messages={messages}
              currentUserId={currentUserId}
              selectedUser={selectedUser}
              otherTyping={otherTyping}
              reactions={reactions}
              onReact={handleReact}
              onProfileClick={handleProfileClick}
            />
            <ChatInput
              text={text}
              onChange={handleTextChange}
              onSend={handleSend}
              onLike={() => handleSend("❤️")}
              onKeyDown={handleKeyDown}
              onImageSend={handleImageSend}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-black">
            <div className="w-22 h-22 rounded-full border-2 border-[#262626] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" width="38" height="38">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-white mb-1">Your Messages</p>
            <p className="text-sm text-[#555]">Select a conversation to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}


