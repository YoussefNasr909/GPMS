"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Bug,
  Lightbulb,
  HelpCircle,
  FileText,
  Upload,
  X,
  Paperclip,
  User,
  MessageCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const ticketCategories = [
  { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-500" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-yellow-500" },
  { value: "question", label: "General Question", icon: HelpCircle, color: "text-blue-500" },
  { value: "account", label: "Account Issue", icon: User, color: "text-purple-500" },
  { value: "technical", label: "Technical Support", icon: AlertCircle, color: "text-orange-500" },
]

const priorityLevels = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
]

const previousTickets = [
  {
    id: "TKT-001",
    subject: "Unable to upload files larger than 10MB",
    category: "bug",
    status: "resolved",
    priority: "high",
    createdAt: "2024-01-10",
    lastUpdate: "2024-01-12",
  },
  {
    id: "TKT-002",
    subject: "Request for dark mode in calendar",
    category: "feature",
    status: "in-progress",
    priority: "medium",
    createdAt: "2024-01-08",
    lastUpdate: "2024-01-11",
  },
  {
    id: "TKT-003",
    subject: "How to connect GitHub repository?",
    category: "question",
    status: "closed",
    priority: "low",
    createdAt: "2024-01-05",
    lastUpdate: "2024-01-05",
  },
]

const contactMethods = [
  {
    title: "Email Support",
    description: "Get help via email within 24 hours",
    icon: Mail,
    value: "support@projecthub.edu",
    action: "Send Email",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Live Chat",
    description: "Chat with our support team",
    icon: MessageCircle,
    value: "Available 9 AM - 6 PM",
    action: "Start Chat",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Phone Support",
    description: "Speak directly with support",
    icon: Phone,
    value: "+1 (555) 123-4567",
    action: "Call Now",
    color: "from-purple-500 to-pink-500",
  },
]

export default function SupportPage() {
  const { currentUser } = useAuthStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setSubmitted(true)
    toast({
      title: "Ticket Submitted",
      description: "We'll get back to you within 24 hours.",
    })
  }

  const handleFileUpload = () => {
    // Simulate file upload
    setAttachments([...attachments, `attachment-${attachments.length + 1}.png`])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/10 text-green-500"
      case "in-progress":
        return "bg-blue-500/10 text-blue-500"
      case "closed":
        return "bg-gray-500/10 text-gray-500"
      default:
        return "bg-yellow-500/10 text-yellow-500"
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background border p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Support Center</h1>
              <p className="text-muted-foreground">Get help from our support team</p>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center mb-3`}
                    >
                      <method.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-sm font-medium text-primary">{method.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="new-ticket" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="new-ticket">New Ticket</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
        </TabsList>

        {/* New Ticket Tab */}
        <TabsContent value="new-ticket">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ticket Submitted Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your ticket ID is <span className="font-mono font-bold">TKT-{Date.now().toString().slice(-6)}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                We'll review your request and get back to you within 24 hours.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Ticket
                </Button>
                <Link href="/dashboard/help">
                  <Button>Back to Help Center</Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>Describe your issue and we'll help you resolve it</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {ticketCategories.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: category.value })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            formData.category === category.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <category.icon className={`h-6 w-6 mx-auto mb-2 ${category.color}`} />
                          <span className="text-sm font-medium">{category.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <div className="flex gap-3">
                      {priorityLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: level.value })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            formData.priority === level.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${level.color}`} />
                          <span className="text-sm">{level.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide as much detail as possible about your issue..."
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                      <Button type="button" variant="outline" size="sm" onClick={handleFileUpload}>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                    </div>
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {attachments.map((file, index) => (
                          <Badge key={index} variant="secondary" className="gap-2">
                            <FileText className="h-3 w-3" />
                            {file}
                            <button type="button" onClick={() => removeAttachment(index)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4">
                    <Button type="submit" className="gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard/help">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Tickets Tab */}
        <TabsContent value="my-tickets">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
              <CardDescription>Track the status of your submitted tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previousTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("-", " ")}</Badge>
                          <Badge variant="outline">
                            {ticketCategories.find((c) => c.value === ticket.category)?.label}
                          </Badge>
                        </div>
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created: {ticket.createdAt}
                          </span>
                          <span>Last update: {ticket.lastUpdate}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Links */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Looking for quick answers?</h3>
              <p className="text-sm text-muted-foreground">Check our FAQ or Help Center for common questions</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/faq">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <HelpCircle className="h-4 w-4" />
                  View FAQs
                </Button>
              </Link>
              <Link href="/dashboard/help">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-4 w-4" />
                  Help Center
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
