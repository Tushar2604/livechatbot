"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { UserButton } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { formatTimestamp, formatLastSeen } from "@/lib/format";
import EmptyState from "./EmptyState";

interface SidebarProps {
    selectedConversation: Id<"conversations"> | null;
    onSelectConversation: (id: Id<"conversations">) => void;
    currentUser: Doc<"users"> | null | undefined;
}

export default function Sidebar({
    selectedConversation,
    onSelectConversation,
    currentUser,
}: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<
        Id<"users">[]
    >([]);

    const conversations = useQuery(api.conversations.list);
    const allUsers = useQuery(api.users.getAll);
    const searchResults = useQuery(
        api.users.search,
        searchQuery.length > 0 ? { query: searchQuery } : "skip"
    );
    const createOrGet = useMutation(api.conversations.createOrGet);
    const createGroup = useMutation(api.conversations.createGroup);

    const displayUsers = searchQuery.length > 0 ? searchResults : null;

    const handleUserClick = async (userId: Id<"users">) => {
        const conversationId = await createOrGet({ participantId: userId });
        onSelectConversation(conversationId);
        setSearchQuery("");
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedGroupMembers.length === 0) return;
        const conversationId = await createGroup({
            name: groupName.trim(),
            participantIds: selectedGroupMembers,
        });
        onSelectConversation(conversationId);
        setGroupName("");
        setSelectedGroupMembers([]);
        setShowGroupDialog(false);
    };

    const toggleGroupMember = (userId: Id<"users">) => {
        setSelectedGroupMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <div className="flex flex-col w-full bg-slate-950">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <div>
                        <h2 className="text-sm font-semibold text-white">
                            {currentUser?.name ?? "Loading..."}
                        </h2>
                        <p className="text-xs text-slate-400">Online</p>
                    </div>
                </div>
                <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
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
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                            <DialogTitle>Create Group Chat</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                            <Input
                                placeholder="Group name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                            <div className="text-sm text-slate-400 mb-2">Select members:</div>
                            <ScrollArea className="h-48">
                                <div className="space-y-1">
                                    {allUsers?.map((user) => (
                                        <button
                                            key={user._id}
                                            onClick={() => toggleGroupMember(user._id)}
                                            className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${selectedGroupMembers.includes(user._id)
                                                ? "bg-indigo-600/20 border border-indigo-500/30"
                                                : "hover:bg-slate-800"
                                                }`}
                                        >
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={user.imageUrl} />
                                                <AvatarFallback className="bg-slate-700 text-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-white">{user.name}</span>
                                            {selectedGroupMembers.includes(user._id) && (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="w-4 h-4 text-indigo-400 ml-auto"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                            <Button
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-500"
                            >
                                Create Group ({selectedGroupMembers.length} members)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="p-3">
                <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                />
            </div>

            <ScrollArea className="flex-1">
                {displayUsers && displayUsers.length > 0 && (
                    <div className="px-3 pb-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">
                            Users
                        </p>
                        {displayUsers.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => handleUserClick(user._id)}
                                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="relative">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={user.imageUrl} />
                                        <AvatarFallback className="bg-slate-700 text-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {user.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {user.isOnline ? "Online" : user.lastSeen ? `Last seen ${formatLastSeen(user.lastSeen)}` : "Offline"}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {displayUsers && displayUsers.length === 0 && searchQuery.length > 0 && (
                    <div className="px-3 py-8">
                        <EmptyState
                            icon="search"
                            title="No users found"
                            description={`No results for "${searchQuery}"`}
                        />
                    </div>
                )}

                {!displayUsers && (
                    <div className="px-3">
                        {conversations === undefined ? (
                            <div className="space-y-3 py-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-2.5">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="w-24 h-3 bg-slate-800 rounded animate-pulse" />
                                            <div className="w-36 h-2.5 bg-slate-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="py-8">
                                <EmptyState
                                    icon="inbox"
                                    title="No conversations yet"
                                    description="Search for users above to start a conversation"
                                />
                            </div>
                        ) : (
                            <div className="space-y-0.5 py-1">
                                {conversations.map((conv) => {
                                    const name = conv.isGroup
                                        ? conv.groupName ?? "Group"
                                        : conv.otherParticipants[0]?.name ?? "Unknown";
                                    const imageUrl = conv.isGroup
                                        ? undefined
                                        : conv.otherParticipants[0]?.imageUrl;
                                    const isOnline =
                                        !conv.isGroup && conv.otherParticipants[0]?.isOnline;
                                    const lastMsg = conv.lastMessage;

                                    let preview = "No messages yet";
                                    if (lastMsg) {
                                        if (lastMsg.isDeleted) {
                                            preview = "This message was deleted";
                                        } else {
                                            preview =
                                                lastMsg.content.length > 40
                                                    ? lastMsg.content.substring(0, 40) + "..."
                                                    : lastMsg.content;
                                        }
                                    }

                                    return (
                                        <button
                                            key={conv._id}
                                            onClick={() => onSelectConversation(conv._id)}
                                            className={`flex items-center gap-3 w-full p-2.5 rounded-lg transition-all duration-150 ${selectedConversation === conv._id
                                                ? "bg-indigo-600/15 border border-indigo-500/20"
                                                : "hover:bg-slate-800/50"
                                                }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarImage src={imageUrl} />
                                                    <AvatarFallback className="bg-slate-700 text-sm">
                                                        {conv.isGroup
                                                            ? (conv.groupName ?? "G").charAt(0).toUpperCase()
                                                            : name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isOnline && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {name}
                                                    </p>
                                                    {lastMsg && (
                                                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                                                            {formatTimestamp(lastMsg._creationTime)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {preview}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <Badge className="bg-indigo-600 text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full ml-2 flex-shrink-0">
                                                            {conv.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
