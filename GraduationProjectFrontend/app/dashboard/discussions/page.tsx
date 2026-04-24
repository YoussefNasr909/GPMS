"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  CornerDownRight,
  Eye,
  MessageCircle,
  MessageSquare,
  Pin,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldAlert,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  createDiscussion,
  createDiscussionComment,
  deleteDiscussion as deleteDiscussionRequest,
  deleteDiscussionComment as deleteDiscussionCommentRequest,
  getDiscussionDetail,
  likeDiscussion,
  listDiscussions,
} from "@/lib/api/discussions"
import type {
  ApiDiscussionCategory,
  ApiDiscussionComment,
  ApiDiscussionDetail,
  ApiDiscussionFeed,
  ApiDiscussionSummary,
} from "@/lib/api/types"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"

const filterOptions: Array<{ value: "all" | ApiDiscussionCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "technical", label: "Technical" },
  { value: "team", label: "Team" },
  { value: "resources", label: "Resources" },
  { value: "general", label: "General" },
]

const createOptions: Array<{ value: ApiDiscussionCategory; label: string }> = [
  { value: "technical", label: "Technical" },
  { value: "team", label: "Team" },
  { value: "resources", label: "Resources" },
  { value: "general", label: "General" },
]

const emptyCreateForm = {
  title: "",
  category: "technical" as ApiDiscussionCategory,
  content: "",
  tags: "",
}

const defaultDiscussionPagination = {
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U"
}

function parseTags(rawValue: string) {
  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12)
}

function formatCategory(category: ApiDiscussionCategory) {
  return createOptions.find((option) => option.value === category)?.label ?? "General"
}

function buildDiscussionPageItems(totalPages: number, currentPage: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [1]
  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(totalPages - 1, currentPage + 1)

  if (windowStart > 2) {
    items.push("ellipsis-left")
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page)
  }

  if (windowEnd < totalPages - 1) {
    items.push("ellipsis-right")
  }

  items.push(totalPages)
  return items
}

function toSummary(discussion: ApiDiscussionDetail): ApiDiscussionSummary {
  return {
    id: discussion.id,
    title: discussion.title,
    content: discussion.content,
    category: discussion.category,
    tags: discussion.tags,
    likeCount: discussion.likeCount,
    viewCount: discussion.viewCount,
    commentCount: discussion.commentCount,
    isPinned: discussion.isPinned,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
    author: discussion.author,
    viewerHasLiked: discussion.viewerHasLiked,
    viewerHasViewed: discussion.viewerHasViewed,
  }
}

function insertCommentIntoTree(
  comments: ApiDiscussionComment[],
  nextComment: ApiDiscussionComment,
): [ApiDiscussionComment[], boolean] {
  if (!nextComment.parentCommentId) {
    return [[...comments, nextComment], true]
  }

  let inserted = false

  const nextComments = comments.map((comment) => {
    if (comment.id === nextComment.parentCommentId) {
      inserted = true
      return {
        ...comment,
        replyCount: comment.replyCount + 1,
        replies: [...comment.replies, nextComment],
      }
    }

    const [nextReplies, replyInserted] = insertCommentIntoTree(comment.replies, nextComment)
    if (!replyInserted) {
      return comment
    }

    inserted = true
    return {
      ...comment,
      replyCount: comment.replyCount + 1,
      replies: nextReplies,
    }
  })

  return [inserted ? nextComments : comments, inserted]
}

function appendCommentToTree(comments: ApiDiscussionComment[], nextComment: ApiDiscussionComment) {
  const [nextComments, inserted] = insertCommentIntoTree(comments, nextComment)
  return inserted ? nextComments : [...comments, nextComment]
}

function findCommentById(comments: ApiDiscussionComment[], commentId: string | null): ApiDiscussionComment | null {
  if (!commentId) return null

  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment
    }

    const nestedComment = findCommentById(comment.replies, commentId)
    if (nestedComment) {
      return nestedComment
    }
  }

  return null
}

function upsertDiscussion(items: ApiDiscussionSummary[], nextDiscussion: ApiDiscussionSummary) {
  const hasExisting = items.some((item) => item.id === nextDiscussion.id)

  if (!hasExisting) {
    return [nextDiscussion, ...items].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  return items
    .map((item) => (item.id === nextDiscussion.id ? nextDiscussion : item))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export default function DiscussionsPage() {
  const { currentUser, accessToken, hasHydrated } = useAuthStore()
  const { toast } = useToast()

  const [feed, setFeed] = useState<ApiDiscussionFeed | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | ApiDiscussionCategory>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [isCreating, setIsCreating] = useState(false)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedDiscussion, setSelectedDiscussion] = useState<ApiDiscussionDetail | null>(null)
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [commentContent, setCommentContent] = useState("")
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [likePendingIds, setLikePendingIds] = useState<string[]>([])
  const [deleteDiscussionPendingIds, setDeleteDiscussionPendingIds] = useState<string[]>([])
  const [deleteCommentPendingIds, setDeleteCommentPendingIds] = useState<string[]>([])
  const hasLoadedFeedRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (!accessToken || currentUser?.role === "admin") {
      hasLoadedFeedRef.current = false
      setIsLoading(false)
      setFeed(null)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    async function loadFeed() {
      if (hasLoadedFeedRef.current) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setErrorMessage(null)

      try {
        const nextFeed = await listDiscussions(
          {
            search: debouncedSearch,
            category: categoryFilter,
            page: currentPage,
          },
          controller.signal,
        )

        if (cancelled) {
          return
        }

        setFeed(nextFeed)
      } catch (error) {
        if (cancelled || controller.signal.aborted) {
          return
        }

        const message = error instanceof Error ? error.message : "Failed to load discussions."
        setErrorMessage(message)
      } finally {
        if (!cancelled) {
          hasLoadedFeedRef.current = true
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    loadFeed()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [accessToken, categoryFilter, currentPage, currentUser?.role, debouncedSearch, hasHydrated, refreshSeed])

  const selectedDiscussionSummary = useMemo(() => {
    if (!selectedDiscussionId) return null
    return feed?.items.find((item) => item.id === selectedDiscussionId) ?? null
  }, [feed?.items, selectedDiscussionId])

  const selectedReplyTarget = useMemo(() => {
    if (!selectedDiscussion) return null
    return findCommentById(selectedDiscussion.comments, replyTargetId)
  }, [replyTargetId, selectedDiscussion])

  const feedMeta = feed?.meta ?? defaultDiscussionPagination

  const paginationItems = useMemo(() => {
    return buildDiscussionPageItems(feedMeta.totalPages, feedMeta.page)
  }, [feedMeta.page, feedMeta.totalPages])

  function mergeDiscussion(nextDiscussion: ApiDiscussionSummary | ApiDiscussionDetail) {
    setFeed((currentFeed) => {
      if (!currentFeed) return currentFeed

      return {
        ...currentFeed,
        items: upsertDiscussion(currentFeed.items, "comments" in nextDiscussion ? toSummary(nextDiscussion) : nextDiscussion),
      }
    })

    if ("comments" in nextDiscussion) {
      setSelectedDiscussion(nextDiscussion)
    } else {
      setSelectedDiscussion((currentDiscussion) => {
        if (!currentDiscussion || currentDiscussion.id !== nextDiscussion.id) {
          return currentDiscussion
        }

        return {
          ...currentDiscussion,
          ...nextDiscussion,
        }
      })
    }
  }

  async function openDiscussion(discussionId: string) {
    setIsDetailOpen(true)
    setSelectedDiscussionId(discussionId)
    setSelectedDiscussion((currentDiscussion) => (currentDiscussion?.id === discussionId ? currentDiscussion : null))
    setDetailError(null)
    setReplyTargetId(null)
    setCommentContent("")
    setIsDetailLoading(true)

    try {
      const detail = await getDiscussionDetail(discussionId)
      mergeDiscussion(detail)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load this discussion."
      setDetailError(message)
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function refreshDiscussionDetail(discussionId: string) {
    const detail = await getDiscussionDetail(discussionId)
    mergeDiscussion(detail)
    return detail
  }

  async function handleCreateDiscussion() {
    const title = createForm.title.trim()
    const content = createForm.content.trim()
    const tags = parseTags(createForm.tags)

    if (!title || !content) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Add a title and content before creating the discussion.",
      })
      return
    }

    setIsCreating(true)

    try {
      await createDiscussion({
        title,
        category: createForm.category,
        content,
        tags,
      })

      setIsCreateOpen(false)
      setCreateForm(emptyCreateForm)
      setCurrentPage(1)
      setRefreshSeed((currentValue) => currentValue + 1)

      toast({
        title: "Discussion created",
        description: "Your discussion is now visible to students, leaders, doctors, and TAs.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not create discussion",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCommentSubmit() {
    const activeDiscussion = selectedDiscussion
    const content = commentContent.trim()
    const parentCommentId = replyTargetId

    if (!activeDiscussion || !content) {
      return
    }

    setIsSubmittingComment(true)

    try {
      const createdComment = await createDiscussionComment(activeDiscussion.id, content, parentCommentId)

      setSelectedDiscussion((currentDiscussion) => {
        if (!currentDiscussion || currentDiscussion.id !== activeDiscussion.id) {
          return currentDiscussion
        }

        return {
          ...currentDiscussion,
          commentCount: currentDiscussion.commentCount + 1,
          comments: appendCommentToTree(currentDiscussion.comments, createdComment),
        }
      })

      setFeed((currentFeed) => {
        if (!currentFeed) return currentFeed

        return {
          ...currentFeed,
          items: currentFeed.items.map((item) =>
            item.id === activeDiscussion.id ? { ...item, commentCount: item.commentCount + 1 } : item,
          ),
          stats: {
            ...currentFeed.stats,
            replies: currentFeed.stats.replies + 1,
          },
        }
      })

      setCommentContent("")
      setReplyTargetId(null)
      toast({
        title: parentCommentId ? "Reply added" : "Comment added",
        description: parentCommentId
          ? "Your reply was posted under the selected comment."
          : "Your reply was posted successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not post comment",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  async function handleLikeDiscussion(discussionId: string) {
    const activeSummary =
      selectedDiscussion?.id === discussionId ? selectedDiscussion : feed?.items.find((item) => item.id === discussionId)

    if (!activeSummary || likePendingIds.includes(discussionId)) {
      return
    }

    setLikePendingIds((currentIds) => [...currentIds, discussionId])

    try {
      const updatedDiscussion = await likeDiscussion(discussionId)
      mergeDiscussion(updatedDiscussion)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not register like",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setLikePendingIds((currentIds) => currentIds.filter((id) => id !== discussionId))
    }
  }

  async function handleDeleteDiscussion(discussionId: string) {
    if (deleteDiscussionPendingIds.includes(discussionId)) {
      return
    }

    const shouldStepBackPage = feedMeta.page > 1 && (feed?.items.length ?? 0) === 1

    setDeleteDiscussionPendingIds((currentIds) => [...currentIds, discussionId])

    try {
      await deleteDiscussionRequest(discussionId)

      if (selectedDiscussion?.id === discussionId || selectedDiscussionId === discussionId) {
        setIsDetailOpen(false)
        setSelectedDiscussion(null)
        setSelectedDiscussionId(null)
        setCommentContent("")
        setReplyTargetId(null)
        setDetailError(null)
      }

      if (shouldStepBackPage) {
        setCurrentPage((page) => Math.max(1, page - 1))
      } else {
        setRefreshSeed((value) => value + 1)
      }

      toast({
        title: "Discussion deleted",
        description: "Your discussion was removed successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not delete discussion",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setDeleteDiscussionPendingIds((currentIds) => currentIds.filter((id) => id !== discussionId))
    }
  }

  async function handleDeleteComment(comment: ApiDiscussionComment) {
    const activeDiscussion = selectedDiscussion

    if (!activeDiscussion || deleteCommentPendingIds.includes(comment.id)) {
      return
    }

    setDeleteCommentPendingIds((currentIds) => [...currentIds, comment.id])

    try {
      await deleteDiscussionCommentRequest(activeDiscussion.id, comment.id)
      await refreshDiscussionDetail(activeDiscussion.id)
      setRefreshSeed((value) => value + 1)

      if (replyTargetId === comment.id) {
        setReplyTargetId(null)
      }

      toast({
        title: "Comment deleted",
        description: "Your comment was removed successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not delete comment",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setDeleteCommentPendingIds((currentIds) => currentIds.filter((id) => id !== comment.id))
    }
  }

  function renderCommentThread(comment: ApiDiscussionComment, depth = 0) {
    const isOwnComment = comment.author.id === currentUser?.id
    const isDeletingComment = deleteCommentPendingIds.includes(comment.id)

    return (
      <div key={comment.id} className={cn("space-y-3", depth > 0 && "ml-4 border-l border-border/60 pl-4 sm:ml-6 sm:pl-5")}>
        <div
          className={cn(
            "rounded-[24px] border p-4 shadow-sm transition-colors",
            isOwnComment ? "border-primary/25 bg-primary/[0.045]" : "border-border/70 bg-background/90",
          )}
        >
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={comment.author.avatarUrl ?? undefined} alt={comment.author.fullName} />
              <AvatarFallback>{getInitials(comment.author.fullName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{comment.author.fullName}</span>
                <span>|</span>
                <span>{comment.author.roleLabel}</span>
                <span>|</span>
                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                {isOwnComment ? (
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10">
                    You
                  </Badge>
                ) : null}
                {comment.replyCount ? (
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                    {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                  </Badge>
                ) : null}
              </div>

              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-7 text-foreground">
                {comment.content}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={replyTargetId === comment.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 gap-2 rounded-full px-3 text-xs"
                  onClick={() => setReplyTargetId(comment.id)}
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </Button>
                {isOwnComment ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 rounded-full px-3 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDeleteComment(comment)}
                    disabled={isDeletingComment}
                  >
                    {isDeletingComment ? <Spinner className="size-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {comment.replies.length ? (
          <div className="space-y-3">
            {comment.replies.map((reply) => renderCommentThread(reply, depth + 1))}
          </div>
        ) : null}
      </div>
    )
  }

  const trimmedCommentContent = commentContent.trim()
  const commentCharacterCount = commentContent.length
  const canSubmitComment = Boolean(selectedDiscussion) && Boolean(trimmedCommentContent) && !isSubmittingComment

  function handleCommentComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault()

      if (canSubmitComment) {
        void handleCommentSubmit()
      }
    }
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>Loading discussions...</span>
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>You need to sign in before you can view discussions.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (currentUser?.role === "admin") {
    return (
      <div className="p-6">
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Discussions are not available for admins</AlertTitle>
          <AlertDescription>
            This page is only for student members, student leaders, doctors, and TAs.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Discussions</h1>
              <p className="text-sm text-muted-foreground">Connect with peers and supervisors in one shared space.</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Start a New Discussion</DialogTitle>
                <DialogDescription>Provide a title, category, content, and tags for your discussion.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="discussion-title">Title</Label>
                  <Input
                    id="discussion-title"
                    value={createForm.title}
                    placeholder="What would you like to discuss?"
                    onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discussion-category">Category</Label>
                  <Select
                    value={createForm.category}
                    onValueChange={(value: ApiDiscussionCategory) =>
                      setCreateForm((current) => ({ ...current, category: value }))
                    }
                  >
                    <SelectTrigger id="discussion-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {createOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discussion-content">Content</Label>
                  <Textarea
                    id="discussion-content"
                    rows={7}
                    value={createForm.content}
                    placeholder="Describe your question or topic..."
                    onChange={(event) => setCreateForm((current) => ({ ...current, content: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discussion-tags">Tags (comma separated)</Label>
                  <Input
                    id="discussion-tags"
                    value={createForm.tags}
                    placeholder="e.g. React, Performance, Design"
                    onChange={(event) => setCreateForm((current) => ({ ...current, tags: event.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDiscussion} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Spinner className="size-4" />
                        Creating...
                      </>
                    ) : (
                      "Create Discussion"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="text-sm text-muted-foreground">Total Discussions</p>
              <p className="text-3xl font-semibold">{feed?.stats.totalDiscussions ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="text-sm text-muted-foreground">Active Today</p>
              <p className="text-3xl font-semibold text-primary">{feed?.stats.activeToday ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="text-sm text-muted-foreground">Your Posts</p>
              <p className="text-3xl font-semibold">{feed?.stats.yourPosts ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-6">
              <p className="text-sm text-muted-foreground">Replies</p>
              <p className="text-3xl font-semibold">{feed?.stats.replies ?? 0}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search discussions..."
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={categoryFilter === option.value ? "default" : "outline"}
                  onClick={() => {
                    setCategoryFilter(option.value)
                    setCurrentPage(1)
                  }}
                >
                  {option.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setRefreshSeed((value) => value + 1)} disabled={isRefreshing}>
                {isRefreshing ? <Spinner className="size-4" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Could not load discussions</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </motion.div>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              <span>Loading discussions...</span>
            </div>
          </div>
        ) : feed?.items.length ? (
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="space-y-4"
            >
              {feed.items.map((discussion) => {
                const isLikePending = likePendingIds.includes(discussion.id)
                const isDeletingDiscussion = deleteDiscussionPendingIds.includes(discussion.id)
                const canDeleteDiscussion = discussion.author.id === currentUser?.id

                return (
                  <Card
                    key={discussion.id}
                    className="group overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarImage src={discussion.author.avatarUrl ?? undefined} alt={discussion.author.fullName} />
                          <AvatarFallback>{getInitials(discussion.author.fullName)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {discussion.isPinned ? <Pin className="h-4 w-4 text-amber-500" /> : null}
                                <h2 className="text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                                  {discussion.title}
                                </h2>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{formatCategory(discussion.category)}</Badge>
                                <span>{discussion.author.fullName}</span>
                                <span>|</span>
                                <span>{discussion.author.roleLabel}</span>
                                <span>|</span>
                                <span>{formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => openDiscussion(discussion.id)}>
                                Open Discussion
                              </Button>
                              {canDeleteDiscussion ? (
                                <Button
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteDiscussion(discussion.id)}
                                  disabled={isDeletingDiscussion}
                                >
                                  {isDeletingDiscussion ? <Spinner className="size-4" /> : <Trash2 className="h-4 w-4" />}
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          <p className="line-clamp-3 break-words [overflow-wrap:anywhere] text-sm leading-6 text-muted-foreground">
                            {discussion.content}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" className="gap-2 px-0" onClick={() => openDiscussion(discussion.id)}>
                              <MessageCircle className="h-4 w-4" />
                              {discussion.commentCount}
                            </Button>
                            <span className="inline-flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              {discussion.viewCount}
                            </span>
                            <Button
                              variant={discussion.viewerHasLiked ? "secondary" : "ghost"}
                              size="sm"
                              className="gap-2 px-2"
                              onClick={() => handleLikeDiscussion(discussion.id)}
                              disabled={isLikePending}
                            >
                              {isLikePending ? <Spinner className="size-4" /> : <ThumbsUp className="h-4 w-4" />}
                              {discussion.likeCount}
                              {discussion.viewerHasLiked ? "Unlike" : "Like"}
                            </Button>
                          </div>

                          {discussion.tags.length ? (
                            <div className="flex flex-wrap gap-2">
                              {discussion.tags.map((tag) => (
                                <Badge key={`${discussion.id}-${tag}`} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </motion.div>

            {feedMeta.totalPages > 1 ? (
              <Card className="border-border/70 bg-card/90">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(feedMeta.page - 1) * feedMeta.limit + 1}-
                    {Math.min(feedMeta.page * feedMeta.limit, feedMeta.total)} of {feedMeta.total} discussions
                  </div>

                  <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          className={cn(!feedMeta.hasPreviousPage && "pointer-events-none opacity-50")}
                          onClick={(event) => {
                            event.preventDefault()
                            if (!feedMeta.hasPreviousPage) return
                            setCurrentPage(feedMeta.page - 1)
                          }}
                        />
                      </PaginationItem>

                      {paginationItems.map((item, index) => (
                        <PaginationItem key={`${item}-${index}`}>
                          {typeof item === "number" ? (
                            <PaginationLink
                              href="#"
                              isActive={item === feedMeta.page}
                              onClick={(event) => {
                                event.preventDefault()
                                if (item === feedMeta.page) return
                                setCurrentPage(item)
                              }}
                            >
                              {item}
                            </PaginationLink>
                          ) : (
                            <PaginationEllipsis />
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          className={cn(!feedMeta.hasNextPage && "pointer-events-none opacity-50")}
                          onClick={(event) => {
                            event.preventDefault()
                            if (!feedMeta.hasNextPage) return
                            setCurrentPage(feedMeta.page + 1)
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : (
          <Card>
            <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-3 pt-6 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">No discussions found</h2>
                <p className="text-sm text-muted-foreground">
                  Try changing the search or filters, or start a new discussion.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) {
            setDetailError(null)
            setCommentContent("")
            setReplyTargetId(null)
          }
        }}
      >
        <DialogContent className="h-[min(92vh,860px)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border/70 bg-gradient-to-r from-primary/12 via-background to-background px-6 py-5 pr-14">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="break-words pr-6 text-xl [overflow-wrap:anywhere]">
                  {selectedDiscussion?.title ?? selectedDiscussionSummary?.title ?? "Discussion details"}
                </DialogTitle>
                <DialogDescription className="max-w-2xl">
                  Follow the thread on the left and keep your reply ready on the right. The reply box stays visible so
                  you can comment without fighting the modal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex min-h-[320px] items-center justify-center p-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                <span>Loading discussion...</span>
              </div>
            </div>
          ) : detailError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could not load this discussion</AlertTitle>
                <AlertDescription>{detailError}</AlertDescription>
              </Alert>
            </div>
          ) : selectedDiscussion ? (
            <div className="flex min-h-0 flex-col lg:flex-row">
              <ScrollArea className="min-h-[280px] flex-1">
                <div className="space-y-6 p-6">
                  <div className="overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-background via-background to-primary/[0.05] shadow-sm">
                    <div className="space-y-5 p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <Avatar className="h-12 w-12 shrink-0 ring-4 ring-primary/10">
                          <AvatarImage
                            src={selectedDiscussion.author.avatarUrl ?? undefined}
                            alt={selectedDiscussion.author.fullName}
                          />
                          <AvatarFallback>{getInitials(selectedDiscussion.author.fullName)}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{selectedDiscussion.author.fullName}</span>
                            <span>|</span>
                            <span>{selectedDiscussion.author.roleLabel}</span>
                            <span>|</span>
                            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-3 py-1">
                              {formatCategory(selectedDiscussion.category)}
                            </Badge>
                            <span>|</span>
                            <span>{formatDistanceToNow(new Date(selectedDiscussion.createdAt), { addSuffix: true })}</span>
                          </div>

                          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[15px] leading-7 text-foreground">
                            {selectedDiscussion.content}
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-4 py-2 text-sm text-muted-foreground">
                              <MessageCircle className="h-4 w-4 text-foreground" />
                              <span className="font-medium text-foreground">{selectedDiscussion.commentCount}</span>
                              <span>Replies</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-4 py-2 text-sm text-muted-foreground">
                              <Eye className="h-4 w-4 text-foreground" />
                              <span className="font-medium text-foreground">{selectedDiscussion.viewCount}</span>
                              <span>Views</span>
                            </div>
                      <Button
                        variant={selectedDiscussion.viewerHasLiked ? "secondary" : "outline"}
                        className="rounded-full px-4"
                        onClick={() => handleLikeDiscussion(selectedDiscussion.id)}
                        disabled={likePendingIds.includes(selectedDiscussion.id)}
                      >
                        {likePendingIds.includes(selectedDiscussion.id) ? (
                          <Spinner className="size-4" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                        <span className="font-medium">{selectedDiscussion.likeCount}</span>
                        {selectedDiscussion.viewerHasLiked ? "Unlike" : "Like"}
                      </Button>
                      {selectedDiscussion.author.id === currentUser?.id ? (
                        <Button
                          variant="ghost"
                          className="rounded-full px-4 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDiscussion(selectedDiscussion.id)}
                          disabled={deleteDiscussionPendingIds.includes(selectedDiscussion.id)}
                        >
                          {deleteDiscussionPendingIds.includes(selectedDiscussion.id) ? (
                            <Spinner className="size-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      ) : null}
                          </div>

                          {selectedDiscussion.tags.length ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedDiscussion.tags.map((tag) => (
                                <Badge
                                  key={`${selectedDiscussion.id}-detail-${tag}`}
                                  variant="secondary"
                                  className="rounded-full px-3 py-1"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Comments
                        </h3>
                        <p className="text-sm text-muted-foreground">Recent replies from teammates and supervisors.</p>
                      </div>
                      <Badge variant="outline" className="rounded-full px-3 py-1.5">
                        {selectedDiscussion.commentCount} replies
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {selectedDiscussion.comments.length ? (
                        selectedDiscussion.comments.map((comment) => renderCommentThread(comment))
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                          <h4 className="mt-3 text-base font-semibold">No comments yet</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Start the conversation with a clear reply or a useful suggestion.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-border/70 bg-muted/25 lg:w-[360px] lg:border-t-0 lg:border-l">
                <div className="border-b border-border/70 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">Write a reply</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ask, explain, or share the next step for the team.
                      </p>
                    </div>
                    {selectedReplyTarget ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={() => setReplyTargetId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                  <div className="rounded-[22px] border border-border/70 bg-background/85 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUser?.avatar} alt={currentUser?.name ?? "You"} />
                        <AvatarFallback>{getInitials(currentUser?.name ?? "You")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{currentUser?.name ?? "You"}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedReplyTarget ? `Replying to ${selectedReplyTarget.author.fullName}` : "Replying to this discussion"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedReplyTarget ? (
                    <div className="rounded-[22px] border border-primary/20 bg-primary/[0.05] p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{selectedReplyTarget.author.fullName}</span>
                            <span>|</span>
                            <span>{selectedReplyTarget.author.roleLabel}</span>
                          </div>
                          <p className="line-clamp-3 break-words [overflow-wrap:anywhere] text-sm leading-6 text-foreground">
                            {selectedReplyTarget.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col gap-3">
                    <Label htmlFor="discussion-comment" className="text-sm font-medium">
                      {selectedReplyTarget ? "Your reply" : "Your comment"}
                    </Label>
                    <Textarea
                      id="discussion-comment"
                      rows={7}
                      value={commentContent}
                      placeholder={
                        selectedReplyTarget
                          ? `Reply to ${selectedReplyTarget.author.fullName}...`
                          : "Share your reply with the discussion..."
                      }
                      className="min-h-[190px] flex-1 resize-none rounded-[24px] border-border/70 bg-background shadow-sm"
                      onChange={(event) => setCommentContent(event.target.value)}
                      onKeyDown={handleCommentComposerKeyDown}
                    />
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Press Ctrl+Enter to post quickly</span>
                      <span>{commentCharacterCount}/2000</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 border-t border-border/60 bg-muted/25 pt-3">
                    <div className="rounded-[22px] border border-dashed border-border/80 bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
                      Keep it specific and useful so students, doctors, and TAs can act on your reply quickly.
                    </div>

                    <Button className="h-11 w-full gap-2 rounded-xl" onClick={handleCommentSubmit} disabled={!canSubmitComment}>
                      {isSubmittingComment ? (
                        <>
                          <Spinner className="size-4" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {selectedReplyTarget ? "Post Reply" : "Post Comment"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-sm text-muted-foreground">
              Select a discussion to see its details.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
