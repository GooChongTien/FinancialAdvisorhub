import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useQuery } from "@tanstack/react-query";

export function useAnalyticsData() {
    const { data: leads = [], isLoading: loadingLeads } = useQuery({
        queryKey: ["analytics", "leads"],
        queryFn: () => adviseUAdminApi.entities.Lead.list("-updated_at", 2000),
    });

    const { data: policies = [], isLoading: loadingPolicies } = useQuery({
        queryKey: ["analytics", "policies"],
        queryFn: () => adviseUAdminApi.entities.Policy.list("-created_at", 2000),
    });

    const { data: proposals = [], isLoading: loadingProposals } = useQuery({
        queryKey: ["analytics", "proposals"],
        queryFn: () => adviseUAdminApi.entities.Proposal.list("-last_updated", 2000),
    });

    return {
        leads,
        policies,
        proposals,
        loading: loadingLeads || loadingPolicies || loadingProposals,
    };
}
