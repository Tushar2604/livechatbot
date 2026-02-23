"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
    conversationId: Id<"conversations">;
    currentUser: Doc<"users"> | null | undefined;
}

export default function MessageInput({
    conversationId,
    currentUser,
}: MessageInputProps) {
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const sendMessage = useMutation(api.messages.send);
    const sendImage = useMutation(api.messages.sendImage);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const setTyping = useMutation(api.typing.set);
    const clearTyping = useMutation(api.typing.clear);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTyping = useCallback(() => {
        setTyping({ conversationId });

        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        typingTimeout.current = setTimeout(() => {
            clearTyping({ conversationId });
        }, 2000);
    }, [conversationId, setTyping, clearTyping]);

    const handleSend = async () => {
        if (!content.trim() || sending) return;

        setSending(true);
        setError(null);

        try {
            await sendMessage({
                conversationId,
                content: content.trim(),
            });
            setContent("");
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            clearTyping({ conversationId });
        } catch (err) {
            setError("Failed to send message. Click to retry.");
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            await sendImage({ conversationId, storageId });
        } catch (err) {
            setError("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-slate-800 p-3 bg-slate-950">
            {error && (
                <button
                    onClick={handleSend}
                    className="w-full text-left text-xs text-red-400 mb-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/15 transition-colors"
                >
                    {error}
                </button>
            )}
            {uploading && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-indigo-300">Uploading photo...</span>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
            <div className="flex items-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 h-[42px] px-3 flex-shrink-0"
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
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </Button>
                <textarea
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all max-h-32"
                    style={{
                        height: "auto",
                        minHeight: "42px",
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = Math.min(target.scrollHeight, 128) + "px";
                    }}
                />
                <Button
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-[42px] px-4 transition-all duration-200 disabled:opacity-50"
                >
                    {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
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
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    )}
                </Button>
            </div>
        </div>
    );
}

