// Shared z-ai-web-dev-sdk singleton. The SDK must only be used on the
// server; importing from this module keeps the boundary explicit.
import ZAI from "z-ai-web-dev-sdk";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZai() {
  if (_zai) return _zai;
  _zai = await ZAI.create();
  return _zai;
}
