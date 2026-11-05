// Shared z-ai-web-dev-sdk singleton. Server-side only.
import ZAI from "z-ai-web-dev-sdk";

let _zai = null;

export async function getZai() {
  if (_zai) return _zai;
  _zai = await ZAI.create();
  return _zai;
}
