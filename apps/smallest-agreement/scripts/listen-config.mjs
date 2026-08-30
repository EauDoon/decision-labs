export const DEFAULT_PORT = 4173;
export const BIND_HOST = "127.0.0.1";

function portValue(value) {
  if (!/^(?:[1-9][0-9]{0,4})$/.test(value)) return null;
  const port = Number(value);
  return port <= 65535 ? port : null;
}

export function parsePort(raw) {
  if (raw === undefined) return { port: DEFAULT_PORT };
  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return { error: `PORT is empty. Omit it to use ${DEFAULT_PORT}, or set an integer from 1 through 65535.` };
  }
  const port = portValue(trimmed);
  if (port === null) return { error: "PORT must be an integer from 1 through 65535." };
  return { port };
}
