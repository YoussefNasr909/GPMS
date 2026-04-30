"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Eraser,
  FileIcon,
  ImageIcon,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { chatApi } from "@/lib/api/chat"
import { teamChatApi } from "@/lib/api/team-chat"
import { teamsApi } from "@/lib/api/teams"
import type {
  ApiChatClearResult,
  ApiChatContact,
  ApiChatConversationSummary,
  ApiChatDeleteMessageResult,
  ApiChatEditMessageResult,
  ApiChatMessage,
  ApiChatMessageStatus,
  ApiChatRelation,
  ApiChatSearchResult,
  ApiChatSeenResult,
  ApiChatSendResult,
  ApiChatUser,
  ApiTeamGroupChatConversationSummary,
  ApiTeamGroupChatMessage,
  ApiTeamGroupChatSeenResult,
  ApiTeamGroupChatSendResult,
  ApiTeamDetail,
  Role,
} from "@/lib/api/types"
import { useChat } from "@/components/features/chat/chat-provider"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

type ChatWorkspaceVariant = "page" | "launcher"
type ChatItemKind = "direct" | "contact" | "group"

type ChatListItem = {
  key: string
  kind: ChatItemKind
  conversationId: string | null
  title: string
  subtitle: string
  preview: string
  avatarUrl: string | null
  avatarFallback: string
  user: ApiChatUser | null
  relation: ApiChatRelation | null
  team: { id: string; name: string } | null
  participantCount: number | null
  unreadCount: number
  createdAt: string | null
  updatedAt: string | null
  lastActivityAt: string | null
  hasConversation: boolean
  pinLocked: boolean
}

type SocketAckSuccess<T> = {
  ok: true
  data: T
}

type SocketAckFailure = {
  ok: false
  error?: {
    message?: string
  }
}

function getUserInitial(user: ApiChatUser | null | undefined) {
  const source = user?.fullName || user?.email || "U"
  return source.trim().charAt(0).toUpperCase()
}

function getTextInitial(value: string | null | undefined) {
  return String(value ?? "U").trim().charAt(0).toUpperCase() || "U"
}

function humanizeRelation(relation: ApiChatRelation | null) {
  switch (relation) {
    case "TEAM_LEADER":
      return "Team leader"
    case "TEAM_DOCTOR":
      return "Doctor / Supervisor"
    case "TEAM_TA":
      return "Teaching assistant"
    case "SUPERVISED_TEAM_LEADER":
      return "Supervised leader"
    case "STUDENT_PEER":
      return "Student"
    case "STAFF_PEER":
      return "Staff"
    case "TEAM_MEMBER":
      return "Team member"
    default:
      return ""
  }
}

function roleToLabel(role: Role | undefined): string {
  switch (role) {
    case "LEADER":
      return "Team leader"
    case "DOCTOR":
      return "Doctor / Supervisor"
    case "TA":
      return "Teaching assistant"
    case "STUDENT":
      return "Student"
    case "ADMIN":
      return "Admin"
    default:
      return "User"
  }
}

function getRoleSearchTerms(role: Role | undefined, relation: ApiChatRelation | null) {
  const terms = [humanizeRelation(relation), roleToLabel(role)]

  switch (role) {
    case "DOCTOR":
      terms.push("doctor", "supervisor", "professor")
      break
    case "TA":
      terms.push("ta", "teaching assistant", "assistant")
      break
    case "LEADER":
      terms.push("leader", "team leader", "lead")
      break
    case "STUDENT":
      terms.push("student", "member", "team member")
      break
    default:
      break
  }

  return terms.join(" ")
}

function toDirectMessagePreview(message: ApiChatMessage | null, currentUserId: string | undefined) {
  if (!message) return "Start a direct conversation"
  if (message.isDeleted) return message.senderId === currentUserId ? "You deleted a message" : "Message deleted"
  if (message.fileUrl) {
    const isImage = message.fileType?.startsWith("image/")
    return message.senderId === currentUserId
      ? `You sent ${isImage ? "an image" : "a file"}`
      : `${isImage ? "Sent an image" : "Sent a file"}`
  }
  return message.senderId === currentUserId ? `You: ${message.content}` : message.content
}

function toGroupMessagePreview(message: ApiTeamGroupChatMessage | null, currentUserId: string | undefined) {
  if (!message) return "Start the team conversation"
  const senderLabel = message.senderId === currentUserId ? "You" : message.sender.fullName
  return `${senderLabel}: ${message.content}`
}

function sortConversations(conversations: ApiChatConversationSummary[]) {
  return [...conversations].sort((left, right) => {
    const leftTime = new Date(left.lastMessage?.createdAt ?? left.updatedAt ?? left.createdAt).getTime()
    const rightTime = new Date(right.lastMessage?.createdAt ?? right.updatedAt ?? right.createdAt).getTime()
    return rightTime - leftTime
  })
}

function sortGroupConversations(conversations: ApiTeamGroupChatConversationSummary[]) {
  return [...conversations].sort((left, right) => {
    const leftTime = new Date(left.lastMessage?.createdAt ?? left.updatedAt ?? left.createdAt).getTime()
    const rightTime = new Date(right.lastMessage?.createdAt ?? right.updatedAt ?? right.createdAt).getTime()
    return rightTime - leftTime
  })
}

function upsertConversation(
  conversations: ApiChatConversationSummary[],
  nextConversation: ApiChatConversationSummary,
) {
  const existingIndex = conversations.findIndex((conversation) => conversation.id === nextConversation.id)

  if (existingIndex === -1) {
    return sortConversations([nextConversation, ...conversations])
  }

  const nextConversations = [...conversations]
  nextConversations[existingIndex] = nextConversation
  return sortConversations(nextConversations)
}

function upsertGroupConversation(
  conversations: ApiTeamGroupChatConversationSummary[],
  nextConversation: ApiTeamGroupChatConversationSummary,
) {
  const existingIndex = conversations.findIndex((conversation) => conversation.id === nextConversation.id)

  if (existingIndex === -1) {
    return sortGroupConversations([nextConversation, ...conversations])
  }

  const nextConversations = [...conversations]
  nextConversations[existingIndex] = nextConversation
  return sortGroupConversations(nextConversations)
}

function attachConversationToContacts(contacts: ApiChatContact[], userId: string, conversationId: string) {
  return contacts.map((contact) =>
    contact.user.id === userId
      ? {
          ...contact,
          conversationId,
        }
      : contact,
  )
}

function mergeMessages(messages: ApiChatMessage[], nextMessage: ApiChatMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id)

  if (existingIndex === -1) {
    return [...messages, nextMessage].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )
  }

  const nextMessages = [...messages]
  nextMessages[existingIndex] = nextMessage
  return nextMessages
}

function mergeGroupMessages(messages: ApiTeamGroupChatMessage[], nextMessage: ApiTeamGroupChatMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id)

  if (existingIndex === -1) {
    return [...messages, nextMessage].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )
  }

  const nextMessages = [...messages]
  nextMessages[existingIndex] = nextMessage
  return nextMessages
}

function updateMessageStatus(
  messages: ApiChatMessage[],
  payload: {
    messageId: string
    deliveredAt: string | null
    seenAt: string | null
    status: ApiChatMessageStatus
  },
) {
  return messages.map((message) =>
    message.id === payload.messageId
      ? {
          ...message,
          deliveredAt: payload.deliveredAt,
          seenAt: payload.seenAt,
          status: payload.status,
        }
      : message,
  )
}

async function emitWithAck<T>(
  socket: NonNullable<ReturnType<typeof useChat>["socket"]>,
  event: string,
  payload: unknown,
) {
  return new Promise<T>((resolve, reject) => {
    socket.emit(
      event,
      payload,
      (response: SocketAckSuccess<T> | SocketAckFailure | undefined) => {
        if (response && "ok" in response && response.ok) {
          resolve(response.data)
          return
        }

        reject(new Error(response?.error?.message || "Chat request failed."))
      },
    )
  })
}

function getPinnedStorageKey(userId: string) {
  return `gpms-chat-pins:${userId}`
}

function formatSidebarTime(value: string | null) {
  if (!value) return ""

  const date = new Date(value)
  const time = date.getTime()

  if (Number.isNaN(time)) return ""

  const diff = Math.max(0, Date.now() - time)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "now"
  if (diff < hour) return `${Math.floor(diff / minute)}m`
  if (diff < day) return `${Math.floor(diff / hour)}h`
  if (diff < day * 7) return `${Math.floor(diff / day)}d`

  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

function MessageStatusIcon({ message }: { message: ApiChatMessage }) {
  if (message.status === "SEEN") {
    return <CheckCheck className="h-3.5 w-3.5 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.65)]" />
  }

  if (message.status === "DELIVERED") {
    return <CheckCheck className="h-3.5 w-3.5 text-primary/80" />
  }

  return <Check className="h-3.5 w-3.5 text-primary/70" />
}

function isEditedMessage(message: { isDeleted?: boolean; createdAt: string; updatedAt: string }) {
  return message.isDeleted !== true && new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime() + 1000
}

function ChatItemAvatar({
  item,
  selected = false,
}: {
  item: ChatListItem
  selected?: boolean
}) {
  if (item.kind === "group") {
    return (
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground",
          selected
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border/60 dark:border-zinc-700/60 dark:bg-zinc-800/70 dark:text-zinc-300",
        )}
      >
        <Users className="h-4.5 w-4.5" />
      </div>
    )
  }

  return (
    <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/60 dark:ring-zinc-700/60">
      <AvatarImage src={item.avatarUrl || "/placeholder-user.jpg"} />
      <AvatarFallback className="bg-muted text-sm font-semibold text-foreground dark:bg-zinc-700 dark:text-zinc-200">
        {item.avatarFallback}
      </AvatarFallback>
    </Avatar>
  )
}

function buildDirectItem(
  {
    key,
    conversationId,
    user,
    relation,
    team,
    lastMessage,
    unreadCount,
    createdAt,
    updatedAt,
    hasConversation,
  }: {
    key: string
    conversationId: string | null
    user: ApiChatUser
    relation: ApiChatRelation | null
    team: { id: string; name: string } | null
    lastMessage: ApiChatMessage | null
    unreadCount: number
    createdAt: string | null
    updatedAt: string | null
    hasConversation: boolean
  },
  currentUserId: string | undefined,
): ChatListItem {
  const subtitle = [humanizeRelation(relation), team?.name].filter(Boolean).join(" - ")

  return {
    key,
    kind: hasConversation ? "direct" : "contact",
    conversationId,
    title: user.fullName,
    subtitle,
    preview: hasConversation ? toDirectMessagePreview(lastMessage, currentUserId) : "Start a direct conversation",
    avatarUrl: user.avatarUrl ?? null,
    avatarFallback: getUserInitial(user),
    user,
    relation,
    team,
    participantCount: null,
    unreadCount,
    createdAt,
    updatedAt,
    lastActivityAt: lastMessage?.createdAt ?? updatedAt ?? createdAt,
    hasConversation,
    pinLocked: false,
  }
}

function buildGroupItem(
  conversation: ApiTeamGroupChatConversationSummary,
  currentUserId: string | undefined,
): ChatListItem {
  return {
    key: `group:${conversation.id}`,
    kind: "group",
    conversationId: conversation.id,
    title: conversation.team.name,
    subtitle: `Team group chat - ${conversation.participantCount} member${conversation.participantCount === 1 ? "" : "s"}`,
    preview: toGroupMessagePreview(conversation.lastMessage, currentUserId),
    avatarUrl: null,
    avatarFallback: getTextInitial(conversation.team.name),
    user: null,
    relation: null,
    team: conversation.team,
    participantCount: conversation.participantCount,
    unreadCount: conversation.unreadCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    lastActivityAt: conversation.lastMessage?.createdAt ?? conversation.updatedAt ?? conversation.createdAt,
    hasConversation: true,
    pinLocked: conversation.isPinned ?? true,
  }
}

export function ChatWorkspace({
  variant,
  className,
  onClose,
}: {
  variant: ChatWorkspaceVariant
  className?: string
  onClose?: () => void
}) {
  const searchParams = useSearchParams()
  const { currentUser } = useAuthStore()
  const { socket, connected, refreshUnreadCount, setUnreadCount } = useChat()
  const [bootstrapLoading, setBootstrapLoading] = useState(true)
  const [bootstrapError, setBootstrapError] = useState("")
  const [messageLoading, setMessageLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [clearingConversationId, setClearingConversationId] = useState<string | null>(null)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<ApiChatMessage | null>(null)
  const [conversations, setConversations] = useState<ApiChatConversationSummary[]>([])
  const [groupConversations, setGroupConversations] = useState<ApiTeamGroupChatConversationSummary[]>([])
  const [contacts, setContacts] = useState<ApiChatContact[]>([])
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ApiChatMessage[]>>({})
  const [groupMessagesByConversation, setGroupMessagesByConversation] = useState<Record<string, ApiTeamGroupChatMessage[]>>({})
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const [selectedItemOverride, setSelectedItemOverride] = useState<ChatListItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchedContacts, setSearchedContacts] = useState<ApiChatSearchResult[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [draft, setDraft] = useState("")
  const [fileAttachment, setFileAttachment] = useState<File | null>(null)
  const [showNewConversationPicker, setShowNewConversationPicker] = useState(false)
  const [showListOnMobile, setShowListOnMobile] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [pinnedItemKeys, setPinnedItemKeys] = useState<string[]>([])
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [membersDialogTeam, setMembersDialogTeam] = useState<ApiTeamDetail | null>(null)
  const [membersDialogLoading, setMembersDialogLoading] = useState(false)
  const [membersDialogError, setMembersDialogError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const messagesContentRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomUntilRef = useRef(0)
  const selectedItemRef = useRef<ChatListItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const pageSelectedKey = variant === "page" ? searchParams.get("key") : null

  useEffect(() => {
    if (!currentUser?.id) {
      setPinnedItemKeys([])
      return
    }

    try {
      const raw = window.localStorage.getItem(getPinnedStorageKey(currentUser.id))
      const parsed = raw ? JSON.parse(raw) : []
      setPinnedItemKeys(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [])
    } catch {
      setPinnedItemKeys([])
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id) return

    window.localStorage.setItem(getPinnedStorageKey(currentUser.id), JSON.stringify(pinnedItemKeys))
  }, [currentUser?.id, pinnedItemKeys])

  const loadBootstrap = useCallback(async () => {
    setBootstrapLoading(true)
    setBootstrapError("")

    try {
      const [directResult, groupResult] = await Promise.allSettled([chatApi.bootstrap(), teamChatApi.bootstrap()])

      if (directResult.status === "rejected") {
        throw directResult.reason
      }

      const directData = directResult.value
      const groupConversations =
        groupResult.status === "fulfilled" ? sortGroupConversations(groupResult.value.conversations) : []
      const groupUnreadCount = groupConversations.reduce((total, conversation) => total + conversation.unreadCount, 0)

      setConversations(sortConversations(directData.conversations))
      setGroupConversations(groupConversations)
      setContacts(directData.contacts)
      setUnreadCount(directData.unreadCount + groupUnreadCount)

      const availableKeys = new Set<string>([
        ...directData.conversations.map((conversation) => `conversation:${conversation.id}`),
        ...directData.contacts.map((contact) =>
          contact.conversationId ? `conversation:${contact.conversationId}` : `contact:${contact.user.id}`,
        ),
        ...groupConversations.map((conversation) => `group:${conversation.id}`),
      ])

      setSelectedItemKey((currentKey) => {
        if (variant === "page" && pageSelectedKey && availableKeys.has(pageSelectedKey)) {
          return pageSelectedKey
        }

        if (currentKey && availableKeys.has(currentKey)) {
          return currentKey
        }

        const pinnedGroupKey = groupConversations[0] ? `group:${groupConversations[0].id}` : null
        if (pinnedGroupKey) return pinnedGroupKey

        const targetConversation =
          directData.conversations.find((conversation) => conversation.unreadCount > 0) ?? directData.conversations[0]
        if (targetConversation) {
          return `conversation:${targetConversation.id}`
        }

        if (directData.contacts[0]) {
          return directData.contacts[0].conversationId
            ? `conversation:${directData.contacts[0].conversationId}`
            : `contact:${directData.contacts[0].user.id}`
        }

        return null
      })
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Couldn't load chats right now.")
    } finally {
      setBootstrapLoading(false)
    }
  }, [pageSelectedKey, setUnreadCount, variant])

  const allItems = useMemo<ChatListItem[]>(() => {
    const directConversationByUserId = new Map(
      conversations.map((conversation) => [conversation.participant.id, conversation]),
    )

    const mappedContacts = contacts.map((contact) => {
      const conversation = directConversationByUserId.get(contact.user.id)

      return buildDirectItem(
        {
          key: conversation ? `conversation:${conversation.id}` : `contact:${contact.user.id}`,
          conversationId: conversation?.id ?? contact.conversationId ?? null,
          user: contact.user,
          relation: contact.relation,
          team: contact.team,
          lastMessage: conversation?.lastMessage ?? null,
          unreadCount: conversation?.unreadCount ?? 0,
          createdAt: conversation?.createdAt ?? null,
          updatedAt: conversation?.updatedAt ?? null,
          hasConversation: Boolean(conversation?.id),
        },
        currentUser?.id,
      )
    })

    const contactIds = new Set(mappedContacts.map((contact) => contact.user?.id).filter(Boolean))

    const mappedPeerConversations = conversations
      .filter((conversation) => !contactIds.has(conversation.participant.id))
      .map((conversation) =>
        buildDirectItem(
          {
            key: `conversation:${conversation.id}`,
            conversationId: conversation.id,
            user: conversation.participant,
            relation: conversation.relation ?? "STUDENT_PEER",
            team: conversation.team ?? null,
            lastMessage: conversation.lastMessage ?? null,
            unreadCount: conversation.unreadCount ?? 0,
            createdAt: conversation.createdAt ?? null,
            updatedAt: conversation.updatedAt ?? null,
            hasConversation: true,
          },
          currentUser?.id,
        ),
      )

    const mappedGroupConversations = groupConversations.map((conversation) =>
      buildGroupItem(conversation, currentUser?.id),
    )

    return [...mappedGroupConversations, ...mappedContacts, ...mappedPeerConversations].sort((left, right) => {
      const leftTime = new Date(left.lastActivityAt ?? left.updatedAt ?? left.createdAt ?? 0).getTime()
      const rightTime = new Date(right.lastActivityAt ?? right.updatedAt ?? right.createdAt ?? 0).getTime()

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return left.title.localeCompare(right.title)
    })
  }, [contacts, conversations, currentUser?.id, groupConversations])

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return allItems

    return allItems.filter((item) => {
      const haystack = [
        item.title,
        item.subtitle,
        item.preview,
        item.user?.email ?? "",
        item.user?.academicId ?? "",
        item.team?.name ?? "",
        item.kind === "group" ? "group team shared members students" : "",
        getRoleSearchTerms(item.user?.role, item.relation),
      ]
        .join(" ")
        .toLowerCase()

      const queryWords = normalizedQuery.split(/\s+/).filter(Boolean)
      if (!queryWords.length) return true

      return queryWords.every((word) => haystack.includes(word))
    })
  }, [allItems, searchQuery])

  useEffect(() => {
    if (!showNewConversationPicker) {
      setSearchedContacts([])
      setIsSearchingUsers(false)
      return
    }

    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchedContacts([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        const results = await chatApi.searchUsers(query)
        setSearchedContacts(results)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Search failed")
        setSearchedContacts([])
      } finally {
        setIsSearchingUsers(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, showNewConversationPicker])

  const selectedItem = useMemo(() => {
    if (selectedItemOverride && selectedItemOverride.key === selectedItemKey) {
      return selectedItemOverride
    }

    return allItems.find((item) => item.key === selectedItemKey) ?? null
  }, [allItems, selectedItemKey, selectedItemOverride])

  const selectedConversationId = selectedItem?.conversationId ?? null
  const selectedDirectMessages =
    selectedItem?.kind === "direct" && selectedConversationId ? messagesByConversation[selectedConversationId] ?? [] : []
  const selectedGroupMessages =
    selectedItem?.kind === "group" && selectedConversationId
      ? groupMessagesByConversation[selectedConversationId] ?? []
      : []
  const usesSinglePaneLayout = isMobile || variant === "launcher"
  const showConversationPanel = !usesSinglePaneLayout || !showListOnMobile

  const searchedItems = useMemo<ChatListItem[]>(() => {
    return searchedContacts.map((contact) => {
      const conversation = conversations.find((item) => item.participant.id === contact.user.id)

      return buildDirectItem(
        {
          key: contact.conversationId ? `conversation:${contact.conversationId}` : `contact:${contact.user.id}`,
          conversationId: contact.conversationId ?? conversation?.id ?? null,
          user: contact.user,
          relation: contact.relation,
          team: contact.team,
          lastMessage: conversation?.lastMessage ?? null,
          unreadCount: conversation?.unreadCount ?? 0,
          createdAt: conversation?.createdAt ?? null,
          updatedAt: conversation?.updatedAt ?? null,
          hasConversation: Boolean(contact.conversationId ?? conversation?.id),
        },
        currentUser?.id,
      )
    })
  }, [conversations, currentUser?.id, searchedContacts])

  useEffect(() => {
    selectedItemRef.current = selectedItem
  }, [selectedItem])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile && variant === "page") {
        setShowListOnMobile(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [variant])

  useEffect(() => {
    if (variant !== "page") return

    setSelectedItemKey(pageSelectedKey)
    setSelectedItemOverride(null)

    if (pageSelectedKey && isMobile) {
      setShowListOnMobile(false)
      return
    }

    if (!pageSelectedKey) {
      setShowListOnMobile(true)
    }
  }, [isMobile, pageSelectedKey, variant])

  useEffect(() => {
    void loadBootstrap()
  }, [loadBootstrap])

  const loadDirectMessages = useCallback(async (conversationId: string) => {
    setMessageLoading(true)

    try {
      const data = await chatApi.messages(conversationId)
      setConversations((current) => upsertConversation(current, data.conversation))
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: data.messages,
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't load messages right now.")
    } finally {
      setMessageLoading(false)
    }
  }, [])

  const loadGroupMessages = useCallback(async (conversationId: string) => {
    setMessageLoading(true)

    try {
      const data = await teamChatApi.messages(conversationId)
      setGroupConversations((current) => upsertGroupConversation(current, data.conversation))
      setGroupMessagesByConversation((current) => ({
        ...current,
        [conversationId]: data.messages,
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't load team messages right now.")
    } finally {
      setMessageLoading(false)
    }
  }, [])

  const applySeenResult = useCallback(
    (result: ApiChatSeenResult) => {
      setConversations((current) => upsertConversation(current, result.conversation))
      setMessagesByConversation((current) => ({
        ...current,
        [result.conversation.id]: (current[result.conversation.id] ?? []).map((message) =>
          result.seenMessageIds.includes(message.id)
            ? {
                ...message,
                deliveredAt: result.conversation.lastSeenAt,
                seenAt: result.conversation.lastSeenAt,
                status: "SEEN",
              }
            : message,
        ),
      }))
      setUnreadCount(result.unreadCount)
    },
    [setUnreadCount],
  )

  useEffect(() => {
    if (!selectedItem || !selectedConversationId) return

    if (selectedItem.kind === "direct" && !messagesByConversation[selectedConversationId]) {
      void loadDirectMessages(selectedConversationId)
    }

    if (selectedItem.kind === "group" && !groupMessagesByConversation[selectedConversationId]) {
      void loadGroupMessages(selectedConversationId)
    }
  }, [
    groupMessagesByConversation,
    loadDirectMessages,
    loadGroupMessages,
    messagesByConversation,
    selectedConversationId,
    selectedItem,
  ])

  useEffect(() => {
    if (!selectedItem || !selectedConversationId) return
    if (!showConversationPanel) return

    let cancelled = false

    const openConversation = async () => {
      try {
        if (selectedItem.kind === "group") {
          const result: ApiTeamGroupChatSeenResult = await teamChatApi.markSeen(selectedConversationId)
          if (!cancelled) {
            setGroupConversations((current) => upsertGroupConversation(current, result.conversation))
          }
          return
        }

        if (selectedItem.kind !== "direct") return

        const result =
          socket && connected
            ? await emitWithAck<ApiChatSeenResult>(socket, "chat:conversation:open", {
                conversationId: selectedConversationId,
              })
            : await chatApi.markSeen(selectedConversationId)

        if (!cancelled) {
          applySeenResult(result)
        }
      } catch {
        // Best effort only.
      }
    }

    void openConversation()

    return () => {
      cancelled = true
      if (selectedItem.kind === "direct") {
        socket?.emit("chat:conversation:close")
      }
    }
  }, [applySeenResult, connected, selectedConversationId, selectedItem, showConversationPanel, socket])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (payload: { conversation: ApiChatConversationSummary; message: ApiChatMessage }) => {
      setConversations((current) => upsertConversation(current, payload.conversation))
      setContacts((current) =>
        attachConversationToContacts(current, payload.conversation.participant.id, payload.conversation.id),
      )

      const activeItem = selectedItemRef.current
      const shouldAppend =
        activeItem?.kind === "direct" &&
        (activeItem.conversationId === payload.conversation.id || activeItem.user?.id === payload.conversation.participant.id)

      if (shouldAppend) {
        setMessagesByConversation((current) => ({
          ...current,
          [payload.conversation.id]: mergeMessages(current[payload.conversation.id] ?? [], payload.message),
        }))
      }

      if (activeItem?.kind === "contact" && activeItem.user?.id === payload.conversation.participant.id) {
        setSelectedItemKey(`conversation:${payload.conversation.id}`)
      }
    }

    const handleMessageStatus = (payload: {
      conversationId: string
      messageId: string
      deliveredAt: string | null
      seenAt: string | null
      status: ApiChatMessageStatus
    }) => {
      setMessagesByConversation((current) => {
        const existingMessages = current[payload.conversationId]
        if (!existingMessages) return current

        return {
          ...current,
          [payload.conversationId]: updateMessageStatus(existingMessages, payload),
        }
      })

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === payload.conversationId && conversation.lastMessage?.id === payload.messageId
            ? {
                ...conversation,
                lastMessage: {
                  ...conversation.lastMessage,
                  deliveredAt: payload.deliveredAt,
                  seenAt: payload.seenAt,
                  status: payload.status,
                },
              }
            : conversation,
        ),
      )
    }

    const handleMessageDeleted = (payload: ApiChatDeleteMessageResult) => {
      setMessagesByConversation((current) => ({
        ...current,
        [payload.conversationId]: mergeMessages(current[payload.conversationId] ?? [], payload.message),
      }))

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === payload.conversationId && conversation.lastMessage?.id === payload.message.id
            ? {
                ...conversation,
                lastMessage: payload.message,
              }
            : conversation,
        ),
      )
    }

    const handleMessageEdited = (payload: ApiChatEditMessageResult) => {
      setMessagesByConversation((current) => ({
        ...current,
        [payload.conversationId]: mergeMessages(current[payload.conversationId] ?? [], payload.message),
      }))

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === payload.conversationId && conversation.lastMessage?.id === payload.message.id
            ? {
                ...conversation,
                lastMessage: payload.message,
              }
            : conversation,
        ),
      )
    }

    const handleConversationCleared = (payload: { conversationId: string }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [payload.conversationId]: [],
      }))

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === payload.conversationId
            ? {
                ...conversation,
                unreadCount: 0,
                lastMessage: null,
              }
            : conversation,
        ),
      )
    }

    socket.on("chat:message:new", handleNewMessage)
    socket.on("chat:message:status", handleMessageStatus)
    socket.on("chat:message:deleted", handleMessageDeleted)
    socket.on("chat:message:edited", handleMessageEdited)
    socket.on("chat:conversation:cleared", handleConversationCleared)

    return () => {
      socket.off("chat:message:new", handleNewMessage)
      socket.off("chat:message:status", handleMessageStatus)
      socket.off("chat:message:deleted", handleMessageDeleted)
      socket.off("chat:message:edited", handleMessageEdited)
      socket.off("chat:conversation:cleared", handleConversationCleared)
    }
  }, [socket])

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const directViewport = messagesViewportRef.current
    if (directViewport) {
      const top = Math.max(0, directViewport.scrollHeight - directViewport.clientHeight)
      directViewport.scrollTop = top
      directViewport.scrollTo({
        top,
        behavior,
      })
      return
    }

    const marker = messagesEndRef.current
    if (!marker) return

    const viewport = marker.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
      return
    }

    marker.scrollIntoView({ behavior, block: "end" })
  }, [])

  const keepMessagesPinnedToBottom = useCallback((duration = 1200) => {
    stickToBottomUntilRef.current = Date.now() + duration
    scrollMessagesToBottom("auto")
  }, [scrollMessagesToBottom])

  useLayoutEffect(() => {
    const behavior: ScrollBehavior = variant === "launcher" ? "auto" : "smooth"
    const timers: number[] = []
    const frames: number[] = []

    keepMessagesPinnedToBottom(variant === "launcher" ? 1800 : 900)
    scrollMessagesToBottom(behavior)

    frames.push(window.requestAnimationFrame(() => {
      scrollMessagesToBottom(behavior)
      frames.push(window.requestAnimationFrame(() => scrollMessagesToBottom(behavior)))
    }))

    for (const delay of [50, 150, 350, 700]) {
      timers.push(window.setTimeout(() => scrollMessagesToBottom(behavior), delay))
    }

    return () => {
      frames.forEach((frame) => window.cancelAnimationFrame(frame))
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [
    messageLoading,
    scrollMessagesToBottom,
    keepMessagesPinnedToBottom,
    selectedConversationId,
    selectedDirectMessages.length,
    selectedGroupMessages.length,
    variant,
  ])

  useEffect(() => {
    const viewport = messagesViewportRef.current
    const content = messagesContentRef.current
    if (!viewport || !content) return

    const maybeStickToBottom = () => {
      if (Date.now() <= stickToBottomUntilRef.current) {
        scrollMessagesToBottom("auto")
      }
    }

    const resizeObserver = new ResizeObserver(maybeStickToBottom)
    resizeObserver.observe(viewport)
    resizeObserver.observe(content)

    const mutationObserver = new MutationObserver(maybeStickToBottom)
    mutationObserver.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })

    maybeStickToBottom()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [
    messageLoading,
    scrollMessagesToBottom,
    selectedConversationId,
    selectedDirectMessages.length,
    selectedGroupMessages.length,
  ])

  const selectItem = useCallback(
    (item: ChatListItem) => {
      setSelectedItemKey(item.key)
      setSelectedItemOverride(item)
      keepMessagesPinnedToBottom(variant === "launcher" ? 2000 : 1000)
      setDraft("")
      setEditingMessage(null)
      setShowNewConversationPicker(false)
      setFileAttachment(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      if (isMobile || variant === "launcher") {
        setShowListOnMobile(false)
      }
    },
    [isMobile, keepMessagesPinnedToBottom, variant],
  )

  const handleBack = () => {
    setEditingMessage(null)
    setShowNewConversationPicker(false)
    setShowListOnMobile(true)
  }

  const handleStartNewConversation = () => {
    setShowNewConversationPicker(true)
    setShowListOnMobile(true)
    setSearchQuery("")
  }

  const handleTogglePin = useCallback((item: ChatListItem) => {
    if (item.pinLocked || !item.hasConversation) return

    setPinnedItemKeys((current) =>
      current.includes(item.key) ? current.filter((value) => value !== item.key) : [item.key, ...current],
    )
  }, [])

  const isPinned = useCallback(
    (item: ChatListItem) => item.pinLocked || pinnedItemKeys.includes(item.key),
    [pinnedItemKeys],
  )

  const handleOpenTeamMembers = useCallback(async (item: ChatListItem) => {
    if (item.kind !== "group" || !item.team?.id) return

    setMembersDialogOpen(true)
    setMembersDialogLoading(true)
    setMembersDialogError("")

    try {
      const team = await teamsApi.getById(item.team.id)
      setMembersDialogTeam(team)
    } catch (error) {
      setMembersDialogError(error instanceof Error ? error.message : "Couldn't load team members right now.")
      setMembersDialogTeam(null)
    } finally {
      setMembersDialogLoading(false)
    }
  }, [])

  const handleSend = async () => {
    if (editingMessage) {
      await handleSaveEditedMessage()
      return
    }

    const trimmedDraft = draft.trim()
    if ((!trimmedDraft && !fileAttachment) || !selectedItem) return

    setSending(true)

    try {
      if (selectedItem.kind === "group") {
        if (!selectedConversationId) return

        if (fileAttachment) {
          toast.error("File attachments are only available in direct messages right now.")
          return
        }

        const result: ApiTeamGroupChatSendResult = await teamChatApi.send(selectedConversationId, {
          content: trimmedDraft,
        })

        setGroupConversations((current) => upsertGroupConversation(current, result.conversation))
        setGroupMessagesByConversation((current) => ({
          ...current,
          [selectedConversationId]: mergeGroupMessages(current[selectedConversationId] ?? [], result.message),
        }))
        setDraft("")
        return
      }

      if (!selectedItem.user) return

      const result =
        socket && connected && !fileAttachment
          ? await emitWithAck<ApiChatSendResult>(socket, "chat:message:send", {
              recipientId: selectedItem.user.id,
              content: trimmedDraft,
            })
          : await chatApi.send(
              {
                recipientId: selectedItem.user.id,
                content: trimmedDraft,
              },
              fileAttachment ?? undefined,
            )

      setConversations((current) => upsertConversation(current, result.conversation))
      setContacts((current) =>
        attachConversationToContacts(current, result.conversation.participant.id, result.conversation.id),
      )
      setMessagesByConversation((current) => ({
        ...current,
        [result.conversation.id]: mergeMessages(current[result.conversation.id] ?? [], result.message),
      }))
      setSelectedItemKey(`conversation:${result.conversation.id}`)
      setDraft("")
      setFileAttachment(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send that message.")
    } finally {
      setSending(false)
    }
  }

  const handleStartEditMessage = (message: ApiChatMessage) => {
    setEditingMessage(message)
    setDraft(message.content)
    setFileAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    window.setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleCancelEditMessage = () => {
    setEditingMessage(null)
    setDraft("")
  }

  const handleSaveEditedMessage = async () => {
    if (!editingMessage) return

    const content = draft.trim()
    if (!content) return

    if (content === editingMessage.content) {
      setEditingMessage(null)
      setDraft("")
      return
    }

    setSending(true)

    try {
      const result = await chatApi.editMessage(editingMessage.id, { content })
      setMessagesByConversation((current) => ({
        ...current,
        [result.conversationId]: mergeMessages(current[result.conversationId] ?? [], result.message),
      }))
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === result.conversationId && conversation.lastMessage?.id === result.message.id
            ? {
                ...conversation,
                lastMessage: result.message,
              }
            : conversation,
        ),
      )
      setEditingMessage(null)
      setDraft("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't edit that message.")
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    setDeletingMessageId(messageId)

    try {
      const result = await chatApi.deleteMessage(messageId)
      if (editingMessage?.id === messageId) {
        setEditingMessage(null)
        setDraft("")
      }
      setMessagesByConversation((current) => ({
        ...current,
        [result.conversationId]: mergeMessages(current[result.conversationId] ?? [], result.message),
      }))
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === result.conversationId && conversation.lastMessage?.id === result.message.id
            ? {
                ...conversation,
                lastMessage: result.message,
              }
            : conversation,
        ),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete that message.")
    } finally {
      setDeletingMessageId(null)
    }
  }

  const handleClearConversation = async () => {
    if (!selectedConversationId || selectedItem?.kind !== "direct") return

    setClearingConversationId(selectedConversationId)

    try {
      const result: ApiChatClearResult = await chatApi.clearConversation(selectedConversationId)
      setMessagesByConversation((current) => ({
        ...current,
        [selectedConversationId]: [],
      }))
      setConversations((current) => upsertConversation(current, result.conversation))
      setUnreadCount(result.unreadCount)
      toast.success("Chat cleared for your account.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't clear that chat.")
    } finally {
      setClearingConversationId(null)
    }
  }

  const handleRefreshSelected = async () => {
    await loadBootstrap()

    if (!selectedItem || !selectedConversationId) return

    if (selectedItem.kind === "group") {
      await loadGroupMessages(selectedConversationId)
      return
    }

    if (selectedItem.kind === "direct") {
      await loadDirectMessages(selectedConversationId)
    }
  }

  const directUnreadCount = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
  const groupUnreadCount = groupConversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
  const unreadCount = directUnreadCount + groupUnreadCount
  const pinnedItems = filteredItems
    .filter((item) => item.hasConversation && isPinned(item))
    .sort((left, right) => {
      if (left.pinLocked !== right.pinLocked) return left.pinLocked ? -1 : 1

      const leftTime = new Date(left.lastActivityAt ?? left.updatedAt ?? left.createdAt ?? 0).getTime()
      const rightTime = new Date(right.lastActivityAt ?? right.updatedAt ?? right.createdAt ?? 0).getTime()
      return rightTime - leftTime
    })
  const unreadItems = filteredItems.filter(
    (item) => item.hasConversation && !isPinned(item) && item.unreadCount > 0,
  )
  const recentItems = filteredItems.filter(
    (item) => item.hasConversation && !isPinned(item) && item.unreadCount === 0,
  )
  const newContactItems = filteredItems.filter((item) => item.kind === "contact")
  const hasInboxItems = pinnedItems.length > 0 || unreadItems.length > 0 || recentItems.length > 0

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card transition-all duration-300 dark:border-zinc-800/70 dark:bg-zinc-950",
        variant === "launcher" && "rounded-[32px] shadow-[0_32px_80px_-28px_rgba(0,0,0,0.75)] dark:border-zinc-800/60",
        className,
      )}
    >
      {variant === "launcher" && (
        <div className="flex items-center justify-end gap-3 border-b border-border/70 bg-card/90 px-5 py-3 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/80">
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full px-3 text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Link href={selectedItemKey ? `/dashboard/chat?key=${encodeURIComponent(selectedItemKey)}` : "/dashboard/chat"}>
                Open page
              </Link>
            </Button>
            {onClose ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4 md:hidden" />
                <X className="hidden h-4 w-4 md:block" />
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "min-h-0 w-full max-w-full shrink-0 overflow-hidden flex-col bg-muted/20 dark:bg-zinc-900/50",
            usesSinglePaneLayout ? "border-r-0" : "border-r border-border/70 md:w-[340px] xl:w-[360px] dark:border-zinc-800/60",
            showConversationPanel && usesSinglePaneLayout ? "hidden" : "flex",
          )}
        >
          <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3 dark:border-zinc-800/60">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-foreground dark:text-zinc-100">Messages</h2>
            </div>
            {unreadCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
            <Button
              type="button"
              variant={showNewConversationPicker ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => {
                if (showNewConversationPicker) {
                  setShowNewConversationPicker(false)
                  setSearchQuery("")
                  return
                }

                handleStartNewConversation()
              }}
            >
              {showNewConversationPicker ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <div className="border-b border-border/50 px-3 py-2.5 dark:border-zinc-800/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground dark:text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={showNewConversationPicker ? "Search people..." : "Search chats..."}
                className="h-9 rounded-full border-border/60 bg-muted/50 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/40 dark:border-zinc-700/50 dark:bg-zinc-800/60 dark:text-zinc-200 dark:placeholder:text-zinc-500"
              />
              {searchQuery && !isSearchingUsers ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
              {isSearchingUsers ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground dark:text-zinc-500" />
                </div>
              ) : null}
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 px-3 py-3">
              {bootstrapLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading your chats...
                </div>
              ) : bootstrapError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive dark:bg-destructive/8 dark:text-red-400">
                  <p>{bootstrapError}</p>
                  <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => void loadBootstrap()}>
                    Retry
                  </Button>
                </div>
              ) : showNewConversationPicker ? (
                searchQuery.trim().length >= 2 ? (
                  isSearchingUsers ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : searchedItems.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-sm font-medium">No results found</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Try a different name, role, or email address.
                      </p>
                    </div>
                  ) : (
                    <ChatListSection
                      title={`Results (${searchedItems.length})`}
                      items={searchedItems}
                      selectedItemKey={selectedItemKey}
                      onSelect={selectItem}
                      onTogglePin={handleTogglePin}
                      isPinned={isPinned}
                    />
                  )
                ) : newContactItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-medium">Search to start a conversation</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Type a name or email above to find someone to chat with.
                    </p>
                  </div>
                ) : (
                  <ChatListSection
                    title="Available contacts"
                    items={newContactItems}
                    selectedItemKey={selectedItemKey}
                    onSelect={selectItem}
                    onTogglePin={handleTogglePin}
                    isPinned={isPinned}
                  />
                )
              ) : filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium">
                    {searchQuery.trim() ? "No chats match that search" : "No chat contacts available yet"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchQuery.trim()
                      ? "Try a different name or clear the search."
                      : "Chats appear when you join a team or get assigned as the matching leader/supervisor pair."}
                  </p>
                </div>
              ) : !hasInboxItems ? (
                <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium">No conversations yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use the search bar or the + button to start your first conversation.
                  </p>
                  {newContactItems.length > 0 ? (
                    <Button variant="outline" className="mt-4 rounded-full" onClick={handleStartNewConversation}>
                      <Plus className="h-4 w-4" />
                      New conversation
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  {pinnedItems.length > 0 ? (
                    <ChatListSection
                      title="Pinned"
                      items={pinnedItems}
                      selectedItemKey={selectedItemKey}
                      onSelect={selectItem}
                      onTogglePin={handleTogglePin}
                      isPinned={isPinned}
                    />
                  ) : null}

                  {unreadItems.length > 0 ? (
                    <ChatListSection
                      title="Unread"
                      items={unreadItems}
                      selectedItemKey={selectedItemKey}
                      onSelect={selectItem}
                      onTogglePin={handleTogglePin}
                      isPinned={isPinned}
                    />
                  ) : null}

                  {recentItems.length > 0 ? (
                    <ChatListSection
                      title="Recent"
                      items={recentItems}
                      selectedItemKey={selectedItemKey}
                      onSelect={selectItem}
                      onTogglePin={handleTogglePin}
                      isPinned={isPinned}
                    />
                  ) : null}

                  {newContactItems.length > 0 ? (
                    <p className="px-2 py-1 text-[11px] text-zinc-600">
                      {newContactItems.length} contact{newContactItems.length !== 1 ? "s" : ""} available - tap{" "}
                      <span className="text-zinc-500">+</span> to start chatting
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </ScrollArea>
        </aside>

        <section
          className={cn("min-h-0 min-w-0 flex-1 flex-col", showConversationPanel ? "flex" : "hidden")}
        >
          {selectedItem ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-card/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {usesSinglePaneLayout ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  ) : null}

                  {selectedItem.kind === "group" ? (
                    <button
                      type="button"
                      onClick={() => void handleOpenTeamMembers(selectedItem)}
                      className="group/header flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:hover:bg-zinc-800/35"
                      aria-label="View chat members"
                    >
                      <ChatItemAvatar item={selectedItem} selected />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold leading-tight text-foreground transition-colors group-hover/header:text-primary dark:text-zinc-100">
                          {selectedItem.title} Team Group
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-zinc-500">
                          {selectedItem.subtitle}
                        </p>
                      </div>
                    </button>
                  ) : selectedItem.user ? (
                    <Link
                      href={`/dashboard/users/${selectedItem.user.id}`}
                      className="group/header flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:hover:bg-zinc-800/35"
                      aria-label={`View ${selectedItem.title}'s profile`}
                    >
                      <ChatItemAvatar item={selectedItem} selected />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold leading-tight text-foreground transition-colors group-hover/header:text-primary dark:text-zinc-100">
                          {selectedItem.title}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-zinc-500">
                          {selectedItem.subtitle || "Direct conversation"}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ChatItemAvatar item={selectedItem} selected />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold leading-tight text-foreground dark:text-zinc-100">
                          {selectedItem.title}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-zinc-500">
                          {selectedItem.subtitle || "Direct conversation"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Chat options"
                        aria-label="Chat options"
                        className="h-8 w-8 rounded-full border border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted hover:text-foreground dark:text-zinc-400 dark:hover:border-zinc-700/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[90] w-48 rounded-2xl dark:border-zinc-800 dark:bg-zinc-900">
                      <DropdownMenuItem
                        className="dark:text-zinc-300 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
                        onClick={() => void handleRefreshSelected()}
                      >
                        Refresh chat
                      </DropdownMenuItem>
                      {selectedItem.hasConversation && !selectedItem.pinLocked ? (
                        <DropdownMenuItem
                          className="dark:text-zinc-300 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
                          onClick={() => handleTogglePin(selectedItem)}
                        >
                          {isPinned(selectedItem) ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" />
                              Unpin chat
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" />
                              Pin chat
                            </>
                          )}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        disabled={selectedItem.kind !== "direct" || !selectedConversationId || clearingConversationId === selectedConversationId}
                        onClick={() => void handleClearConversation()}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Eraser className="mr-2 h-4 w-4" />
                        Clear chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div
                ref={messagesViewportRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background [overflow-anchor:none] dark:bg-zinc-950"
              >
                <div ref={messagesContentRef} className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-5">
                  {!selectedConversationId ? (
                    <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-border/60 bg-muted/30 px-5 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                      <p className="text-sm font-medium text-foreground dark:text-zinc-300">No messages yet</p>
                      <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-500">
                        Send the first message to start this conversation.
                      </p>
                    </div>
                  ) : messageLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground dark:text-zinc-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading messages...
                    </div>
                  ) : selectedItem.kind === "group" ? (
                    selectedGroupMessages.length === 0 ? (
                      <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-border/60 bg-muted/30 px-5 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                        <p className="text-sm font-medium text-foreground dark:text-zinc-300">No team messages yet</p>
                        <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-500">
                          Start the conversation for your team here.
                        </p>
                      </div>
                    ) : (
                      selectedGroupMessages.map((message, index) => {
                        const isOwn = message.senderId === currentUser?.id
                        const previousMessage = selectedGroupMessages[index - 1]
                        const showTimestamp =
                          !previousMessage ||
                          new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 1000 * 60 * 20

                        return (
                          <div key={message.id}>
                            {showTimestamp ? (
                              <div className="mb-2 flex items-center justify-center">
                                <span className="rounded-full bg-muted px-3 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800/80 dark:text-zinc-500">
                                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            ) : null}

                            <div className={cn("flex min-w-0 gap-3", isOwn ? "justify-end" : "justify-start")}>
                              {!isOwn ? (
                                <Avatar className="mt-1 h-9 w-9 shrink-0 ring-1 ring-border/60">
                                  <AvatarImage src={message.sender.avatarUrl || "/placeholder-user.jpg"} />
                                  <AvatarFallback>{getUserInitial(message.sender)}</AvatarFallback>
                                </Avatar>
                              ) : null}

                              <div className={cn("flex min-w-0 max-w-[85%] flex-col sm:max-w-[72%] lg:max-w-[38rem]", isOwn && "items-end")}>
                                <div
                                  className={cn(
                                    "min-w-0 max-w-full rounded-2xl border px-4 py-3 shadow-sm transition-all duration-200",
                                    isOwn
                                      ? "rounded-br-sm border-transparent bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-primary/25 shadow-lg"
                                      : "rounded-bl-sm border-border/60 bg-card text-foreground dark:border-zinc-700/40 dark:bg-zinc-800/70 dark:text-zinc-100",
                                  )}
                                >
                                  {!isOwn ? (
                                    <div className="mb-2">
                                      <p className="text-xs font-semibold">{message.sender.fullName}</p>
                                      <p className="text-[11px] opacity-70">{roleToLabel(message.sender.role)}</p>
                                    </div>
                                  ) : null}
                                  <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere] [word-break:break-word]">
                                    {message.content}
                                  </p>
                                </div>

                                <div
                                  className={cn(
                                    "mt-1 flex items-center gap-1.5 text-[10px]",
                                    isOwn ? "justify-end text-muted-foreground dark:text-zinc-500" : "justify-start text-muted-foreground dark:text-zinc-600",
                                  )}
                                >
                                <span>
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isEditedMessage(message) ? <span>edited</span> : null}
                              </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )
                  ) : selectedDirectMessages.length === 0 ? (
                    <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-border/60 bg-muted/30 px-5 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                      <p className="text-sm font-medium text-foreground dark:text-zinc-300">
                        {selectedItem.kind === "contact" ? "No messages yet" : "This chat is empty"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-500">
                        {selectedItem.kind === "contact"
                          ? "Send the first message to start this conversation."
                          : "Cleared chats stay available - any new message will appear here instantly."}
                      </p>
                    </div>
                  ) : (
                    selectedDirectMessages.map((message, index) => {
                      const isOwn = message.senderId === currentUser?.id
                      const previousMessage = selectedDirectMessages[index - 1]
                      const showTimestamp =
                        !previousMessage ||
                        new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 1000 * 60 * 20

                      return (
                        <div key={message.id}>
                          {showTimestamp ? (
                            <div className="mb-2 flex items-center justify-center">
                              <span className="rounded-full bg-muted px-3 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800/80 dark:text-zinc-500">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          ) : null}

                          <div className={cn("group flex min-w-0 animate-in slide-in-from-bottom-1 duration-200 ease-out", isOwn ? "justify-end" : "justify-start")}>
                            <div className={cn("flex min-w-0 max-w-[85%] flex-col sm:max-w-[72%] lg:max-w-[38rem]", isOwn && "items-end")}>
                              <div
                                className={cn(
                                  "min-w-0 max-w-full rounded-2xl border px-4 py-3 shadow-sm transition-all duration-200",
                                  isOwn
                                    ? "rounded-br-sm border-transparent bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-primary/25 shadow-lg"
                                    : "rounded-bl-sm border-border/60 bg-card text-foreground dark:border-zinc-700/40 dark:bg-zinc-800/70 dark:text-zinc-100",
                                  message.isDeleted && "border-dashed border-border/60 bg-muted/40 text-muted-foreground shadow-none dark:border-zinc-700/50 dark:bg-zinc-800/30 dark:text-zinc-500",
                                )}
                              >
                                <div className="flex min-w-0 max-w-full items-start gap-2">
                                  <div className="flex min-w-0 max-w-full flex-1 flex-col gap-2">
                                    {message.fileUrl && !message.isDeleted ? (
                                      <div className="mt-1 min-w-0 max-w-full">
                                        {message.fileType?.startsWith("image/") ? (
                                          <a
                                            href={message.fileUrl.startsWith("http") ? message.fileUrl : `http://localhost:4000${message.fileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block max-w-full overflow-hidden rounded-xl"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={message.fileUrl.startsWith("http") ? message.fileUrl : `http://localhost:4000${message.fileUrl}`}
                                              alt={message.fileName || "Image"}
                                              className="h-auto max-h-64 max-w-full rounded-xl bg-background/50 object-contain"
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            href={message.fileUrl.startsWith("http") ? message.fileUrl : `http://localhost:4000${message.fileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn(
                                              "flex min-w-0 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                                              isOwn
                                                ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                                                : "border-border/60 bg-background/50 text-foreground hover:bg-background/80",
                                            )}
                                          >
                                            <FileIcon className="h-4 w-4 shrink-0" />
                                            <span className="min-w-0 flex-1 truncate font-medium">{message.fileName}</span>
                                            {message.fileSize ? (
                                              <span className="shrink-0 text-xs opacity-70">
                                                {Math.round(message.fileSize / 1024)}KB
                                              </span>
                                            ) : null}
                                          </a>
                                        )}
                                      </div>
                                    ) : null}
                                    {message.content || message.isDeleted ? (
                                      <p
                                        className={cn(
                                          "whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere] [word-break:break-word]",
                                          message.isDeleted && "italic",
                                        )}
                                      >
                                        {message.isDeleted ? "This message was deleted." : message.content}
                                      </p>
                                    ) : null}
                                  </div>

                                  {isOwn && !message.isDeleted ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          title="Message options"
                                          aria-label="Message options"
                                          className={cn(
                                            "h-7 w-7 shrink-0 rounded-full text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground focus-visible:bg-white/10",
                                            deletingMessageId === message.id && "text-primary-foreground",
                                          )}
                                        >
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="z-[90] rounded-2xl dark:border-zinc-800 dark:bg-zinc-900">
                                        <DropdownMenuItem
                                          className="dark:text-zinc-300 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
                                          disabled={deletingMessageId === message.id || sending}
                                          onClick={() => handleStartEditMessage(message)}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                          disabled={deletingMessageId === message.id}
                                          onClick={() => void handleDeleteMessage(message.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete message
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                className={cn(
                                  "mt-1 flex items-center gap-1.5 text-[10px]",
                                  isOwn ? "justify-end text-muted-foreground dark:text-zinc-500" : "justify-start text-muted-foreground dark:text-zinc-600",
                                )}
                              >
                                <span>
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isEditedMessage(message) ? <span>edited</span> : null}
                                {isOwn ? <MessageStatusIcon message={message} /> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-border/70 bg-card/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
                {!connected && selectedItem.kind !== "group" ? (
                  <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    Live sync is reconnecting - messages fall back to the API.
                  </div>
                ) : null}

                {selectedItem.kind !== "group" ? (
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return

                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("File is too large. Maximum size is 10MB.")
                        return
                      }

                      setFileAttachment(file)
                    }}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
                  />
                ) : null}

                {fileAttachment && selectedItem.kind !== "group" ? (
                  <div className="mb-2.5 flex w-full max-w-full items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 sm:w-fit dark:border-zinc-700/50 dark:bg-zinc-800/60">
                    {fileAttachment.type.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground dark:text-zinc-400" />
                    ) : (
                      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground dark:text-zinc-400" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:max-w-72 dark:text-zinc-300">
                      {fileAttachment.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground dark:text-zinc-500">
                      {Math.round(fileAttachment.size / 1024)}KB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-1 h-5 w-5 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive dark:text-zinc-500"
                      onClick={() => {
                        setFileAttachment(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}

                {editingMessage ? (
                  <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary dark:border-primary/30 dark:bg-primary/15">
                    <span className="min-w-0 truncate font-medium">Editing message</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                      onClick={handleCancelEditMessage}
                      disabled={sending}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  {selectedItem.kind !== "group" && !editingMessage ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  ) : null}

                  <Textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        void handleSend()
                      }
                    }}
                    placeholder={
                      editingMessage
                        ? "Edit message..."
                        : selectedItem.kind === "group"
                        ? `Message ${selectedItem.team?.name ?? "your team"}...`
                        : `Message ${selectedItem.title}...`
                    }
                    className="max-h-32 min-h-[42px] resize-none overflow-y-auto rounded-2xl border-border/60 bg-muted/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/40 dark:border-zinc-700/50 dark:bg-zinc-800/60 dark:text-zinc-200 dark:placeholder:text-zinc-600"
                    rows={1}
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={
                      sending ||
                      (editingMessage
                        ? !draft.trim() || draft.trim() === editingMessage.content
                        : !draft.trim() && !fileAttachment)
                    }
                    className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/85 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                    size="icon"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-10">
              <div className="max-w-xs text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground dark:text-zinc-200">Pick a conversation</h3>
                <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-500">
                  Choose a chat from the left to start messaging.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-border/70 p-0 dark:border-zinc-800 dark:bg-zinc-950">
          <DialogHeader className="border-b border-border/70 px-5 py-4 text-left dark:border-zinc-800">
            <DialogTitle className="text-base">
              {membersDialogTeam?.name ?? selectedItem?.team?.name ?? "Team chat"} members
            </DialogTitle>
            <DialogDescription>
              {membersDialogTeam
                ? `${membersDialogTeam.memberCount} member${membersDialogTeam.memberCount === 1 ? "" : "s"} in this chat`
                : "People who can participate in this team chat."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
            {membersDialogLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading members...
              </div>
            ) : membersDialogError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {membersDialogError}
              </div>
            ) : membersDialogTeam ? (
              <div className="space-y-2">
                {membersDialogTeam.members.map((member) => {
                  const isLeader = member.teamRole === "LEADER"

                  return (
                    <Link
                      key={member.id}
                      href={`/dashboard/users/${member.user.id}`}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 px-3 py-3 transition-colors hover:border-primary/25 hover:bg-primary/[0.04] dark:border-zinc-800 dark:hover:border-primary/30 dark:hover:bg-zinc-900"
                      onClick={() => setMembersDialogOpen(false)}
                    >
                      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/60 dark:ring-zinc-700/60">
                        <AvatarImage src={member.user.avatarUrl || "/placeholder-user.jpg"} />
                        <AvatarFallback>{getUserInitial(member.user)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground dark:text-zinc-100">
                            {member.user.fullName}
                          </p>
                          {isLeader ? (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Leader
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground dark:text-zinc-500">
                          {isLeader ? "Team leader" : roleToLabel(member.user.role)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No members to show yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChatListSection({
  title,
  items,
  selectedItemKey,
  onSelect,
  onTogglePin,
  isPinned,
}: {
  title: string
  items: ChatListItem[]
  selectedItemKey: string | null
  onSelect: (item: ChatListItem) => void
  onTogglePin: (item: ChatListItem) => void
  isPinned: (item: ChatListItem) => boolean
}) {
  return (
    <section className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60 dark:text-zinc-600">
          {title}
        </h3>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-500">
          {items.length}
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const pinned = isPinned(item)

          return (
            <div
              key={item.key}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-lg",
                selectedItemKey === item.key ? "bg-muted dark:bg-zinc-800/80" : "hover:bg-muted/60 dark:hover:bg-zinc-800/50",
              )}
            >
              {selectedItemKey === item.key ? (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              ) : null}

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_4rem] items-stretch">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex min-w-0 items-center gap-3 px-3 py-2.5 text-left"
                >
                  <div className="relative shrink-0">
                    <ChatItemAvatar item={item} />
                    {item.unreadCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary dark:border-zinc-950" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {pinned ? <Pin className="h-3 w-3 shrink-0 text-primary" /> : null}
                      <p
                        className={cn(
                          "min-w-0 truncate text-sm leading-tight",
                          item.unreadCount > 0
                            ? "font-semibold text-foreground dark:text-zinc-100"
                            : "font-medium text-foreground/85 dark:text-zinc-200",
                          selectedItemKey === item.key && "text-foreground dark:text-zinc-50",
                        )}
                      >
                        {item.title}
                      </p>
                    </div>

                    {item.subtitle ? (
                      <p className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground dark:text-zinc-500">
                        {item.subtitle}
                      </p>
                    ) : null}

                    <p className="mt-1.5 min-w-0 truncate text-xs text-muted-foreground dark:text-zinc-500">
                      {item.preview}
                    </p>
                  </div>
                </button>

                <div className="flex min-w-0 flex-col items-end justify-between gap-1 py-2.5 pr-2 text-right">
                  {item.lastActivityAt ? (
                    <span className="max-w-full whitespace-nowrap text-[10px] leading-none text-muted-foreground/70 dark:text-zinc-600">
                      {formatSidebarTime(item.lastActivityAt)}
                    </span>
                  ) : (
                    <span className="h-3" />
                  )}

                  {item.hasConversation ? (
                    <div className="flex min-h-7 items-center justify-end gap-1">
                      {item.unreadCount > 0 ? (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {item.unreadCount > 99 ? "99+" : item.unreadCount}
                        </span>
                      ) : null}

                      {item.pinLocked ? (
                        <span title="Pinned team chat" className="flex h-7 w-7 items-center justify-center rounded-full text-primary">
                          <Pin className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={pinned ? "Unpin chat" : "Pin chat"}
                          className={cn(
                            "h-7 w-7 rounded-full text-muted-foreground opacity-100 transition-opacity hover:bg-background/80 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:hover:bg-zinc-900/80",
                            pinned && "opacity-100 text-primary",
                          )}
                          onClick={() => onTogglePin(item)}
                        >
                          {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
