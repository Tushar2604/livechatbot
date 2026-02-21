"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import EmptyState from "@/components/chat/EmptyState";

export default function ChatPage() {
    const [selectedConversation, setSelectedConversation] =
        useState<Id<"conversations"> | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const storeUser = useMutation(api.users.store);
    const setOnline = useMutation(api.users.setOnline);
    const setOffline = useMutation(api.users.setOffline);
    const currentUser = useQuery(api.users.get);
    const router = useRouter();

    useEffect(() => {
        storeUser();
    }, [storeUser]);

    useEffect(() => {
        setOnline();

        const interval = setInterval(() => {
            setOnline();
        }, 30000);

        const handleBeforeUnload = () => {
            setOffline();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            setOffline();
        };
    }, [setOnline, setOffline]);

    const handleSelectConversation = useCallback(
        (conversationId: Id<"conversations">) => {
            setSelectedConversation(conversationId);
            if (window.innerWidth < 768) {
                setShowSidebar(false);
            }
        },
        []
    );

    const handleBack = useCallback(() => {
        setShowSidebar(true);
        setSelectedConversation(null);
    }, []);

    return (
        <>
            <Authenticated>
                <div className="flex h-screen bg-slate-950">
                    <div
                        className={`${showSidebar ? "flex" : "hidden"
                            } md:flex w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-800`}
                    >
                        <Sidebar
                            selectedConversation={selectedConversation}
                            onSelectConversation={handleSelectConversation}
                            currentUser={currentUser}
                        />
                    </div>

                    <div
                        className={`${!showSidebar ? "flex" : "hidden"
                            } md:flex flex-1 flex-col`}
                    >
                        {selectedConversation ? (
                            <ChatArea
                                conversationId={selectedConversation}
                                currentUser={currentUser}
                                onBack={handleBack}
                            />
                        ) : (
                            <div className="hidden md:flex flex-1 items-center justify-center">
                                <EmptyState
                                    icon="chat"
                                    title="Welcome to LiveChat"
                                    description="Select a conversation or start a new one to begin messaging"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Authenticated>

            <Unauthenticated>
                <RedirectToHome />
            </Unauthenticated>
        </>
    );
}

function RedirectToHome() {
    const router = useRouter();
    useEffect(() => {
        router.push("/");
    }, [router]);
    return null;
}
