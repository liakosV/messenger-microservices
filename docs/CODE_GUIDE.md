# Code guide

Use this map to find the responsibilities of the backend classes and frontend modules. Paths below are relative to each module's source directory.

## Identity service

Java package: `com.project.messenger.identity`.

| Class / group | Responsibility |
| --- | --- |
| `IdentityServiceApplication` | Starts Spring Boot and enables JPA auditing. |
| `model/User` | Persists account data, UUID, audit timestamps and soft-delete state. |
| `repository/UserRepository` | Queries account identifiers, active users and participant counts. |
| `mapper/UserMapper` | Converts registration/profile DTOs to entities and exposes safe read DTOs. |
| `service/UserService` | Registers users, checks duplicates, updates profiles, confirms deletion passwords and validates active participants. |
| `service/AuthService` | Resolves username/email/phone login, verifies BCrypt credentials and requests an access token. |
| `security/jwt/JwtService` | Issues signed tokens with the user's UUID as subject and configured expiry. |
| `config/JwtProperties` | Validates external RSA resources, issuer and token lifetime configuration. |
| `config/JwtConfig` | Loads and checks RSA keys; provides encoder, decoder, claim validation and clock. |
| `config/PasswordEncoderConfig` | Provides the BCrypt password encoder. |
| `config/SecurityConfig` | Defines public authentication/documentation routes and protected API access. |
| `config/OpenApiConfig` | Configures API metadata and Swagger bearer authentication. |
| `controller/AuthController` | Exposes registration and login HTTP endpoints. |
| `controller/UserController` | Exposes GET/PATCH/DELETE for the authenticated user's profile. |
| `controller/ParticipantValidationController` | Returns a boolean active-participant result for identity checks. |
| `controller/ApiExceptionHandler` | Converts validation, domain and unexpected errors to safe problem responses. |
| `dto/authentication/LoginRequestDTO`, `AuthResponseDTO` | Login input and token response contracts. |
| `dto/user/UserInsertDTO`, `UserUpdateDTO`, `UserReadDTO` | Validated registration, partial profile update and safe profile output. |
| `dto/user/DeleteUserRequest` | Password confirmation for account deactivation. |
| `dto/user/ParticipantValidationRequest`, `ParticipantValidationResponse` | Bounded UUID input and boolean validation output. |
| `core/exception/AppGenericException` | Base domain exception carrying an application error code. |
| `AppObjectAlreadyExistsException`, `AppObjectNotFoundException`, `AppObjectUnauthorizedException` | Duplicate, missing account and authorization failure signals. |

`db/migration/V1__create_users.sql` creates the identity schema. Tests are grouped by service, controller and JWT behavior; `JwtTestSupport` creates in-memory test signing material. `IdentityServiceApplicationTests` checks startup with external configuration.

## Chat service

Java package: `com.project.messenger.chat`.

| Class / group | Responsibility |
| --- | --- |
| `ChatServiceApplication` | Starts Spring Boot and enables JPA auditing. |
| `model/ChatEntity` | Shared database identity, UUID and audit timestamps. |
| `model/Conversation` | Stores creator UUID, membership and the participant-set deduplication key. |
| `model/Message` | Stores a message's conversation, sender UUID and text. |
| `repository/ConversationRepository` | Loads conversations by UUID, participant or participant key, including locked mutation queries. |
| `repository/MessageRepository` | Loads paginated history and messages scoped to their conversation. |
| `mapper/ChatMapper` | Converts persisted conversations/messages into API DTOs. |
| `service/ConversationService` | Validates participants, reuses matching conversations and enforces membership, leaving and creator-only deletion. |
| `service/MessageService` | Enforces participant/sender rules, persists message changes and publishes events. |
| `security/ActiveUserVerifier` | Calls identity with the caller's token to verify active accounts and participants; handles timeouts and unavailable identity. |
| `security/ActiveUserFilter` | Applies active-account verification to protected REST requests. |
| `config/JwtConfig` | Validates RS256 tokens using identity's public key, issuer and required claims. |
| `config/SecurityConfig` | Configures REST security and the WebSocket handshake route. |
| `config/WebSocketConfig` | Registers the socket handler and allowed origins. |
| `config/OpenApiConfig` | Adds Swagger metadata and bearer authentication. |
| `controller/ConversationController` | Exposes create/list/get/delete/leave conversation endpoints. |
| `controller/MessageController` | Exposes send/list/edit/delete message endpoints. |
| `controller/ApiExceptionHandler` | Maps domain, validation and unexpected errors to problem responses. |
| `core/ChatException` | Carries domain failures with their HTTP status. |
| `dto/ConversationInsertDTO`, `ConversationReadDTO` | Participant input and conversation output. |
| `dto/MessageWriteDTO`, `MessageReadDTO` | Bounded message text input and message output. |
| `dto/PageDTO` | Consistent page content and pagination metadata. |
| `websocket/ChatEvent` | Message-change payload and intended participant UUIDs. |
| `websocket/ChatWebSocketHandler` | Authenticates sockets, manages their lifecycle and delivers authorized message events after transaction commit. |

`db/migration/V1__create_chat_tables.sql` creates chat-owned tables. Tests cover service rules, HTTP ownership, identity availability, repository metadata and WebSocket authorization. `ChatServiceApplicationTests` checks startup with external configuration.

## Frontend

| Module | Responsibility |
| --- | --- |
| `src/main.tsx`, `src/app/App.tsx` | Mount React and choose authentication/loading/workspace views. |
| `features/auth/api/authApi.ts` | Registration and login HTTP contracts. |
| `features/auth/hooks/useSession.ts` | Session restoration, profile loading, logout and expiry. |
| `features/auth/hooks/useAuthForm.ts` | Authentication form state and submission. |
| `features/auth/model/session.ts` | Session storage policy and session types. |
| `AuthScreen`, `AuthStory`, `RegistrationFields` | Authentication page, explanatory content and registration inputs. |
| `features/profile/api/profileApi.ts` | Read, patch and deactivate the current account. |
| `useProfileForm`, `profilePatch`, `ProfileModal` | Manage profile edits, select changed fields and display the profile dialog. |
| `conversationApi`, `messageApi` | Conversation and message REST operations. |
| `chatSocket` | First-frame bearer authentication, events, reconnection and socket cleanup. |
| `useConversations`, `useMessages` | Pagination, mutations and reconciliation of loaded chat data. |
| `useChatRealtime`, `useChatWorkspace` | Connect live events and coordinate workspace state. |
| `useMessageComposer`, `useNewConversation` | Draft/edit submission and participant-based conversation creation. |
| `features/chat/model`, `config.ts` | DTO types, UUID validation, merge helpers, page sizes and polling interval. |
| `ChatWorkspace`, `ActiveConversation`, `EmptyWorkspace` | Main workspace and selected/empty conversation views. |
| `NavigationRail`, `ConversationSidebar`, `ConversationListItem` | Workspace navigation and conversation selection. |
| `ChatHeader`, `ConnectionBar` | Selected conversation actions and realtime connection status. |
| `MessageList`, `MessageBubble`, `MessageComposer` | History rendering, message actions and drafting. |
| `NewConversationModal`, `MembersModal` | Participant entry and conversation membership display. |
| `shared/api/client.ts`, `types.ts` | HTTP transport, bearer headers, API errors and shared page contracts. |
| `shared/components` | Reusable brand, avatar, UUID copy, notice, modal and confirmation controls. |
| `shared/hooks/useConfirmation.ts`, `shared/utils` | Confirmation state, date/UUID formatting and readable errors. |
| `styles` | Shared design, authentication/workspace/messages/dialog layouts and responsive overrides. |
| `vite.config.ts`, `vitest.config.ts`, `scripts/proxy.test.mjs` | Development/build proxy, test configuration and HTTP/WebSocket proxy verification. |

See [frontend/ARCHITECTURE.md](../frontend/ARCHITECTURE.md) for the detailed component → hook → API flow and guidance on where to make changes.
