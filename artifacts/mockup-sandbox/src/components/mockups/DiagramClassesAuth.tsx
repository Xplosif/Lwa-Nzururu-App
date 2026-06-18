import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
classDiagram
    class User {
        +int id
        +string username
        +string passwordHash
        +string fullName
        +string role
        +boolean isFirstLogin
        +string tempUsername
        +string tempPassword
        +int classId
        +login(username, password) Session
        +logout() void
        +changePassword(current, newPwd) void
        +changeUsername(newUsername) void
        +setupFirstAccess(fullName, username, pwd) void
    }
    class Session {
        +string sessionId
        +int userId
        +string role
        +Date createdAt
        +isValid() boolean
        +invalidate() void
    }
    class AuthMiddleware {
        +requireAuth(roles[]) Middleware
        +hashPassword(plain) hash
        +verifyPassword(plain, hash) boolean
        +generateTempCredentials() Credentials
    }
    class Role {
        <<enumeration>>
        PROVISEUR
        TITULAIRE
        ENSEIGNANT
        SECRETAIRE
        PARENT
    }
    class SessionStore {
        -Map sessions
        +set(id, data) void
        +get(id) Session
        +delete(id) void
    }

    User "1" --> "0..1" Session : cree
    User --> Role : possede
    AuthMiddleware --> SessionStore : consulte
    AuthMiddleware --> User : authentifie
    SessionStore "1" --> "0..*" Session : stocke
`;

export default function DiagramClassesAuth() {
  return <DiagramPage title="Diagramme de classes — Module Authentification" subtitle="Users, Sessions, Roles, Middleware" diagram={D} />;
}
