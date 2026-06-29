# API Overview

This document describes the current backend API contract at a high level.

## General Rules

- API base path: `/api/`.
- Authentication: JWT bearer access tokens from `/api/users/login/`; refresh through `/api/users/login/refresh/`.
- Most list endpoints return arrays. There is no global pagination or filter backend.
- Normal data access is company-scoped. Superusers can access broader data only where the view explicitly supports it.
- The backend root path does not expose an API index. Use `/health/` for health checks.

## Auth and Users

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `POST /api/users/register/` | Create a user | Manager or superuser |
| `POST /api/users/login/` | Obtain JWT pair | Public |
| `POST /api/users/login/refresh/` | Refresh access token | Public |
| `POST /api/users/login/verify/` | Verify access token | Public |
| `POST /api/users/logout/` | Blacklist refresh token | Authenticated |
| `GET/PATCH /api/users/profile/` | Current user profile | Authenticated |
| `GET /api/users/list/` | List manageable users | Manager or superuser |
| `PATCH /api/users/update-role/<id>/` | Update user role | Manager or superuser |
| `GET/PATCH/DELETE /api/users/manage/<id>/` | Manage a user | Manager or superuser |

Managers are limited to their own company and can manage workers or clients. Superusers can manage users across companies.

## Companies

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET/POST /api/companies/` | List or create companies | Superuser |
| `GET/PATCH/DELETE /api/companies/<slug>/` | Manage one company | Superuser |

Companies are addressed by slug.

## Teams

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/teams/` | List visible teams | Authenticated |
| `POST /api/teams/` | Create a team | Manager or superuser |
| `GET /api/teams/<id>/` | Retrieve a team | Authenticated if visible |
| `PATCH/DELETE /api/teams/<id>/` | Update or delete a team | Manager or superuser |

Teams belong to a company. Team members must be workers from the same company. Team names are unique per company.

## Projects

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/projects/` | List visible projects | Authenticated |
| `POST /api/projects/` | Create a project | Manager or superuser |
| `GET /api/projects/<id>/` | Retrieve a project | Authenticated if visible |
| `PATCH /api/projects/<id>/` | Update a project | Manager, superuser, or worker status-only update |
| `DELETE /api/projects/<id>/` | Delete a project | Manager or superuser |
| `DELETE /api/projects/<id>/blueprint/` | Remove project blueprint | Manager or superuser |

Project clients and assigned teams must belong to the project company. Clients have read-only access to their own projects. Workers see assigned projects. Blueprint uploads accept PDF files.

## Worklogs

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/worklogs/` | List visible worklogs | Worker, manager, or superuser |
| `POST /api/worklogs/` | Create a worklog | Worker, manager, or superuser |
| `GET/PATCH/DELETE /api/worklogs/<id>/` | Manage one worklog | Owner worker, manager, or superuser |

Workers are limited to their own worklogs. Managers are limited to their company. Clients cannot use worklog endpoints. `?project=<id>` filters by project.

## Chat

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/chats/messages/?room=<room_id>` | List room messages | Project-visible users |
| `POST /api/chats/messages/` | Send a message | Project-visible users |
| `GET/PATCH/DELETE /api/chats/messages/<id>/` | Retrieve, edit, or delete a message | Sender can edit/delete |

REST chat uses chat room IDs. The backend also exposes `ws/chat/<project_id>/` for project chat, with bearer-token authentication expected in the WebSocket `Authorization` header.

## Finance

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/finances/payments/manager/` | List the manager's company payments | Manager |
| `POST /api/finances/payments/manager/` | Create a payment and Stripe checkout session | Manager |
| `GET/PATCH/DELETE /api/finances/payments/manager/<id>/` | Manage a payment | Manager |
| `GET /api/finances/payments/` | List current user's visible payments | Client, manager, or superuser |
| `GET /api/finances/salaries/worker/` | List current worker salaries | Worker or superuser |
| `GET/POST /api/finances/salaries/manager/` | List or create salaries | Manager |
| `GET/PATCH/DELETE /api/finances/salaries/manager/<id>/` | Manage a salary | Manager |
| `GET/POST /api/finances/transactions/` | List or create transactions | Manager or superuser |
| `GET/PATCH/DELETE /api/finances/transactions/<id>/` | Manage a transaction | Manager or superuser |
| `GET/POST /api/finances/reports/` | Read or refresh current company report | Manager or superuser |
| `GET /api/finances/reports/<id>/` | Retrieve a report | Manager or superuser |
| `POST /api/finances/webhooks/stripe/` | Receive Stripe events | Stripe signature required |

Financial reports represent the current company summary and expose currency-aware totals through `totals_by_currency`.

## Notifications

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/notifications/` | List current user notifications | Authenticated |
| `GET /api/notifications/unread-count/` | Count unread notifications | Authenticated |
| `PATCH /api/notifications/<id>/mark-read/` | Mark one notification as read | Owner |
| `PATCH /api/notifications/mark-all-read/` | Mark all current user notifications as read | Authenticated |

Notifications are scoped to the current user and company.

## Reviews

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/reviews/` | List visible reviews | Authenticated |
| `POST /api/reviews/` | Create a project review | Client |
| `GET /api/reviews/<id>/` | Retrieve a review | Authenticated if visible |
| `PATCH/DELETE /api/reviews/<id>/` | Update or delete a review | Review author |

Clients can review their own projects. Managers, workers, and superusers can read reviews for projects they are allowed to see.

## Media and File URLs

Project blueprint URLs may point to local media in Docker or to S3, depending on `USE_S3_STORAGE`. Frontend code should treat returned file URLs as API-provided media URLs and should not assume S3 is always enabled.
