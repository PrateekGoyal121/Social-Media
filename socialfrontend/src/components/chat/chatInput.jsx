import { useRef, useState, useCallback } from "react";
import ChatEmojiPicker from "./chatEmojiPicker";
import { SendIcon, HeartIcon, EmojiIcon, ImageIcon, SpinnerIcon } from "./chatIcon";

// Close (X) icon inline
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function ChatInput({ text, onChange, onSend, onLike, onKeyDown, onImageSend }) {
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  // { file, previewUrl }  — null when no image selected
  const [imgPending,   setImgPending]   = useState(null);
  const [caption,      setCaption]      = useState("");

  const inputRef   = useRef(null);
  const captionRef = useRef(null);
  const fileRef    = useRef(null);

  // ── emoji insert at cursor ──────────────────────────────────────────
  const insertEmoji = useCallback((emoji) => {
    // Insert into whichever input is active — caption if image pending, text otherwise
    const el = imgPending ? captionRef.current : inputRef.current;
    if (el) {
      const s    = el.selectionStart ?? (imgPending ? caption : text).length;
      const e    = el.selectionEnd   ?? s;
      const val  = imgPending ? caption : text;
      const next = val.slice(0, s) + emoji + val.slice(e);
      const pos  = s + emoji.length;
      imgPending ? setCaption(next) : onChange(next);
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
    } else {
      imgPending ? setCaption((p) => p + emoji) : onChange(text + emoji);
    }
  }, [text, onChange, caption, imgPending]);

  // ── file selected → show preview + caption input ────────────────────
  const handleFileChange = (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImgPending({ file, previewUrl });
    setCaption("");
    // focus caption input after render
    setTimeout(() => captionRef.current?.focus(), 50);
  };

  // ── cancel image ────────────────────────────────────────────────────
  const cancelImage = () => {
    if (imgPending) URL.revokeObjectURL(imgPending.previewUrl);
    setImgPending(null);
    setCaption("");
  };

  // ── send image (+ optional caption) ────────────────────────────────
  const sendImage = async () => {
    if (!imgPending || imgUploading) return;
    const { file, previewUrl } = imgPending;
    const cap = caption.trim();

    URL.revokeObjectURL(previewUrl);
    setImgPending(null);
    setCaption("");
    setImgUploading(true);

    try {
      await onImageSend(file, cap); // pass caption to parent
    } finally {
      setImgUploading(false);
    }
  };

  // ── caption enter key ───────────────────────────────────────────────
  const handleCaptionKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendImage(); }
    if (e.key === "Escape") cancelImage();
  };

  // ── styles (all inline so Tailwind can't override with white) ───────
  const S = {
    root: {
      flexShrink: 0,
      background: "#000",
      borderTop: "1px solid #1a1a1a",
    },
    previewArea: {
      padding: "10px 14px 0",
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
    },
    previewWrap: {
      position: "relative",
      display: "inline-flex",
    },
    previewImg: {
      maxHeight: 140,
      maxWidth: 200,
      borderRadius: 12,
      objectFit: "cover",
      display: "block",
      border: "1px solid #2a2a2a",
    },
    cancelBtn: {
      position: "absolute",
      top: -8,
      right: -8,
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "#333",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    captionRow: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    captionInput: {
      flex: 1,
      background: "#111",
      border: "1px solid #2a2a2a",
      borderRadius: 20,
      padding: "8px 14px",
      color: "#fff",
      fontSize: 14,
      outline: "none",
    },
    sendImgBtn: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: "none",
      background: imgUploading ? "#333" : "linear-gradient(135deg,#833ab4,#fd1d1d)",
      color: "#fff",
      cursor: imgUploading ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    inputRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
    },
    pill: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      background: "#111",
      borderRadius: 24,
      border: "1px solid #2a2a2a",
      padding: "0 14px",
      minWidth: 0,
    },
    textInput: {
      flex: 1,
      background: "none",
      border: "none",
      outline: "none",
      color: "#fff",
      fontSize: 14,
      padding: "11px 0",
      minWidth: 0,
    },
    iconBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#666",
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: "none",
      background: "linear-gradient(135deg,#833ab4,#fd1d1d)",
      color: "#fff",
      cursor: "pointer",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 12px rgba(131,58,180,0.4)",
    },
    heartBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      flexShrink: 0,
      display: "flex",
    },
  };

  return (
    <div style={S.root}>

      {/* ── IMAGE PREVIEW + CAPTION (shown when image is selected) ── */}
      {imgPending && (
        <div style={S.previewArea}>
          {/* Thumbnail with cancel */}
          <div style={S.previewWrap}>
            <img src={imgPending.previewUrl} alt="preview" style={S.previewImg} />
            <button type="button" onClick={cancelImage} style={S.cancelBtn} title="Cancel">
              <CloseIcon />
            </button>
          </div>

          {/* Caption input */}
          <div style={S.captionRow}>
            <input
              ref={captionRef}
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleCaptionKey}
              placeholder="Add a caption..."
              autoComplete="off"
              style={S.captionInput}
            />
          </div>

          {/* Send image button */}
          <button
            type="button"
            onClick={sendImage}
            disabled={imgUploading}
            style={S.sendImgBtn}
            title="Send image"
          >
            {imgUploading ? <SpinnerIcon /> : <SendIcon />}
          </button>
        </div>
      )}

      {/* ── TEXT INPUT ROW (always shown) ────────────────────────── */}
      <div style={S.inputRow}>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Image picker button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={imgUploading}
          style={{ ...S.iconBtn, opacity: imgUploading ? 0.4 : 1 }}
          title="Send image"
        >
          {imgUploading ? <SpinnerIcon /> : <ImageIcon />}
        </button>

        {/* Text input pill */}
        <div style={S.pill}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={imgPending ? "Send image with or without caption..." : "Message..."}
            autoComplete="off"
            style={S.textInput}
          />

          {/* Emoji picker */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowEmoji((p) => !p)}
              style={{ ...S.iconBtn, paddingLeft: 8 }}
            >
              <EmojiIcon />
            </button>
            {showEmoji && (
              <ChatEmojiPicker
                onSelect={(e) => { insertEmoji(e); setShowEmoji(false); }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
        </div>

        {/* Send text OR heart */}
        {text.trim() ? (
          <button type="button" onClick={onSend} style={S.sendBtn}>
            <SendIcon />
          </button>
        ) : (
          <button type="button" onClick={onLike} style={S.heartBtn}>
            <HeartIcon filled size={26} />
          </button>
        )}
      </div>
    </div>
  );
}