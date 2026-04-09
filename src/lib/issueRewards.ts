import { rewardsApi } from "@/lib/api";

// Returns number of issues submitted by user in current month
export async function getUserMonthlyIssueCount(userId: string): Promise<number> {
  const { data, error } = await rewardsApi.getMonthly(userId);
  if (error || !data) return 0;
  return data.issue_count;
}

// Mark tokens as claimed for user
export async function claimUserTokens(userId: string, walletAddress: string): Promise<boolean> {
  const { data, error } = await rewardsApi.claim(userId, walletAddress);
  return !error && !!data?.success;
}
