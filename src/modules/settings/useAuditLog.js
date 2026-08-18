import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";

export function useAuditLog(companyId, filters = {}) {
  return useQuery({
    queryKey: ["audit_log", companyId, filters],
    queryFn: async () => {
      let q = supabase
        .from("audit_log")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.entityType) q = q.eq("entity_type", filters.entityType);
      if (filters.action) q = q.eq("action", filters.action);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}