"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
    icon: "chat" | "message" | "search" | "inbox";
    title: string;
    description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
    const iconPaths: Record<string, ReactNode> = {
        chat: (
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        ),
        message: (
            <>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </>
        ),
        inbox: (
            <>
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </>
        ),
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7 text-slate-500"
                >
                    {iconPaths[icon]}
                </svg>
            </div>
            <h3 className="text-sm font-medium text-slate-300 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 max-w-[200px]">{description}</p>
        </div>
    );
}
