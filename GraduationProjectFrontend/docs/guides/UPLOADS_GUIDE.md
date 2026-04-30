# Uploads Guide

This guide summarizes the current upload behavior for **team documents** and **learning resources**.

## Team Documents

### Who can upload
- Team leaders
- Team members (students)

### Supported document types
- PDF
- DOC / DOCX
- PPT / PPTX
- XLS / XLSX
- ZIP
- TXT

### Size limit
- Configurable via `DOCUMENT_MAX_SIZE_MB` and `NEXT_PUBLIC_DOCUMENT_MAX_SIZE_MB`
- `0` means unlimited

### Notes
- The backend resolves the team automatically from the signed-in student or leader.
- Doctors and TAs can view documents for their supervised teams, but they do not upload team documents from this screen.
- Failed uploads are now cleaned up automatically so invalid submissions do not leave orphan files on the server.
- Replacing or deleting a document also removes the old uploaded file from local storage when the file lives under `/uploads/documents`.

## Learning Resources

### Who can upload
- Doctors
- TAs

### Resource types
- **file**: upload a supported file directly
- **video**: provide a public video URL
- **link**: provide a standard external URL
- **github**: provide a GitHub repository or project URL

### Supported file types for `file`
- PDF
- DOC / DOCX
- PPT / PPTX
- XLS / XLSX
- ZIP
- TXT

### Size limit
- Configurable via `RESOURCE_MAX_SIZE_MB` and `NEXT_PUBLIC_RESOURCE_MAX_SIZE_MB`
- `0` means unlimited

### Notes
- The frontend now uses the exact backend resource types: `file`, `video`, `link`, and `github`.
- Delete actions are shown only to the original doctor or TA who created the resource.
- Failed uploads are cleaned up automatically so rejected files do not remain on disk.
- Replacing or deleting a resource removes the old local file when applicable.

## Troubleshooting Checklist

### A doctor or TA cannot upload a resource
Check that:
1. The resource type matches the content being submitted.
2. File uploads use the **file** type.
3. URL-based resources use a valid `http` or `https` address.
4. If you configured a size limit, the selected file must stay under that limit.
5. The signed-in account is a doctor or TA.

### A student cannot upload a document
Check that:
1. The user belongs to a team.
2. The file extension is one of the supported formats.
3. If you configured a size limit, the file must stay under that limit.
4. The title is at least 3 characters.
5. The description is at least 8 characters.
