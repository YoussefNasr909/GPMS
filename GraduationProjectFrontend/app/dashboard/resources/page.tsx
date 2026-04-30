"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  BookOpen,
  Code,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { createResource, deleteResource, getResources } from "@/lib/api/resources"
import { ApiResource, ApiResourceCategory, ApiResourceType } from "@/lib/api/types"
import { toast } from "sonner"

const RESOURCE_FILE_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
const parseMaxUploadSizeInBytes = (value: string | undefined) => {
  const normalized = String(value ?? "").trim()
  if (!normalized) return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return Math.floor(parsed * 1024 * 1024)
}

const RESOURCE_FILE_MAX_SIZE = parseMaxUploadSizeInBytes(process.env.NEXT_PUBLIC_RESOURCE_MAX_SIZE_MB)
const allowedResourceExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "txt"])

const categories = [
  { value: "all", label: "All Resources", icon: BookOpen },
  { value: "documentation", label: "Documentation", icon: FileText },
  { value: "tutorial", label: "Tutorials", icon: Video },
  { value: "code", label: "Code Samples", icon: Code },
] satisfies Array<{ value: "all" | ApiResourceCategory; label: string; icon: typeof BookOpen }>

const resourceTypeOptions: Array<{ value: ApiResourceType; label: string }> = [
  { value: "file", label: "Uploaded File" },
  { value: "video", label: "Video Tutorial" },
  { value: "link", label: "External Link" },
  { value: "github", label: "GitHub Repository" },
]

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${Number.parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${units[index]}`
}

function getFileExtension(fileName?: string | null) {
  const normalized = String(fileName ?? "").trim().toLowerCase()
  if (!normalized.includes(".")) return ""
  return normalized.split(".").pop() ?? ""
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function getUploadLimitLabel(maxSizeBytes: number | null) {
  if (!maxSizeBytes) return "No size limit"
  return formatFileSize(maxSizeBytes)
}

function validateResourceFile(file: File | null) {
  if (!file) return "Please choose a file to upload."

  const extension = getFileExtension(file.name)
  if (!allowedResourceExtensions.has(extension)) {
    return "Allowed file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, and TXT."
  }

  if (RESOURCE_FILE_MAX_SIZE && file.size > RESOURCE_FILE_MAX_SIZE) {
    return `Max file size is ${getUploadLimitLabel(RESOURCE_FILE_MAX_SIZE)}.`
  }

  return null
}

export default function ResourcesPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const { data: myTeamState } = useMyTeamState()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<"all" | ApiResourceCategory>("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [resources, setResources] = useState<ApiResource[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isForbidden, setIsForbidden] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadForm, setUploadForm] = useState<{
    title: string
    description: string
    category: ApiResourceCategory
    type: ApiResourceType
    url: string
    tags: string
  }>({
    title: "",
    description: "",
    category: "documentation",
    type: "file",
    url: "",
    tags: "",
  })

  const canUpload = currentUser?.role === "doctor" || currentUser?.role === "ta"
  const isStudentRole = currentUser?.role === "member" || currentUser?.role === "leader"
  const missingSupervisor = Boolean(
    isStudentRole && myTeamState?.team && !myTeamState.team.doctor && !myTeamState.team.ta,
  )

  const refreshResources = async () => {
    const data = await getResources({ search: searchQuery, category: selectedCategory })
    setResources(data)
  }

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        setIsForbidden(false)
        await refreshResources()
      } catch (error: unknown) {
        console.error("Failed to fetch resources:", error)
        if ((error as { code?: string; status?: number } | undefined)?.code === "RESOURCES_VIEW_FORBIDDEN" || (error as { status?: number } | undefined)?.status === 403) {
          setIsForbidden(true)
        } else {
          toast.error(error instanceof Error ? error.message : "Failed to load resources")
        }
      } finally {
        setLoading(false)
      }
    }

    const timer = window.setTimeout(() => {
      void fetchResources()
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchQuery, selectedCategory])

  const resetUploadState = () => {
    setSelectedFile(null)
    setFormErrors({})
    setUploadForm({
      title: "",
      description: "",
      category: "documentation",
      type: "file",
      url: "",
      tags: "",
    })
  }

  const validateUpload = () => {
    const errors: Record<string, string> = {}

    if (!uploadForm.title.trim()) errors.title = "Title is required"
    else if (uploadForm.title.trim().length < 3) errors.title = "Title must be at least 3 characters"

    if (!uploadForm.description.trim()) errors.description = "Description is required"
    else if (uploadForm.description.trim().length < 8) errors.description = "Description must be at least 8 characters"

    if (uploadForm.type === "file") {
      const fileError = validateResourceFile(selectedFile)
      if (fileError) errors.file = fileError
    } else {
      if (!uploadForm.url.trim()) {
        errors.url = uploadForm.type === "github" ? "GitHub URL is required" : "URL is required"
      } else if (!isValidUrl(uploadForm.url.trim())) {
        errors.url = "Enter a valid http or https URL"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpload = async () => {
    if (!validateUpload()) {
      toast.error("Please fix the validation errors")
      return
    }

    try {
      setIsSubmitting(true)
      await createResource({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        category: uploadForm.category,
        type: uploadForm.type,
        url: uploadForm.type === "file" ? undefined : uploadForm.url.trim(),
        file: uploadForm.type === "file" ? (selectedFile as File) : undefined,
        tags: uploadForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })

      toast.success("Resource uploaded successfully")
      setIsUploadOpen(false)
      resetUploadState()
      await refreshResources()
    } catch (error: unknown) {
      console.error("Failed to upload resource:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload resource")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      await deleteResource(deleteId)
      toast.success("Resource deleted successfully")
      setResources((current) => current.filter((resource) => resource.id !== deleteId))
      setDeleteId(null)
    } catch (error: unknown) {
      console.error("Failed to delete resource:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete resource")
    } finally {
      setIsDeleting(false)
    }
  }

  const shouldShowRestrictedState = useMemo(() => {
    if (isForbidden) return true
    if (loading) return false
    return missingSupervisor && resources.length === 0
  }, [isForbidden, loading, missingSupervisor, resources.length])

  const getTypeIcon = (type: ApiResourceType) => {
    switch (type) {
      case "file":
        return <FileText className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      case "link":
        return <Link2 className="h-5 w-5" />
      case "github":
        return <Github className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: ApiResourceType) => {
    switch (type) {
      case "file":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      case "video":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
      case "link":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      case "github":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20"
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                Learning Resources
              </h1>
              <p className="text-muted-foreground">Access tutorials, documentation, and code samples.</p>
            </div>
          </div>

          {canUpload && (
            <Dialog
              open={isUploadOpen}
              onOpenChange={(open) => {
                setIsUploadOpen(open)
                if (!open) resetUploadState()
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload New Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={formErrors.title ? "text-destructive" : ""}>Title</Label>
                      <Input
                        placeholder="Resource title"
                        value={uploadForm.title}
                        onChange={(event) => {
                          setUploadForm((current) => ({ ...current, title: event.target.value }))
                          if (formErrors.title) setFormErrors((current) => ({ ...current, title: "" }))
                        }}
                        className={formErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {formErrors.title && <p className="text-[10px] font-medium text-destructive">{formErrors.title}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={uploadForm.category}
                        onValueChange={(value: ApiResourceCategory) => setUploadForm((current) => ({ ...current, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="code">Code Sample</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={formErrors.description ? "text-destructive" : ""}>Description</Label>
                    <Textarea
                      placeholder="Describe what this resource covers..."
                      value={uploadForm.description}
                      onChange={(event) => {
                        setUploadForm((current) => ({ ...current, description: event.target.value }))
                        if (formErrors.description) setFormErrors((current) => ({ ...current, description: "" }))
                      }}
                      rows={4}
                      className={formErrors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {formErrors.description && (
                      <p className="text-[10px] font-medium text-destructive">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={uploadForm.type}
                        onValueChange={(value: ApiResourceType) => {
                          setUploadForm((current) => ({
                            ...current,
                            type: value,
                            url: value === "file" ? "" : current.url,
                          }))
                          if (value !== "file") {
                            setSelectedFile(null)
                            setFormErrors((current) => ({ ...current, file: "" }))
                          } else {
                            setFormErrors((current) => ({ ...current, url: "" }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className={uploadForm.type === "file" ? (formErrors.file ? "text-destructive" : "") : formErrors.url ? "text-destructive" : ""}>
                        {uploadForm.type === "file" ? "Upload File" : uploadForm.type === "github" ? "GitHub URL" : "Resource URL"}
                      </Label>
                      {uploadForm.type === "file" ? (
                        <>
                          <Input
                            key="file-input"
                            type="file"
                            accept={RESOURCE_FILE_ACCEPT}
                            className={formErrors.file ? "border-destructive focus-visible:ring-destructive" : ""}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null
                              setSelectedFile(file)
                              const error = validateResourceFile(file)
                              setFormErrors((current) => ({ ...current, file: error ?? "" }))
                              if (error) toast.error(error)
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, TXT. Max size: {getUploadLimitLabel(RESOURCE_FILE_MAX_SIZE)}.
                          </p>
                          {formErrors.file && <p className="text-[10px] font-medium text-destructive">{formErrors.file}</p>}
                          {selectedFile && !formErrors.file && (
                            <p className="text-[10px] text-muted-foreground">
                              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <Input
                            key="url-input"
                            placeholder={uploadForm.type === "video" ? "https://youtube.com/..." : uploadForm.type === "github" ? "https://github.com/org/repo" : "https://example.com"}
                            value={uploadForm.url}
                            onChange={(event) => {
                              setUploadForm((current) => ({ ...current, url: event.target.value }))
                              if (formErrors.url) setFormErrors((current) => ({ ...current, url: "" }))
                            }}
                            className={formErrors.url ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {formErrors.url && <p className="text-[10px] font-medium text-destructive">{formErrors.url}</p>}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      placeholder="React, JavaScript, Frontend"
                      value={uploadForm.tags}
                      onChange={(event) => setUploadForm((current) => ({ ...current, tags: event.target.value }))}
                    />
                    {uploadForm.tags && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {uploadForm.tags
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] py-0">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Upload Resource
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search resources by title, description, or tags..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as "all" | ApiResourceCategory)} className="w-full md:w-auto">
                  <TabsList className="grid grid-cols-4 w-full md:w-auto">
                    {categories.map((category) => (
                      <TabsTrigger key={category.value} value={category.value} className="gap-2">
                        <category.icon className="h-4 w-4" />
                        <span className="hidden md:inline">{category.label.split(" ")[0]}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Resources</p>
              <p className="text-3xl font-bold mt-2">{loading || shouldShowRestrictedState ? "—" : resources.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Documentation</p>
              <p className="text-3xl font-bold mt-2">
                {loading || shouldShowRestrictedState ? "—" : resources.filter((resource) => resource.category === "documentation").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Tutorials</p>
              <p className="text-3xl font-bold mt-2">
                {loading || shouldShowRestrictedState ? "—" : resources.filter((resource) => resource.category === "tutorial").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Code Samples</p>
              <p className="text-3xl font-bold mt-2">
                {loading || shouldShowRestrictedState ? "—" : resources.filter((resource) => resource.category === "code").length}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-[300px] animate-pulse border-2">
                <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 bg-muted rounded-xl" />
                  <div className="h-6 w-3/4 bg-muted rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted rounded-full" />
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : shouldShowRestrictedState ? (
            <div className="col-span-full">
              <Card className="border-2 border-dashed bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-12 flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-amber-500/10 mb-6">
                    <ShieldCheck className="h-12 w-12 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Restricted Learning Materials</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Only Doctors and TAs can publish these resources. To access them, your team must first be assigned a supervisor.
                  </p>
                  {myTeamState?.team ? (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Your team <span className="font-bold">&quot;{myTeamState.team.name}&quot;</span> is currently waiting for a supervisor.
                      </p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <Button variant="outline" className="border-amber-500/50 hover:bg-amber-500/10" asChild>
                          <a href="/dashboard/proposals">Invite a Supervisor</a>
                        </Button>
                        <Button variant="ghost" asChild>
                          <a href="/dashboard/my-team">View Team Details</a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">You need to be part of a supervised team to see these materials.</p>
                      <Button variant="outline" asChild>
                        <a href="/dashboard/my-team">Join or Create a Team</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 group">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl border-2 ${getTypeColor(resource.type)}`}>{getTypeIcon(resource.type)}</div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize">
                          {resource.type}
                        </Badge>
                        {canUpload && currentUser?.id === resource.createdByUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteId(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{resource.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.length > 0 ? (
                        resource.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No tags
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>—</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>—</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">4.5</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">by {resource.authorName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(resource.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" className="gap-2" asChild>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          {resource.type === "file" ? (
                            <>
                              <Download className="h-4 w-4" />
                              Download
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </>
                          )}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {!loading && !shouldShowRestrictedState && resources.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 border-2 border-dashed rounded-xl">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Resources Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </motion.div>
        )}

        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this resource? This action cannot be undone and will remove it from the learning materials library.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
