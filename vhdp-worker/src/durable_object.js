import { DurableObject } from "cloudflare:workers";

const CHUNK_SIZE = 65536;

export class MyDurableObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async uploadFile(path, mimeType, data) {
    const meta = { mime: mimeType, size: data.byteLength };
    await this.ctx.storage.put(`meta:${path}`, meta);

    const totalChunks = Math.ceil(data.byteLength / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, data.byteLength);
      const chunk = data.slice(start, end);
      await this.ctx.storage.put(`chunk:${path}:${i}`, chunk);
    }
    return { success: true, path };
  }

  async getFile(path) {
    const meta = await this.ctx.storage.get(`meta:${path}`);
    if (!meta) return null;

    const totalChunks = Math.ceil(meta.size / CHUNK_SIZE);
    const chunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = await this.ctx.storage.get(`chunk:${path}:${i}`);
      if (chunk) chunks.push(chunk);
    }

    const merged = new Uint8Array(meta.size);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return { mime: meta.mime, data: merged.buffer };
  }

  async deleteFile(path) {
    const meta = await this.ctx.storage.get(`meta:${path}`);
    if (!meta) return false;

    await this.ctx.storage.delete(`meta:${path}`);
    const totalChunks = Math.ceil(meta.size / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      await this.ctx.storage.delete(`chunk:${path}:${i}`);
    }
    return true;
  }
}
