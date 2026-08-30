export const DEFAULT_PORT = 4173;
export const DEFAULT_HOST = "127.0.0.1";

export function parsePort(raw) {
  if (raw === undefined) return { port: DEFAULT_PORT };
  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return { error: `PORT is empty. Omit it to use ${DEFAULT_PORT}, or set an integer from 1 through 65535.` };
  }
  if (!/^[1-9]\d{0,4}$/.test(trimmed)) {
    return { error: "PORT must be an integer from 1 through 65535." };
  }
  const port = Number(trimmed);
  if (!Number.isInteger(port) || port > 65535) {
    return { error: "PORT must be an integer from 1 through 65535." };
  }
  return { port };
}
