"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ComponentType } from "react"
import {
  BookOpen,
  CheckCircle2,
  Code,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Lightbulb,
  ListChecks,
  Rocket,
  ShieldCheck,
  TestTube,
  Upload,
  Wrench,
} from "lucide-react"

type PhaseKey =
  | "REQUIREMENTS"
  | "DESIGN"
  | "IMPLEMENTATION"
  | "TESTING"
  | "DEPLOYMENT"
  | "MAINTENANCE"

type Deliverable = {
  name: string
  details: string
  required: boolean
}

type PhaseGuide = {
  phase: PhaseKey
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  accent: string
  iconBg: string
  badge: string
  meaning: string
  deliverables: Deliverable[]
  checklist: string[]
  reference: {
    label: string
    href: string
  }
}

const phaseGuides: PhaseGuide[] = [
  {
    phase: "REQUIREMENTS",
    title: "Requirements",
    subtitle: "Understand the problem before building the solution.",
    icon: FileText,
    accent: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    badge: "bg-blue-500/10 text-blue-600 border-blue-200",
    meaning:
      "This phase defines what the system should do, who will use it, and which constraints the team must respect.",
    deliverables: [
      {
        name: "SRS Document",
        details:
          "Include project scope, stakeholders, user roles, functional requirements, non-functional requirements, assumptions, constraints, and acceptance criteria.",
        required: true,
      },
    ],
    checklist: [
      "Each requirement is clear, testable, and numbered.",
      "Functional and non-functional requirements are separated.",
      "The document explains the users, goals, scope, and boundaries of the project.",
    ],
    reference: {
      label: "IBM: What is the SDLC?",
      href: "https://www.ibm.com/think/topics/sdlc",
    },
  },
  {
    phase: "DESIGN",
    title: "Design",
    subtitle: "Turn requirements into a technical plan.",
    icon: Wrench,
    accent: "border-l-purple-500",
    iconBg: "bg-purple-500/10",
    badge: "bg-purple-500/10 text-purple-600 border-purple-200",
    meaning:
      "This phase describes how the system will be organized: data, screens, modules, interactions, and major architecture decisions.",
    deliverables: [
      {
        name: "UML Diagrams",
        details:
          "Submit the diagrams your supervisor requires, commonly use case, class, sequence, activity, ERD, or architecture diagrams.",
        required: true,
      },
    ],
    checklist: [
      "Diagrams match the requirements in the SRS.",
      "Class, database, and interaction diagrams use consistent names.",
      "Important design decisions are explained in short notes.",
    ],
    reference: {
      label: "Visual Paradigm: UML Practical Guide",
      href: "https://www.visual-paradigm.com/guide/uml-unified-modeling-language/uml-practical-guide/",
    },
  },
  {
    phase: "IMPLEMENTATION",
    title: "Implementation",
    subtitle: "Build the approved design into working software.",
    icon: Code,
    accent: "border-l-orange-500",
    iconBg: "bg-orange-500/10",
    badge: "bg-orange-500/10 text-orange-600 border-orange-200",
    meaning:
      "This phase is where the team writes the application, connects services, manages the repository, and prepares a working prototype.",
    deliverables: [
      {
        name: "Prototype",
        details:
          "Submit a runnable demo or hosted build that proves the main user flows and core features work.",
        required: true,
      },
      {
        name: "Source Code",
        details:
          "Submit the repository link or source archive, including setup instructions, environment variables, and any required seed data.",
        required: true,
      },
    ],
    checklist: [
      "The project can be installed and run from the submitted instructions.",
      "Code is organized by feature or layer and committed to version control.",
      "Core flows from the SRS are implemented or clearly marked as pending.",
    ],
    reference: {
      label: "Atlassian: SDLC Overview",
      href: "https://www.atlassian.com/en/agile/software-development/sdlc",
    },
  },
  {
    phase: "TESTING",
    title: "Testing",
    subtitle: "Prove that the system behaves as expected.",
    icon: TestTube,
    accent: "border-l-yellow-500",
    iconBg: "bg-yellow-500/10",
    badge: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    meaning:
      "This phase checks the product against the requirements, catches defects, and documents what has been verified.",
    deliverables: [
      {
        name: "Test Plan",
        details:
          "Include test scope, test cases, expected results, actual results, defect notes, and any automated test evidence.",
        required: true,
      },
    ],
    checklist: [
      "Each major requirement has at least one related test case.",
      "Failed tests include the bug, expected behavior, and fix status.",
      "Manual and automated test evidence is easy to review.",
    ],
    reference: {
      label: "Atlassian: Test Plan Guide",
      href: "https://www.atlassian.com/software/confluence/resources/guides/how-to/test-plan",
    },
  },
  {
    phase: "DEPLOYMENT",
    title: "Deployment",
    subtitle: "Package the project for final review and use.",
    icon: Rocket,
    accent: "border-l-green-500",
    iconBg: "bg-green-500/10",
    badge: "bg-green-500/10 text-green-600 border-green-200",
    meaning:
      "This phase prepares the final version, release notes, documentation, presentation material, and the environment where the project can be evaluated.",
    deliverables: [
      {
        name: "Final Report",
        details:
          "Summarize the problem, objectives, methodology, design, implementation, testing, results, limitations, and future work.",
        required: true,
      },
      {
        name: "Presentation",
        details:
          "Submit slides for the final discussion, focusing on the problem, solution, architecture, demo, results, and lessons learned.",
        required: true,
      },
    ],
    checklist: [
      "The final demo link or setup path works on a clean machine.",
      "The report and slides tell the same project story.",
      "Known limitations and future improvements are honest and specific.",
    ],
    reference: {
      label: "Atlassian: Software Deployment",
      href: "https://www.atlassian.com/agile/software-development/software-deployment",
    },
  },
  {
    phase: "MAINTENANCE",
    title: "Maintenance",
    subtitle: "Improve, fix, and support the system after release.",
    icon: ShieldCheck,
    accent: "border-l-slate-500",
    iconBg: "bg-slate-500/10",
    badge: "bg-slate-500/10 text-slate-600 border-slate-200",
    meaning:
      "This phase covers bug fixes, small improvements, monitoring, documentation updates, and responding to supervisor feedback after deployment.",
    deliverables: [
      {
        name: "No fixed deliverable by default",
        details:
          "Submit maintenance notes, updated code, or a revision package only when your supervisor requests changes after review.",
        required: false,
      },
    ],
    checklist: [
      "Track reported bugs and fixes clearly.",
      "Keep the final code, report, and setup instructions synchronized.",
      "Document any post-deployment changes made after the final submission.",
    ],
    reference: {
      label: "NIST: System Development Life Cycle",
      href: "https://www.nist.gov/publications/system-development-life-cycle-sdlc",
    },
  },
]

const overviewItems = [
  {
    title: "Read the phase goal",
    text: "Start with what the phase is trying to prove before preparing files.",
    icon: BookOpen,
    bg: "bg-blue-500/10",
    color: "text-blue-500",
  },
  {
    title: "Prepare the deliverables",
    text: "Use the listed documents, code, reports, or slides as the submission target.",
    icon: Upload,
    bg: "bg-green-500/10",
    color: "text-green-500",
  },
  {
    title: "Check quality first",
    text: "Run through the checklist so your supervisor can review the work faster.",
    icon: ListChecks,
    bg: "bg-amber-500/10",
    color: "text-amber-500",
  },
]

const referenceItems = [
  {
    title: "SDLC Overview",
    source: "IBM",
    href: "https://www.ibm.com/think/topics/sdlc",
    icon: Layers,
  },
  {
    title: "Secure SDLC Context",
    source: "NIST",
    href: "https://www.nist.gov/publications/system-development-life-cycle-sdlc",
    icon: ShieldCheck,
  },
  {
    title: "Agile SDLC Guide",
    source: "Atlassian",
    href: "https://www.atlassian.com/en/agile/software-development/sdlc",
    icon: GitBranch,
  },
]

const phaseAnchors: Record<PhaseKey, string> = {
  REQUIREMENTS: "requirements",
  DESIGN: "design",
  IMPLEMENTATION: "implementation",
  TESTING: "testing",
  DEPLOYMENT: "deployment",
  MAINTENANCE: "maintenance",
}

export default function SDLCPage() {
  function scrollToPhase(phase: PhaseKey) {
    document.getElementById(phaseAnchors[phase])?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              Student Guide
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            SDLC Phases and What to Submit
          </h1>
          <p className="mt-2 text-muted-foreground">
            A practical guide to each Software Development Life Cycle phase, what it means for a
            graduation project, and which deliverables students should prepare.
          </p>
        </div>
        <Button asChild className="w-full sm:w-fit">
          <a href="/dashboard/submissions">
            Open Submissions
            <Upload className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {overviewItems.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.title} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {phaseGuides.map((phase, index) => (
            <div key={phase.phase} className="flex items-center gap-2">
              <Badge
                asChild
                variant="outline"
                className={`${phase.badge} cursor-pointer transition-colors hover:bg-background`}
              >
                <button
                  type="button"
                  onClick={() => scrollToPhase(phase.phase)}
                  aria-label={`Jump to ${phase.title} phase`}
                >
                  {index + 1}. {phase.title}
                </button>
              </Badge>
              {index < phaseGuides.length - 1 && (
                <span className="text-xs text-muted-foreground">/</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {phaseGuides.map((phase, index) => {
          const Icon = phase.icon

          return (
            <Card
              key={phase.phase}
              id={phaseAnchors[phase.phase]}
              className={`scroll-mt-24 overflow-hidden border-l-4 ${phase.accent}`}
            >
              <div className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 shrink-0 rounded-lg p-3 ${phase.iconBg}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={phase.badge}>
                          Phase {index + 1}
                        </Badge>
                        <h2 className="text-xl font-semibold">{phase.title}</h2>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{phase.subtitle}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full md:w-fit">
                    <a href={phase.reference.href} target="_blank" rel="noopener noreferrer">
                      {phase.reference.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">What This Phase Means</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{phase.meaning}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Before Submitting</h3>
                      <ul className="mt-2 space-y-2">
                        {phase.checklist.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">What Students Submit</h3>
                    <div className="mt-2 space-y-3">
                      {phase.deliverables.map((deliverable) => (
                        <div key={deliverable.name} className="rounded-lg border bg-background p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium">{deliverable.name}</h4>
                            <Badge variant={deliverable.required ? "default" : "outline"}>
                              {deliverable.required ? "Required" : "As Requested"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {deliverable.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Trusted References</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {referenceItems.map((item) => {
            const Icon = item.icon

            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.source}</p>
                  </div>
                  <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
