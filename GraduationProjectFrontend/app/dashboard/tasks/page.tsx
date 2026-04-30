import { Suspense } from "react"
import { TasksBoardPage } from "@/components/tasks/tasks-board-page"
import Loading from "./loading"

export default function TasksPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TasksBoardPage />
    </Suspense>
  )
}
