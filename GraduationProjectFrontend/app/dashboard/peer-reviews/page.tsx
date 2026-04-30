"use client"

import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, Star, Eye, CalendarIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function PeerReviewsPage() {
  const { currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<"pending" | "submitted" | "received">("pending")
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [rating, setRating] = useState(0)

  // Mock peer review data
  const pendingReviews = [
    {
      id: "pr1",
      revieweeId: "u3",
      revieweeName: "Ahmed Hassan",
      deliverableType: "Code Implementation",
      deliverableTitle: "Authentication Module",
      dueDate: "2024-01-25",
      priority: "high",
      description: "Review the authentication implementation including JWT tokens and refresh logic",
    },
    {
      id: "pr2",
      revieweeId: "u4",
      revieweeName: "Fatima Ali",
      deliverableType: "Documentation",
      deliverableTitle: "API Documentation",
      dueDate: "2024-01-28",
      priority: "medium",
      description: "Review API endpoint documentation for completeness and clarity",
    },
  ]

  const submittedReviews = [
    {
      id: "pr3",
      revieweeId: "u5",
      revieweeName: "Omar Youssef",
      deliverableTitle: "Database Schema",
      rating: 4.5,
      submittedDate: "2024-01-20",
      feedback: "Well structured schema with proper normalization. Suggest adding indexes for performance.",
    },
  ]

  const receivedReviews = [
    {
      id: "pr4",
      reviewerId: "u6",
      reviewerName: "Sara Ibrahim",
      deliverableTitle: "Frontend Components",
      rating: 4.8,
      submittedDate: "2024-01-22",
      feedback: "Excellent component architecture. Very reusable and well-documented.",
    },
  ]

  const handleSubmitReview = (reviewData: any) => {
    toast.success("Review submitted successfully!")
    setShowReviewDialog(false)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Peer Reviews
            </h1>
            <p className="text-muted-foreground mt-2">Review your peers' work and receive feedback on yours</p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <FileText className="w-4 h-4 mr-2" />
            Review Guidelines
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-xl border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-3xl font-bold text-primary">{pendingReviews.length}</p>
                </div>
                <Clock className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-3xl font-bold text-secondary">{submittedReviews.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-secondary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-3xl font-bold text-accent">4.7</p>
                </div>
                <Star className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="bg-card/50 backdrop-blur-xl border border-border/50">
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              Pending ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              <CheckCircle className="w-4 h-4 mr-2" />
              Submitted ({submittedReviews.length})
            </TabsTrigger>
            <TabsTrigger value="received">
              <Star className="w-4 h-4 mr-2" />
              Received ({receivedReviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar>
                            <AvatarFallback>{review.revieweeName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{review.deliverableTitle}</h3>
                            <p className="text-sm text-muted-foreground">by {review.revieweeName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{review.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Label>Deliverable Type</Label>
                          <Label>{review.deliverableType}</Label>
                          <Label>Priority</Label>
                          <Label>{review.priority} priority</Label>
                          <Label>Due Date</Label>
                          <Label>
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Due {review.dueDate}
                          </Label>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedReview(review)
                          setShowReviewDialog(true)
                        }}
                        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Start Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            {submittedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{review.deliverableTitle}</h3>
                        <p className="text-sm text-muted-foreground">Reviewed: {review.revieweeName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(review.rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold">{review.rating}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">{review.feedback}</p>
                      </div>
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Submitted
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {receivedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-xl border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{review.deliverableTitle}</h3>
                        <p className="text-sm text-muted-foreground">Reviewed by: {review.reviewerName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(review.rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold">{review.rating}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">{review.feedback}</p>
                      </div>
                      <Badge variant="outline" className="bg-accent/10">
                        <Star className="w-3 h-3 mr-1" />
                        Excellent
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Peer Review</DialogTitle>
              <DialogDescription>Provide constructive feedback to help your peer improve</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rating (Required)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRating(r)}
                      className={`hover:bg-yellow-500/20 ${rating >= r ? "bg-yellow-500/20 border-yellow-500" : "bg-transparent"}`}
                    >
                      <Star className={`w-4 h-4 ${rating >= r ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    </Button>
                  ))}
                  <span className="ml-2 self-center text-sm font-medium">
                    {rating > 0 ? `${rating}.0` : "Not rated"}
                  </span>
                </div>
              </div>
              <div>
                <Label>Strengths</Label>
                <Textarea placeholder="What did they do well?" className="mt-2" rows={3} />
              </div>
              <div>
                <Label>Areas for Improvement</Label>
                <Textarea placeholder="What could be better?" className="mt-2" rows={3} />
              </div>
              <div>
                <Label>Additional Comments</Label>
                <Textarea placeholder="Any other feedback?" className="mt-2" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmitReview({ rating })}
                disabled={rating === 0}
                className="bg-gradient-to-r from-primary to-secondary glow"
              >
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}
