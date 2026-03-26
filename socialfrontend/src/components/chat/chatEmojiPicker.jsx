import { useEffect, useRef } from "react";

const EMOJIS = [
  "😂","❤️","😍","🔥","👏","😭","✨","💯","🎉","😊",
  "🙏","💪","😅","🤔","👍","💀","🤣","😩","🥺","💕",
  "😔","🤍","💫","🌹","😤","🙈","💥","🥰","😏","🤗",
  "😒","🫶","🥹","😎","🤯","💞","🌸","🎶","😜","🫠",
  "🎯","🌟","🥳","😴","🤩","😬","🙄","🤭","😇","🥶",
  "🤑","😋","🤤","🤪","😈","👻","🎃","🌈","🦋","🍕",
];

export default function ChatEmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-2xl z-30"
      style={{ width: 272, animation: "fadeUp 0.14s ease" }}
    >
      <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto scrollbar-hide">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onSelect(e)}
            className="text-xl p-1.5 rounded-lg hover:bg-neutral-800 transition-colors hover:scale-110 transition-transform"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}