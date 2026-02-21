"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface TypingIndicatorProps {
    conversationId: Id<"conversations">;
}

export default function TypingIndicator({
    conversationId,
}: TypingIndicatorProps) {
    const typingUsers = useQuery(api.typing.get, { conversationId });

    if (!typingUsers || typingUsers.length === 0) return null;

    const text =
        typingUsers.length === 1
            ? `${typingUsers[0]} is typing`
            : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

    return (
        <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-slate-400">{text}</span>
        </div>
    );
}
