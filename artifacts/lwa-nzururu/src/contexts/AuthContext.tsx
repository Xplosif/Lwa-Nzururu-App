import { createContext, useContext, useState, type ReactNode } from "react";
import { useGetMe } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: "proviseur" | "enseignant" | "titulaire" | "secretaire";
  classId?: number | null;
  className?: string | null;
  isFirstLogin: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userOverride, setUserOverride] = useState<AuthUser | null | "unset">("unset");

  const { data, isLoading } = useGetMe({
    query: {
      retry: false,
      throwOnError: false,
    } as any,
  });

  const user: AuthUser | null =
    userOverride !== "unset" ? userOverride : (data as AuthUser | undefined) ?? null;

  const setUser = (u: AuthUser | null) => setUserOverride(u);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading: isLoading && userOverride === "unset" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
