import ChatAvatar from "./chatAvatar";
import { BackIcon, PhoneIcon, VideoIcon, InfoIcon } from "./chatIcon";

export default function ChatHeader({ selectedUser, isMobile, onBack, onProfileClick, isOnline }) {
  if (!selectedUser) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-black flex-shrink-0">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            type="button"
            onClick={onBack}
            className="text-white hover:text-neutral-300 transition-colors mr-1"
          >
            <BackIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => selectedUser._id && onProfileClick?.(selectedUser._id)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
        >
          <ChatAvatar
            src={selectedUser.profilePic}
            name={selectedUser.username || ""}
            size="md"
            online={isOnline}
          />
          <div>
            <p className="font-semibold text-[15px] text-white leading-tight hover:underline">
              {selectedUser.username || "Unknown"}
            </p>
            {/* Real online/offline status */}
            <p className={`text-xs mt-0.5 ${isOnline ? "text-green-400" : "text-neutral-500"}`}>
              {isOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-5">
        <button type="button" className="text-neutral-400 hover:text-white transition-colors" title="Call">
          <PhoneIcon />
        </button>
        <button type="button" className="text-neutral-400 hover:text-white transition-colors" title="Video">
          <VideoIcon />
        </button>
        <button type="button" className="text-neutral-400 hover:text-white transition-colors" title="Info">
          <InfoIcon />
        </button>
      </div>
    </div>
  );
}