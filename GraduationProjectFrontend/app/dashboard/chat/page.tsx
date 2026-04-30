import { ChatWorkspace } from "@/components/features/chat/chat-workspace"

export default function ChatPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ChatWorkspace
        variant="page"
        className="min-h-0 flex-1"
      />
    </div>
  )
}
