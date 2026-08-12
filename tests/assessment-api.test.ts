import { afterEach, describe, expect, it } from "vitest";
import { POST } from "../src/app/api/assessments/route";

const originalUrl = process.env.SUPABASE_URL;
const originalSecret = process.env.SUPABASE_SECRET_KEY;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalUrl;
  if (originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = originalSecret;
});

describe("assessment API", () => {
  it("generates a report locally without pretending it was persisted", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    const request = new Request("http://localhost/api/assessments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "測試者",
        birthDate: "1989-01-17",
        birthPlace: "台南市",
        businessStatus: "ACTIVE",
        answers: { Q1: "C", Q2: "A", Q3: "C", Q4: "C", Q5: "C", Q6: "B", Q7: "A", Q8: "C", Q9: "A", Q10: "C" },
      }),
    });
    const response = await POST(request);
    const body = await response.json() as { reportId: string; persisted: boolean };
    expect(response.status).toBe(201);
    expect(body.reportId).toMatch(/^SH-\d{8}-[A-F0-9]{6}$/);
    expect(body.persisted).toBe(false);
  });
});
