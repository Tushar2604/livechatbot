"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";

interface ChatAreaProps {
    conversationId: Id<"conversations">;
    currentUser: Doc<"users"> | null | undefined;
    onBack: () => void;
}

export default function ChatArea({
    conversationId,
    currentUser,
    onBack,
}: ChatAreaProps) {
    const messages = useQuery(api.messages.list, { conversationId });
    const conversation = useQuery(api.conversations.get, { conversationId });
    const markRead = useMutation(api.conversations.markRead);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);
    const prevMessageCount = useRef(0);

    useEffect(() => {
        markRead({ conversationId });
    }, [conversationId, markRead]);

    useEffect(() => {
        if (messages && messages.length > prevMessageCount.current) {
            markRead({ conversationId });
        }
        if (messages) {
            prevMessageCount.current = messages.length;
        }
    }, [messages, conversationId, markRead]);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        } else if (messages && messages.length > prevMessageCount.current) {
            setShowNewMessageBtn(true);
        }
    }, [messages, autoScroll]);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setAutoScroll(isAtBottom);
        if (isAtBottom) {
            setShowNewMessageBtn(false);
        }
    }, []);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            setAutoScroll(true);
            setShowNewMessageBtn(false);
        }
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-950">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const otherUsers = conversation.participantDetails.filter(
        (p) => p._id !== currentUser?._id
    );

    const headerName = conversation.isGroup
        ? conversation.groupName ?? "Group"
        : otherUsers[0]?.name ?? "Unknown";

    const headerImage = conversation.isGroup
        ? undefined
        : otherUsers[0]?.imageUrl;

    const isOnline = !conversation.isGroup && otherUsers[0]?.isOnline;

    const memberCount = conversation.isGroup
        ? conversation.participantDetails.length
        : undefined;

    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800 -ml-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </Button>
                <div className="relative">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={headerImage} />
                        <AvatarFallback className="bg-slate-700 text-sm">
                            {headerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950" />
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">{headerName}</h3>
                    <p className="text-xs text-slate-400">
                        {conversation.isGroup
                            ? `${memberCount} members`
                            : isOnline
                                ? "Online"
                                : "Offline"}
                    </p>
                </div>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
            >
                {messages === undefined ? (
                    <div className="space-y-4 py-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : ""}`}
                            >
                                <div
                                    className={`h-10 rounded-2xl bg-slate-800 animate-pulse ${i % 2 === 0 ? "w-48" : "w-56"
                                        }`}
                                />
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <EmptyState
                            icon="message"
                            title="No messages yet"
                            description="Send a message to start the conversation"
                        />
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            message={msg}
                            isOwn={msg.senderId === currentUser?._id}
                            currentUserId={currentUser?._id}
                        />
                    ))
                )}
                <TypingIndicator conversationId={conversationId} />
            </div>

            {showNewMessageBtn && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                    <Button
                        onClick={scrollToBottom}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/25 px-4"
                    >
                        ↓ New messages
                    </Button>
                </div>
            )}

            <MessageInput
                conversationId={conversationId}
                currentUser={currentUser}
            />
        </div>
    );
}
