# LiveChat - Real-time Messaging App

A real-time chat application built with Next.js, TypeScript, Convex, and Clerk.

## Features

- **Authentication** — Sign up/in with Clerk (email or social login)
- **User Search** — Find and start conversations with other users
- **Real-time DMs** — Instant messaging with Convex subscriptions
- **Group Chat** — Create group conversations with multiple members
- **Message Timestamps** — Smart formatting (today: time only, older: date + time)
- **Typing Indicators** — See when someone is typing with animated dots
- **Online/Offline Status** — Green dot for online users
- **Unread Message Count** — Badge showing unread messages per conversation
- **Message Reactions** — React with emojis (👍 ❤️ 😂 😮 😢)
- **Delete Messages** — Soft delete your own messages
- **Smart Auto-Scroll** — Auto-scroll on new messages, "New messages" button when scrolled up
- **Empty States** — Helpful messages when there are no conversations, messages, or search results
- **Loading States** — Skeleton loaders while data loads, error handling with retry
- **Responsive Layout** — Desktop sidebar + chat, mobile full-screen views

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Convex** (backend, database, real-time)
- **Clerk** (authentication)
- **Tailwind CSS** + **shadcn/ui**

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd livechat
```

2. Install dependencies:
```bash
npm install
```

3. Set up Clerk:
   - Create a Clerk application at [clerk.com](https://clerk.com)
   - Create a JWT template for Convex (named "convex")
   - Copy the Issuer URL

4. Set up Convex:
   - Run `npx convex dev` and follow prompts to create a project
   - Add `CLERK_JWT_ISSUER_DOMAIN` to Convex dashboard environment variables

5. Create `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
```

6. Run development servers:
```bash
npx convex dev   # Terminal 1
npm run dev      # Terminal 2
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
livechat/
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── auth.config.ts   # Clerk auth config
│   ├── users.ts         # User management functions
│   ├── conversations.ts # Conversation management
│   ├── messages.ts      # Message CRUD + reactions
│   └── typing.ts        # Typing indicators
├── src/
│   ├── app/
│   │   ├── layout.tsx   # Root layout with providers
│   │   ├── page.tsx     # Landing/auth page
│   │   └── chat/
│   │       └── page.tsx # Main chat interface
│   ├── components/
│   │   ├── ConvexClientProvider.tsx
│   │   ├── chat/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── EmptyState.tsx
│   │   └── ui/          # shadcn components
│   ├── lib/
│   │   ├── format.ts    # Timestamp formatting
│   │   └── utils.ts     # Utility functions
│   └── middleware.ts    # Clerk middleware
└── package.json
```

## Deployment

1. Push to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy Convex to production: `npx convex deploy`
