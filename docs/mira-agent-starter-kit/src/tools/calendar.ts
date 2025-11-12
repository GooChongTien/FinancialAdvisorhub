export async function createEvent({ start_at, location }: { start_at:string, location?:string }) {
  return { id: "cal_123", start_at, location };
}
