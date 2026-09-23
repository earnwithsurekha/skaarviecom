# Live Chat

SKAARVI live chat uses Socket.IO with JWT authentication and MySQL-backed message history.

## Local setup

1. Configure the backend database and JWT environment variables.
2. Run `npm run migrate:chat` from the `backend` directory.
3. Start the backend on port 5000 and the frontend on port 3000.
4. Sign in as a customer, reseller, or manufacturer to use the floating chat button.
5. Sign in as an admin and open `/admin/live-chat` to reply.

## Customer support accounts

Create or update a support agent from the `backend` directory by setting `SUPPORT_EMAIL`, `SUPPORT_PASSWORD`, and `SUPPORT_MOBILE`, then run `npm run create:support-user`. Support agents sign in at `/customersupport` and can access the live-chat and read-only order workspaces. The Orders view includes customer, payment, delivery, item, and fulfilling-manufacturer details; order updates and cancellations remain admin-only. Administrators continue to monitor the same conversations at `/admin/live-chat`, including the email of the support agent who sent each reply.

## Production

Socket.IO uses `/api/socket.io`, which must route to the backend and support WebSocket upgrades. The current `/api/*` ALB rule provides that routing. The backend Docker image runs the idempotent chat migration before starting the server.

The in-process Socket.IO adapter supports one backend task. Before scaling the backend beyond one task, configure a shared Socket.IO adapter such as Redis so rooms and broadcasts work across tasks.