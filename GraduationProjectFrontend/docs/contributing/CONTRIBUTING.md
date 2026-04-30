# Contributing to ProjectHub

Thank you for your interest in contributing to ProjectHub! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/projecthub.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm run dev`
7. Commit your changes: `git commit -m "Add your commit message"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing code structure and naming conventions
- Use functional components with hooks (no class components)
- Keep components small and focused (under 300 lines)
- Use Tailwind CSS for styling (avoid inline styles)
- Add comments for complex logic

### Component Structure

\`\`\`typescript
'use client' // Only if needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface ComponentProps {
  title: string
  // ... other props
}

export function ComponentName({ title }: ComponentProps) {
  const [state, setState] = useState(false)

  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
\`\`\`

### File Naming

- Components: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- Pages: `page.tsx` in appropriate folder
- Utilities: `kebab-case.ts` (e.g., `date-utils.ts`)
- Types: `index.ts` in types folder

### Commit Messages

Use conventional commits format:

- `feat: add new feature`
- `fix: resolve bug in component`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure component`
- `test: add tests`
- `chore: update dependencies`

## Project Structure

\`\`\`
projecthub/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── features/         # Feature components
├── lib/                   # Utilities and helpers
│   ├── stores/           # Zustand state management
│   └── utils/            # Helper functions
├── data/                  # Mock data
├── types/                 # TypeScript type definitions
└── public/               # Static assets
\`\`\`

## Adding New Features

1. **Create a new page**: Add to `app/dashboard/[feature]/page.tsx`
2. **Add to navigation**: Update `components/app-shell/app-sidebar.tsx`
3. **Create types**: Add to `types/index.ts` if needed
4. **Add mock data**: Create in `data/[feature].ts` if needed
5. **Create loading state**: Add `loading.tsx` in the page folder
6. **Update documentation**: Add feature to FEATURES.md

## Testing

Before submitting a PR:

1. Test all user flows related to your changes
2. Check responsive design (mobile, tablet, desktop)
3. Verify dark/light theme compatibility
4. Test with different user roles
5. Ensure no console errors
6. Check TypeScript compilation: `npm run build`

## Pull Request Process

1. Update documentation if needed
2. Add screenshots for UI changes
3. Describe what changed and why
4. Reference any related issues
5. Wait for review and address feedback
6. Once approved, your PR will be merged

## Questions?

If you have questions about contributing, please open an issue with the `question` label.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project
- Show empathy towards other contributors

Thank you for contributing to ProjectHub!
