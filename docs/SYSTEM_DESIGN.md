# System Design Write-up — Society Maintenance Tracker

## Complaint history model

A complaint's lifecycle is modeled as an **event log, not a status field with
side notes**. The `complaints` table holds only current state (`status`,
`priority`, `resolvedAt`); every transition — including the complaint's own
creation — is a row in `complaint_status_history` (`complaintId`, `status`,
`note`, `actorId`, `actorRole`, `timestamp`). When a resident raises a
complaint, the create call writes both the `complaints` row and its first
history row (`status: OPEN`, note "Complaint raised by resident") in one
Prisma nested-write transaction, so a complaint can never exist without at
least one history entry.

This design was chosen over two alternatives. A single `status` column with a
separate free-text `notes` field would lose *who* changed what *when* — the
brief explicitly asks for timestamp, actor, and note per change, which only
makes sense as a table, not a scalar. An embedded JSON array of history
events (natural in a document DB) was rejected because the admin's primary
queries — filter by status/category/date, count by status for the dashboard —
are relational aggregations that Postgres does natively with indexes and
`GROUP BY`, and an audit trail is exactly the kind of append-only, queried-by-
foreign-key data a normalized child table is built for. `actorRole` is
denormalized onto each history row (rather than joined from `users.role` at
read time) so the audit trail stays accurate even if a user's role changes
later — a permanent record shouldn't silently rewrite itself.

`GET /complaints/:id` returns the complaint with its full history ordered by
timestamp; both the resident's detail view and the admin's detail view render
it as the same timeline component, so residents see the exact record admins
are writing, not a derived summary.

## Overdue detection

Overdue is a **derived, not stored** property. Storing an `isOverdue` boolean
would need a cron job or a write-time recomputation, and would immediately go
stale the moment an admin changes the configurable threshold — every open
complaint would need a backfill. Instead, `isOverdue` is computed at read time
from `createdAt` and the current threshold: `(now - createdAt) > thresholdDays`,
and only for complaints not yet `RESOLVED` (a closed complaint is never
overdue, regardless of age). The threshold itself lives in a singleton
`settings` row rather than only an environment variable, so an admin can
change it from the Settings page and have every complaint list, and the
dashboard's overdue count, reflect it on the very next request — no redeploy.

The admin's complaint list sorts overdue complaints to the top, as required.
Because "overdue" isn't a database column, this final ordering (overdue
first, then by priority, then newest) happens in application code after a
straightforward `createdAt DESC` query — a deliberate simplification that
trades a marginally more complex SQL query for much simpler, more readable
logic, which is a fair trade at the row counts a single society will ever
produce (hundreds, not millions, of complaints).

## Photo handling

Complaint photos are uploaded directly to Cloudinary via `multer` with
`multer-storage-cloudinary` as the storage engine — the file never touches
the API server's disk. This matters because the backend is deployed on
Render/Railway-style platforms where the filesystem is ephemeral: anything
written locally disappears on the next deploy or restart. Cloudinary also
applies a server-side transformation on upload (capped to 1600×1600,
`quality: auto`) so a resident's 12MB phone photo doesn't bloat storage or
slow down the admin's list view, which renders a thumbnail. Only the
resulting secure URL and Cloudinary `public_id` are stored on the
`complaints` row; the `public_id` is kept (though not currently exposed via
an API) so a future "delete complaint" feature could clean up the Cloudinary
asset rather than leaving it orphaned.

## Notification flow

Two events trigger email via Nodemailer/Gmail: a complaint's status changing,
and a new notice being posted with `isImportant: true`. Both are sent
synchronously inside the same request that caused them (not queued), which
keeps the system simple and appropriate for a single society's volume, at the
cost of the HTTP response waiting on an SMTP round-trip. Failures are caught
and logged rather than thrown — a broken mail provider must never roll back
or fail the underlying status update or notice post, since email is a
notification of a fact, not the fact itself. For an important notice, the
API fetches all residents and emails each one; at society scale (tens to low
hundreds of flats) this is a handful of sequential-ish `Promise.all` sends,
not a bulk-mail problem requiring a queue.
