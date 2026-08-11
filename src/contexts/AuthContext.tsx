import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../services/supabase/client";
import { getCurrentCompany } from "../services/companies/companyService";
import type { Company } from "../types/company";

interface AuthContextType {
  user: User | null;
  profile: Company | null;
  loading: boolean;
  accountBlocked: boolean;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Company | null) => void;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountBlocked, setAccountBlocked] = useState(false);

  const clearSession = useCallback(async () => {
    localStorage.removeItem("rejec_pending_company");
    setProfile(null);
    setAccountBlocked(false);
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async (userId?: string) => {
    const id = userId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!id) {
      setProfile(null);
      setAccountBlocked(false);
      return;
    }

    const company = await getCurrentCompany(id).catch(() => null);

    if (!company) {
      const pending = localStorage.getItem("rejec_pending_company");
      if (pending) {
        try {
          const parsed = JSON.parse(pending) as {
            id: string;
            company_name: string;
            cnpj: string;
            email?: string;
            phone?: string;
            city?: string;
            state?: string;
            segment?: string;
            description?: string;
          };
          if (parsed.id === id) {
            await supabase.from("companies").upsert({
              id,
              company_name: parsed.company_name,
              cnpj: parsed.cnpj,
              email: parsed.email ?? null,
              phone: parsed.phone ?? null,
              city: parsed.city ?? null,
              state: parsed.state ?? null,
              segment: parsed.segment ?? null,
              description: parsed.description ?? null,
            });
            localStorage.removeItem("rejec_pending_company");
          }
        } catch {
          localStorage.removeItem("rejec_pending_company");
        }
      }
    }

    const finalCompany = await getCurrentCompany(id).catch(() => null);
    setProfile(finalCompany);
    setAccountBlocked(finalCompany ? !finalCompany.active : false);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        refreshProfile(data.session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile(session.user.id);
      } else {
        setProfile(null);
        setAccountBlocked(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, accountBlocked, refreshProfile, setProfile, clearSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
