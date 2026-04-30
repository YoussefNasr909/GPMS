# Administrator Guide
## Graduation Project Management System

**Version:** 1.0  
**For:** System Administrators

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Management](#user-management)
3. [Team Management](#team-management)
4. [System Configuration](#system-configuration)
5. [Analytics & Reporting](#analytics--reporting)
6. [Security & Permissions](#security--permissions)
7. [Backup & Recovery](#backup--recovery)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

### Administrator Dashboard

The admin dashboard provides a comprehensive view of system health and metrics:

**Key Metrics:**
- Total Users (by role)
- Active Teams
- System Load
- Storage Usage
- Recent Activity Log

**Quick Actions:**
- Add New User
- Create Team
- Run System Reports
- View Audit Logs

---

## User Management

### Adding New Users

**Single User Creation:**

1. Navigate to **Admin → Users**
2. Click **"Add User"** button
3. Fill in user information:
   \`\`\`
   Full Name: *
   Email: * (must be unique)
   Role: Student/Team Leader/Supervisor/TA/Admin
   Department: Computer Science, Software Engineering, etc.
   Academic Year: 2024-2025
   \`\`\`
4. Set initial password (or send reset link)
5. Click **"Create User"**

**Bulk User Import:**

1. Prepare CSV file with headers:
   \`\`\`csv
   full_name,email,role,department,academic_year
   Ahmed Hassan,ahmed@university.edu,student,CS,2024-2025
   Sara Mohamed,sara@university.edu,supervisor,SE,2024-2025
   \`\`\`

2. Go to **Admin → Users → Import**
3. Click **"Upload CSV"**
4. Map CSV columns to system fields
5. Preview import
6. Click **"Import Users"**

### Managing User Roles

**Role Hierarchy:**
- Admin: Full system access
- Supervisor: Manages multiple teams
- Teaching Assistant: Supports teams
- Team Leader: Manages own team
- Student: Team member

**Changing User Roles:**

1. Find user in user list
2. Click **"Edit"** icon
3. Select new role from dropdown
4. Click **"Save Changes"**
5. User receives email notification

**Custom Permissions:**

1. Go to **Admin → Roles & Permissions**
2. Create custom role or modify existing
3. Set granular permissions:
   - View teams
   - Create teams
   - Edit proposals
   - Delete submissions
   - View analytics
   - Manage users
4. Assign role to users

### User Status Management

**Account States:**
- Active: Can login and use system
- Suspended: Cannot login, data preserved
- Pending: Awaiting email verification
- Deactivated: Archived, cannot be reactivated

**Suspending Users:**

1. Navigate to user profile
2. Click **"Actions" → "Suspend Account"**
3. Enter suspension reason
4. Set duration (temporary/permanent)
5. Confirm action

**Reactivating Users:**

1. Find suspended user
2. Click **"Actions" → "Reactivate"**
3. User receives reactivation email

---

## Team Management

### Creating Teams (Admin Override)

Admins can create teams without normal restrictions:

1. Go to **Admin → Teams**
2. Click **"Create Team"**
3. Fill team details:
   - Team Name
   - Description
   - Assign Leader
   - Add Members
   - Assign Supervisor
   - Assign TA
   - Set Max Members (override limit)
4. Click **"Create"**

### Managing Team Composition

**Adding Members to Team:**

1. Open team details
2. Click **"Add Member"**
3. Search for students
4. Select and confirm

**Removing Members:**

1. View team members list
2. Click **"Remove"** next to member
3. Choose action for their tasks:
   - Reassign to another member
   - Unassign (back to pool)
   - Delete tasks
4. Confirm removal

**Changing Team Leader:**

1. Open team settings
2. Click **"Change Leader"**
3. Select new leader from members
4. Old leader becomes regular member
5. New leader notified

### Dissolving Teams

When a team needs to be disbanded:

1. Navigate to team page
2. Click **"Actions" → "Dissolve Team"**
3. **Warning:** This action:
   - Removes all members
   - Archives all tasks
   - Preserves data for records
   - Cannot be undone
4. Enter team name to confirm
5. Click **"Dissolve Team"**

---

## System Configuration

### Global Settings

**Academic Calendar:**

1. Go to **Admin → Settings → Academic Calendar**
2. Configure:
   - Semester Start Date
   - Semester End Date
   - Proposal Deadline
   - Mid-Semester Review Date
   - Final Presentation Date
   - Project Submission Deadline
3. Set automated reminders
4. Save configuration

**Email Configuration:**

1. Navigate to **Admin → Settings → Email**
2. Configure SMTP settings:
   \`\`\`
   SMTP Host: smtp.university.edu
   SMTP Port: 587
   SMTP User: noreply@university.edu
   SMTP Password: ********
   From Name: Graduation System
   From Email: noreply@university.edu
   \`\`\`
3. Test email delivery
4. Configure email templates

**Notification Settings:**

1. Go to **Admin → Settings → Notifications**
2. Configure notification types:
   - Email notifications
   - In-app notifications
   - SMS notifications (if enabled)
3. Set frequency limits (prevent spam)
4. Configure notification templates

### Gamification Configuration

**XP Rewards:**

1. Navigate to **Admin → Settings → Gamification**
2. Adjust XP values:
   \`\`\`
   Task Completion: 50 XP
   Early Submission: +25 XP
   Code Contribution: 10 XP per commit
   Meeting Attendance: 5 XP
   Helping Teammates: 10 XP
   \`\`\`
3. Set level thresholds
4. Save changes

**Achievement Management:**

1. View existing achievements
2. Click **"Add Achievement"**
3. Define:
   - Name
   - Description
   - Icon
   - Requirements
   - XP Reward
   - Rarity (Common/Rare/Legendary)
4. Save achievement

### File Upload Settings

1. Go to **Admin → Settings → Files**
2. Configure:
   - Maximum file size: 10 MB
   - Allowed file types: pdf, docx, xlsx, jpg, png, zip
   - Storage provider: AWS S3 / Local
   - Auto-delete after: Never / 1 year
3. Set virus scanning options
4. Save configuration

---

## Analytics & Reporting

### System Analytics Dashboard

**Key Metrics to Monitor:**

1. **User Activity:**
   - Daily active users
   - Peak usage hours
   - Login frequency

2. **Team Performance:**
   - Average task completion rate
   - Teams at risk
   - Average project progress

3. **System Health:**
   - API response times
   - Error rates
   - Database query performance

### Generating Reports

**Standard Reports:**

1. Navigate to **Admin → Reports**
2. Select report type:
   - User Activity Report
   - Team Progress Report
   - Submission Status Report
   - Attendance Report
   - System Usage Report
3. Set date range
4. Choose format: PDF, Excel, CSV
5. Click **"Generate Report"**

**Custom Reports:**

1. Go to **Admin → Reports → Custom**
2. Use query builder:
   - Select data sources
   - Choose fields
   - Add filters
   - Set grouping
   - Add calculations
3. Preview results
4. Save report template
5. Schedule automated generation

### Exporting Data

**Bulk Data Export:**

1. Navigate to **Admin → Data Management → Export**
2. Select data types:
   - Users
   - Teams
   - Tasks
   - Submissions
   - Messages
3. Choose format: JSON, CSV, SQL
4. Click **"Export"**
5. Download ZIP file

---

## Security & Permissions

### Access Control

**Role-Based Access Control (RBAC):**

The system uses roles to determine what users can access:

| Action | Student | Leader | TA | Supervisor | Admin |
|--------|---------|--------|----|-----------| ------|
| View own team | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create team | ✗ | ✓ | ✗ | ✗ | ✓ |
| Edit team | ✗ | ✓ | ✗ | ✓ | ✓ |
| Delete team | ✗ | ✗ | ✗ | ✗ | ✓ |
| View all teams | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✓ |
| View analytics | ✗ | ✗ | ✗ | ✓ | ✓ |
| System settings | ✗ | ✗ | ✗ | ✗ | ✓ |

**Creating Custom Roles:**

1. Go to **Admin → Roles & Permissions**
2. Click **"Create Role"**
3. Enter role name and description
4. Select permissions from list:
   - User Management
   - Team Management
   - Content Moderation
   - Analytics Access
   - System Configuration
5. Save role
6. Assign to users

### Audit Logging

**Viewing Audit Logs:**

1. Navigate to **Admin → Audit Logs**
2. Filter by:
   - Date range
   - User
   - Action type (Create, Update, Delete)
   - Resource type
3. View detailed log entries

**Log Entry Details:**
\`\`\`json
{
  "timestamp": "2025-02-15T14:30:00Z",
  "user_id": "u1",
  "user_email": "admin@university.edu",
  "action": "DELETE_USER",
  "resource_type": "User",
  "resource_id": "u99",
  "ip_address": "192.168.1.100",
  "changes": {
    "before": {...},
    "after": {...}
  }
}
\`\`\`

### Security Settings

**Password Policy:**

1. Go to **Admin → Settings → Security**
2. Configure password requirements:
   - Minimum length: 8 characters
   - Require uppercase: Yes
   - Require numbers: Yes
   - Require special characters: Yes
   - Password expiry: 90 days
   - Prevent reuse: Last 5 passwords
3. Save settings

**Session Management:**

1. Set session timeout: 30 minutes
2. Enable "Remember Me": Optional
3. Max concurrent sessions: 3
4. Force logout on password change: Yes

**Two-Factor Authentication:**

1. Enable 2FA globally or per-role
2. Supported methods:
   - SMS
   - Authenticator App (Google/Microsoft)
   - Email
3. Configure backup codes
4. Set 2FA grace period for new users

---

## Backup & Recovery

### Automated Backups

**Configuring Backups:**

1. Navigate to **Admin → System → Backups**
2. Set backup schedule:
   - Daily at 2:00 AM
   - Weekly full backup on Sunday
   - Incremental backups other days
3. Choose backup location:
   - AWS S3
   - External server
   - Local storage
4. Set retention policy:
   - Keep daily backups: 7 days
   - Keep weekly backups: 4 weeks
   - Keep monthly backups: 12 months
5. Enable backup encryption
6. Save configuration

**Manual Backup:**

1. Go to **Admin → System → Backups**
2. Click **"Create Backup Now"**
3. Choose backup type:
   - Full backup (all data)
   - Database only
   - Files only
4. Wait for completion
5. Download backup file

### Restoring from Backup

**Full System Restore:**

1. Navigate to **Admin → System → Restore**
2. Select backup file from list
3. Review backup details:
   - Backup date
   - Size
   - Data included
4. **Warning:** This will overwrite current data
5. Enter admin password to confirm
6. Click **"Restore"**
7. System will restart
8. Verify data integrity

**Partial Restore:**

1. Go to **Admin → System → Restore**
2. Select backup
3. Choose specific data to restore:
   - Users only
   - Teams only
   - Specific date range
4. Preview changes
5. Confirm and restore

---

## Maintenance

### System Maintenance Mode

**Enabling Maintenance Mode:**

1. Go to **Admin → System → Maintenance**
2. Toggle **"Enable Maintenance Mode"**
3. Set maintenance message for users
4. Add estimated completion time
5. Choose who can access:
   - Admins only (default)
   - Admins + Supervisors
6. Click **"Enable"**

During maintenance:
- Users see maintenance page
- No data can be modified
- Read-only access for allowed roles

**Disabling Maintenance Mode:**

1. Complete maintenance tasks
2. Go to **Admin → System → Maintenance**
3. Click **"Disable Maintenance Mode"**
4. System immediately available

### Database Maintenance

**Optimize Database:**

1. Navigate to **Admin → System → Database**
2. Click **"Optimize Tables"**
3. System will:
   - Rebuild indexes
   - Clean up orphaned records
   - Compact data
4. Wait for completion (can take 5-30 minutes)

**Clear Cache:**

1. Go to **Admin → System → Cache**
2. Select cache type:
   - Application cache
   - Session cache
   - Database query cache
   - All caches
3. Click **"Clear Cache"**

### Updating the System

**Checking for Updates:**

1. Go to **Admin → System → Updates**
2. Click **"Check for Updates"**
3. View available updates:
   - Security patches
   - Feature updates
   - Bug fixes

**Installing Updates:**

1. **Before updating:**
   - Create full backup
   - Enable maintenance mode
   - Notify users

2. **Update process:**
   - Click **"Install Update"**
   - System downloads update
   - Applies database migrations
   - Updates application files
   - Runs post-update scripts

3. **After updating:**
   - Verify system functionality
   - Check audit logs for errors
   - Disable maintenance mode
   - Notify users of new features

---

## Troubleshooting

### Common Issues

**Issue: Users Cannot Login**

**Symptoms:**
- Invalid credentials error
- Password reset not working

**Solutions:**
1. Check user account status (not suspended)
2. Verify email is correct
3. Reset password manually from admin panel
4. Check email delivery logs
5. Verify SMTP configuration

---

**Issue: Slow System Performance**

**Symptoms:**
- Pages load slowly
- Timeouts
- High server CPU/memory usage

**Solutions:**
1. Check system metrics dashboard
2. Optimize database (run OPTIMIZE command)
3. Clear cache
4. Check for long-running queries
5. Review server resources
6. Consider scaling infrastructure

---

**Issue: File Uploads Failing**

**Symptoms:**
- Upload timeouts
- File size errors
- Format not supported errors

**Solutions:**
1. Check storage space availability
2. Verify file size limits in settings
3. Check allowed file types configuration
4. Test S3/storage provider connection
5. Review server upload limits (PHP/Node)

---

**Issue: Emails Not Sending**

**Symptoms:**
- Users not receiving notifications
- Registration emails missing
- Password reset emails not arriving

**Solutions:**
1. Test SMTP configuration
2. Check email queue status
3. Verify email server credentials
4. Check spam/blacklist status
5. Review email logs in admin panel

---

**Issue: GitHub Integration Not Working**

**Symptoms:**
- Cannot connect repository
- Commits not syncing
- Access denied errors

**Solutions:**
1. Verify GitHub OAuth app configuration
2. Check GitHub access token validity
3. Ensure repository is accessible
4. Review GitHub API rate limits
5. Regenerate access token

---

### Emergency Procedures

**System Down / Critical Error:**

1. **Immediate Actions:**
   - Enable maintenance mode
   - Check server status
   - Review error logs
   - Notify technical team

2. **Diagnosis:**
   - Check application logs
   - Review database logs
   - Check server resources
   - Test database connection

3. **Recovery:**
   - Restore from latest backup if needed
   - Roll back recent changes
   - Apply hot fixes
   - Monitor system after recovery

**Data Loss / Corruption:**

1. **Stop all writes immediately**
2. **Assess damage:**
   - Identify affected data
   - Determine cause
   - Check backup availability

3. **Recovery:**
   - Restore from most recent clean backup
   - Manually recover missing data if possible
   - Verify data integrity
   - Document incident

---

## Best Practices

1. **Regular Backups:**
   - Verify backups are running
   - Test restore process monthly
   - Keep backups offsite

2. **Security:**
   - Review user permissions quarterly
   - Monitor audit logs weekly
   - Update system promptly
   - Use strong admin passwords

3. **Performance:**
   - Monitor system metrics daily
   - Optimize database monthly
   - Review slow queries
   - Clear caches regularly

4. **User Management:**
   - Remove inactive users
   - Review role assignments
   - Update user information
   - Communicate policy changes

5. **Documentation:**
   - Document all configuration changes
   - Keep runbooks updated
   - Record incident resolutions
   - Maintain contact list

---

## Support Escalation

**Level 1: Self-Service**
- Check this admin guide
- Review system documentation
- Search knowledge base

**Level 2: Technical Support**
- Email: tech-support@university.edu
- Response time: 4 hours
- Available: 24/7

**Level 3: Development Team**
- For critical bugs or system errors
- Email: dev-team@university.edu
- Response time: 1 hour (critical issues)

---

**Document Version:** 1.0  
**Last Updated:** February 2025  
**Next Review:** August 2025
