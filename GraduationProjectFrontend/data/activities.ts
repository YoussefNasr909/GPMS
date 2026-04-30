import type { Activity } from "@/types"

export const activities: Activity[] = [
  {
    id: "a1",
    userId: "u7",
    type: "task",
    description: "Completed task: User authentication flow",
    createdAt: "2025-02-14T10:15:00Z",
  },
  {
    id: "a2",
    userId: "u10",
    type: "task",
    description: "Updated task status: Dashboard UI to In Progress",
    createdAt: "2025-02-14T09:45:00Z",
  },
  {
    id: "a3",
    userId: "u7",
    type: "submission",
    description: "Submitted deliverable: System Requirements Specification",
    createdAt: "2025-02-13T16:30:00Z",
  },
  {
    id: "a4",
    userId: "u2",
    type: "comment",
    description: "Left feedback on proposal version 2",
    createdAt: "2025-02-13T14:20:00Z",
  },
  {
    id: "a5",
    userId: "u11",
    type: "task",
    description: "Created new task: API integration testing",
    createdAt: "2025-02-13T11:00:00Z",
  },
]
