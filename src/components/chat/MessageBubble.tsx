"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/format";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface MessageBubbleProps {
    message: {
        _id: Id<"messages">;
        _creationTime: number;
        content: string;
        senderId: Id<"users">;
        senderName: string;
        senderImageUrl: string;
        isDeleted: boolean;
        reactions?: Record<string, Id<"users">[]>;
    };
    isOwn: boolean;
    currentUserId: Id<"users"> | undefined;
}

const REACTION_KEYS = ["thumbsUp", "heart", "laugh", "wow", "sad"] as const;
const EMOJI_MAP: Record<string, string> = {
    thumbsUp: "👍",
    heart: "❤️",
    laugh: "😂",
    wow: "😮",
    sad: "😢",
};

export default function MessageBubble({
    message,
    isOwn,
    currentUserId,
}: MessageBubbleProps) {
    const [showActions, setShowActions] = useState(false);
    const removeMessage = useMutation(api.messages.remove);
    const reactToMessage = useMutation(api.messages.react);

    const handleDelete = async () => {
        await removeMessage({ messageId: message._id });
    };

    const handleReact = async (key: (typeof REACTION_KEYS)[number]) => {
        await reactToMessage({ messageId: message._id, emoji: key });
    };

    const reactions = message.reactions || {};
    const activeReactions = Object.entries(reactions).filter(
        ([, users]) => (users as string[]).length > 0
    );

    return (
        <div
            className={`group flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                <div
                    className={`relative rounded-2xl px-4 py-2 ${message.isDeleted
                        ? "bg-slate-800/50"
                        : isOwn
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-100"
                        }`}
                >
                    {message.isDeleted ? (
                        <p className="text-sm italic text-slate-500">
                            This message was deleted
                        </p>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    )}

                    {showActions && !message.isDeleted && (
                        <div
                            className={`absolute -top-8 ${isOwn ? "right-0" : "left-0"
                                } flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 p-1 shadow-lg z-10`}
                        >
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-4 h-4"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                            <line x1="9" y1="9" x2="9.01" y2="9" />
                                            <line x1="15" y1="9" x2="15.01" y2="9" />
                                        </svg>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-2 bg-slate-800 border-slate-700"
                                    side="top"
                                >
                                    <div className="flex gap-1">
                                        {REACTION_KEYS.map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => handleReact(key)}
                                                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-lg"
                                            >
                                                {EMOJI_MAP[key]}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {isOwn && (
                                <button
                                    onClick={handleDelete}
                                    className="p-1 hover:bg-red-600/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4"
                                    >
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {activeReactions.length > 0 && (
                    <div
                        className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"
                            }`}
                    >
                        {activeReactions.map(([key, users]) => {
                            const userList = users as string[];
                            const hasReacted = currentUserId
                                ? userList.includes(currentUserId)
                                : false;
                            return (
                                <button
                                    key={key}
                                    onClick={() =>
                                        handleReact(key as (typeof REACTION_KEYS)[number])
                                    }
                                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-colors ${hasReacted
                                        ? "bg-indigo-600/20 border border-indigo-500/30"
                                        : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                                        }`}
                                >
                                    <span>{EMOJI_MAP[key] || key}</span>
                                    <span className="text-slate-400">{userList.length}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p
                                className={`text-xs text-slate-500 mt-1 ${isOwn ? "text-right" : "text-left"
                                    }`}
                            >
                                {formatTimestamp(message._creationTime)}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                            <p>{new Date(message._creationTime).toLocaleString()}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
