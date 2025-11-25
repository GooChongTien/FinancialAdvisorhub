import { HttpResponse, http } from "msw";

const customers = [
  { id: "cust-1", name: "Acme Corp", temperature: "hot" },
  { id: "cust-2", name: "Globex", temperature: "warm" },
];

let unstableCallCount = 0;

export const handlers = [
  http.get("https://api.test.local/customers", () => {
    return HttpResponse.json(customers);
  }),

  http.post("https://api.test.local/customers", async ({ request }) => {
    const body = await request.json();
    const created = { id: `cust-${customers.length + 1}`, ...body };
    customers.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("https://api.test.local/unstable", () => {
    unstableCallCount += 1;
    if (unstableCallCount === 1) {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json({ ok: true, attempts: unstableCallCount });
  }),

  http.get("https://api.test.local/slow", async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return HttpResponse.json({ ok: true });
  }),
];

export function resetUnstableCounter() {
  unstableCallCount = 0;
}
