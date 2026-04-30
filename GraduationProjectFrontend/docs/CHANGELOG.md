# Changelog

All notable changes to ProjectHub will be documented in this file.

## [2.0.2] - 2026-04-18 - Upload Size Limit Controls

### Changed
- Team document uploads now support configurable size limits through `DOCUMENT_MAX_SIZE_MB` and `NEXT_PUBLIC_DOCUMENT_MAX_SIZE_MB`
- Learning resource file uploads now support configurable size limits through `RESOURCE_MAX_SIZE_MB` and `NEXT_PUBLIC_RESOURCE_MAX_SIZE_MB`
- Setting any of those values to `0` disables the size cap entirely
- Upload UI messages now reflect the configured limit instead of hard-coded 20MB or 25MB text

## [2.0.1] - 2026-04-18 - Upload Stability Fixes

### Fixed
- Learning resources upload UI now matches the backend contract for `file`, `video`, `link`, and `github` resource types
- Removed broken upload path for admins on the resources screen so the UI matches backend permissions
- Fixed resource ownership checks and author rendering so delete actions appear for the correct doctor or TA
- Added client-side validation for document and resource file types and size limits before requests are sent
- Failed uploads are now cleaned up on the backend to avoid orphan files on disk
- Replaced and deleted document/resource uploads now remove the old local file when applicable

## [2.0.0] - 2025-01-XX - Major Enhancement Release

### Added
- **Universal Search System**: Search across teams, tasks, users, files, and meetings with category filtering
- **Help & Support Center**: Comprehensive documentation, video tutorials, and knowledge base
- **Support Ticket System**: Submit and track support tickets with priority levels
- **FAQ System**: 35+ frequently asked questions across 9 categories
- **System Logs Page**: Complete audit trail for admin with filtering and export
- **Team-Required Guards**: Friendly onboarding for students without teams on 15+ pages
- **Enhanced Gamification**: Quests, challenges, and reward store with 25+ achievements
- **Two New Demo Users**: Student without team and Team Leader without team
- **Admin Management**: User, team, deadline, and system settings CRUD operations
- **Enhanced Discover Page**: Supervisor selection with advanced search, compare mode, and reviews
- **Enhanced My Team Page**: 6 tabs with comprehensive team management features
- **Enhanced Profile & Settings**: Role-specific features, theme customization, and security settings
- **Enhanced Homepage**: Animated hero, features showcase, pricing, and testimonials
- **Enhanced Auth Pages**: Social login, 2FA, password strength, and multi-step registration

### Enhanced
- **All 5 Role Dashboards**: Modern design with gradients, animations, and role-specific features
- **Login Page**: Social login buttons, forgot password, remember me, and demo user categories
- **Register Page**: Multi-step form, password strength meter, and OTP verification
- **Gamification Page**: Removed lag, added quests, challenges, and store with better UX
- **Admin Dashboard**: System health monitoring, user management, and activity logs
- **Doctor Dashboard**: Team health distribution, pending actions, and office hours
- **TA Dashboard**: Review queue, Q&A management, and technical support tracking
- **Analytics Page**: Added TeamRequiredGuard and improved UI
- **Meetings Page**: Added TeamRequiredGuard and enhanced meeting cards
- **Evaluations Page**: Improved UI with animations and better layout
- **Submissions Page**: Enhanced submission cards and feedback system
- **Proposals Page**: Added TeamRequiredGuard and improved proposal workflow
- **Time Tracker**: Added TeamRequiredGuard and enhanced timer UI
- **Version Control**: Added TeamRequiredGuard and improved branch management
- **Risk Management**: Added TeamRequiredGuard and enhanced risk matrix
- **Logout Experience**: Modern dialog with smooth animation and progress indicator

### Fixed
- **Team Logic**: Team leaders can only create teams, students can only join teams
- **Supervisor Selection**: One-time selection enforcement with locked view after assignment
- **Search Page**: Was empty, now fully implemented with comprehensive search
- **getUserById Export**: Added missing export to data/users.ts
- **Gamification Lag**: Removed counter animations causing 5-second lag
- **Dashboard Quick Links**: Students see correct links based on team status
- **My Team Access**: Students see join UI if no team, leaders see create UI
- **All Team-Related Pages**: Added guards for students without teams

### Technical Improvements
- Added TeamRequiredGuard component for consistent team access control
- Improved TypeScript types and exports
- Enhanced Framer Motion animations throughout
- Better responsive design for mobile devices
- Consistent gradient text and glass morphism effects
- Optimized component structure and code organization

---

## [1.0.0] - 2024-12-XX - Initial Release

### Added
- Multi-role authentication system (Student, Team Leader, Doctor, TA, Admin)
- Dashboard with role-based views
- Task management with Kanban, List, Timeline, and Calendar views
- SDLC phase tracking with deliverables
- Team management and collaboration
- Gamification system with XP, achievements, and leaderboard
- Chat system with AI bot
- Meeting management
- File management
- GitHub integration
- Calendar integration
- Notification system
- Analytics and reporting
- Peer review system
- Risk management
- Time tracking
- And 200+ more features

---

Last Updated: January 2025
