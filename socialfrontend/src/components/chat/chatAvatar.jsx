import { useState } from "react";

const GRADIENTS = [
  "from-violet-500 to-pink-500",
  "from-orange-400 to-rose-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-fuchsia-500 to-purple-600",
];

const gradient = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return GRADIENTS[h % GRADIENTS.length];
};

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?";

const SIZES = {
  xs: { box: "w-7 h-7",   text: "text-[10px]", dot: "w-2 h-2 border"   },
  sm: { box: "w-8 h-8",   text: "text-xs",      dot: "w-2.5 h-2.5 border" },
  md: { box: "w-11 h-11", text: "text-sm",      dot: "w-3 h-3 border-2" },
  lg: { box: "w-14 h-14", text: "text-base",    dot: "w-3.5 h-3.5 border-2" },
  xl: { box: "w-20 h-20", text: "text-xl",      dot: "w-4 h-4 border-2" },
};

export default function ChatAvatar({ src, name = "", size = "md", online = false }) {
  const [err, setErr] = useState(false);
  const s = SIZES[size] || SIZES.md;

  // Treat empty string, "null", "undefined" as no image
  const hasImg = !err && src && src !== "" && src !== "null" && src !== "undefined";

  return (
    <div className="relative flex-shrink-0">
      {hasImg ? (
        <img
          src={src}
          alt={name || "avatar"}
          onError={() => setErr(true)}
          className={`${s.box} rounded-full object-cover block`}
        />
      ) : (
        <div className={`${s.box} ${s.text} rounded-full bg-gradient-to-br ${gradient(name)} flex items-center justify-center font-bold text-white`}>
          {initials(name)}
        </div>
      )}
      {online && (
        <span className={`absolute bottom-0 right-0 ${s.dot} rounded-full bg-green-400 border-black`} />
      )}
    </div>
  );
}