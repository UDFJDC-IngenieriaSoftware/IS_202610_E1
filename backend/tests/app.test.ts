import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../src/app";
import { hashPassword, verifyPassword } from "../src/services/auth.service";

async function request(path: string): Promise<Response> {
  const server = createApp().listen(0);
  try {
    const port = (server.address() as AddressInfo).port;
    return await fetch(`http://127.0.0.1:${port}${path}`);
  } finally {
    server.close();
  }
}

test("GET /health exposes service health without a database query", async () => {
  const response = await request("/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "miturno-api" });
});

test("private API resources reject missing authentication", async () => {
  const response = await request("/api/servicios");
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Autenticacion requerida" });
});

test("passwords are salted and verified without storing plain text", () => {
  const first = hashPassword("Demo1234");
  const second = hashPassword("Demo1234");
  assert.notEqual(first, second);
  assert.equal(verifyPassword("Demo1234", first), true);
  assert.equal(verifyPassword("incorrecta", first), false);
});
