# Model Icon Upload Design

## Decision

Use the existing model `icon` field for either an `@lobehub/icons` key or a
server-relative model-icon URL. The administrator model drawer keeps the icon
key input and adds a file picker with preview and clear actions.

## Upload contract

- `POST /api/models/icon` (administrator authentication required)
- multipart field: `file`
- accepted formats: PNG, JPEG, WEBP
- maximum size: 2 MiB
- response: `{ success: true, data: { url: "/model-icons/<generated-name>" } }`
- generated names are UUID-based and never use the client filename

Uploaded bytes are stored in `/data/model-icons`, which is already covered by
the new-api data volume. The public `GET /model-icons/<name>` route serves only
that directory. The model record stores the relative URL, not an absolute
origin, so the value remains valid behind Nginx and across environments.

## Frontend behavior

- Selecting a valid file uploads it immediately and previews the returned URL.
- Upload errors leave the existing icon value unchanged.
- Clearing the preview restores an empty icon value; the existing icon key can
  still be entered at any time.
- URL-backed icons render as images; all other values continue through the
  existing LobeHub icon resolver.

## Security and compatibility

- Admin middleware protects the upload endpoint.
- MIME type is sniffed from file bytes and checked against the allow-list.
- The filename is generated server-side and path traversal is impossible.
- Existing model CRUD remains JSON-only and unchanged.
- No existing uploaded file is deleted during an edit, avoiding accidental
  breakage for models that still reference it.

## Verification

- Go unit tests cover invalid MIME, oversize input, generated URL, and file
  persistence.
- Frontend tests cover URL icon rendering and upload API payload shape.
- Run the frontend build and Go tests before publishing the GitHub artifact.
