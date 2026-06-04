import { DurableObject } from "cloudflare:workers";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getAuth } from "./auth.js";
import { put, get } from "@vercel/blob";

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

async function initDatabase(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      username TEXT UNIQUE,
      role TEXT DEFAULT 'user',
      banned INTEGER DEFAULT 0
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      expiresAt INTEGER,
      password TEXT,
      scope TEXT,
      passwordExpired INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      type TEXT,
      category TEXT,
      status TEXT DEFAULT 'ongoing',
      rating REAL DEFAULT 0.0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      chapter_number INTEGER,
      title TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      chapter_id INTEGER,
      last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      chapter_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, book_id, chapter_id),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS book_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS book_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY,
      dark_mode INTEGER DEFAULT 1,
      font_size TEXT DEFAULT 'medium',
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS audios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      audio_url TEXT,
      lyrics TEXT,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_url TEXT,
      video_url TEXT,
      description TEXT,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function handleCors(request) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return headers;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = handleCors(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const dbUrl = env.TURSO_DATABASE_URL;
    const dbToken = env.TURSO_AUTH_TOKEN;

    const client = createClient({ url: dbUrl, authToken: dbToken });
    const db = drizzle(client);

    await initDatabase(client);

    const auth = getAuth(db, env, request);
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/auth/")) {
      const res = await auth.handler(request);
      const newHeaders = new Headers(res.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      });
    }

    if (url.pathname.startsWith("/uploads/")) {
      const path = url.pathname.substring(9);
      const stub = env.MY_DURABLE_OBJECT.getByName("file-store");

      if (request.method === "GET") {
        if (env.BLOB_READ_WRITE_TOKEN) {
          try {
            const blobResult = await get(path, {
              access: "private",
              token: env.BLOB_READ_WRITE_TOKEN
            });
            if (blobResult) {
              const headers = new Headers(corsHeaders);
              headers.set("Content-Type", blobResult.blob.contentType);
              headers.set("X-Content-Type-Options", "nosniff");
              return new Response(blobResult.stream, { headers });
            }
          } catch (e) {
          }
        }

        const file = await stub.getFile(path);
        if (!file) {
          return new Response("Not Found", { status: 404, headers: corsHeaders });
        }
        const headers = new Headers(corsHeaders);
        headers.set("Content-Type", file.mime);
        return new Response(file.data, { headers });
      }

      if (request.method === "POST") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session || !session.user) {
          return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }
        const userRes = await client.execute({
          sql: "SELECT role, banned FROM user WHERE id = ?",
          args: [session.user.id]
        });
        const userRow = userRes.rows[0];
        if (!userRow || userRow.banned === 1 || userRow.role !== "admin") {
          return new Response("Forbidden", { status: 403, headers: corsHeaders });
        }

        const formData = await request.formData();
        const fileData = formData.get("file");
        if (!fileData) {
          return new Response("No file uploaded", { status: 400, headers: corsHeaders });
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const mimeType = fileData.type || "application/octet-stream";

        let uploadUrl = "";
        if (env.BLOB_READ_WRITE_TOKEN) {
          const blob = await put(path, arrayBuffer, {
            access: "private",
            contentType: mimeType,
            token: env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false
          });
          uploadUrl = `/uploads/${path}`;
        } else {
          await stub.uploadFile(path, mimeType, arrayBuffer);
          uploadUrl = `/uploads/${path}`;
        }

        const headers = new Headers(corsHeaders);
        headers.set("Content-Type", "application/json");
        return new Response(JSON.stringify({ success: true, url: uploadUrl }), { headers });
      }
    }

    let sessionUser = null;
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (session && session.user) {
        const userRes = await client.execute({
          sql: "SELECT id, username, role, banned FROM user WHERE id = ?",
          args: [session.user.id]
        });
        const userRow = userRes.rows[0];
        if (userRow) {
          if (userRow.banned === 1 || userRow.banned === true) {
            return new Response("Forbidden", { status: 403, headers: corsHeaders });
          }
          sessionUser = {
            id: userRow.id,
            username: userRow.username,
            role: userRow.role
          };
        }
      }
    } catch (e) {
      console.error("Auth check error:", e);
    }

    function makeUrlsAbsolute(obj, origin) {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "string") {
        if (obj.startsWith("/uploads/")) {
          return `${origin}${obj}`;
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => makeUrlsAbsolute(item, origin));
      }
      if (typeof obj === "object") {
        const newObj = {};
        for (const key in obj) {
          newObj[key] = makeUrlsAbsolute(obj[key], origin);
        }
        return newObj;
      }
      return obj;
    }

    const respondJson = (data, status = 200) => {
      const headers = new Headers(corsHeaders);
      headers.set("Content-Type", "application/json");
      const processedData = makeUrlsAbsolute(data, url.origin);
      return new Response(JSON.stringify(processedData), { status, headers });
    };

    if (url.pathname === "/api/books" && request.method === "GET") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "12");
      const offset = (page - 1) * limit;

      const countRes = await client.execute("SELECT COUNT(*) as total FROM books");
      const total = countRes.rows[0].total || 0;

      const booksRes = await client.execute({
        sql: "SELECT * FROM books ORDER BY created_at DESC LIMIT ? OFFSET ?",
        args: [limit, offset]
      });

      return respondJson({
        books: booksRes.rows,
        total,
        pages: Math.ceil(total / limit)
      });
    }

    if (url.pathname === "/api/books" && request.method === "POST") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const data = await request.json();
      const res = await client.execute({
        sql: "INSERT INTO books (title, author, description, cover_url, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          data.title,
          data.author,
          data.description || "",
          data.cover_url || "",
          data.type || "truyện chữ",
          data.category || "khác",
          data.status || "ongoing"
        ]
      });
      const bookId = Number(res.lastInsertRowid);

      if (data.content) {
        await client.execute({
          sql: "INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, 1, 'Chương 1', ?)",
          args: [bookId, data.content]
        });
      }

      return respondJson({ success: true, bookId });
    }

    if (url.pathname.startsWith("/api/books/")) {
      const pathParts = url.pathname.split("/");
      const bookId = parseInt(pathParts[3]);

      if (isNaN(bookId)) {
        return respondJson({ error: "Invalid Book ID" }, 400);
      }

      if (pathParts.length === 4) {
        if (request.method === "GET") {
          const bookRes = await client.execute({
            sql: "SELECT * FROM books WHERE id = ?",
            args: [bookId]
          });
          if (bookRes.rows.length === 0) {
            return respondJson({ error: "Book not found" }, 404);
          }

          await client.execute({
            sql: "UPDATE books SET views = views + 1 WHERE id = ?",
            args: [bookId]
          });

          const chaptersRes = await client.execute({
            sql: "SELECT id, chapter_number, title, content, created_at FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC, id ASC",
            args: [bookId]
          });

          let isBookmarked = false;
          if (sessionUser) {
            const bookmarkRes = await client.execute({
              sql: "SELECT 1 FROM bookmarks WHERE user_id = ? AND book_id = ? LIMIT 1",
              args: [sessionUser.id, bookId]
            });
            isBookmarked = bookmarkRes.rows.length > 0;
          }

          return respondJson({
            book: bookRes.rows[0],
            chapters: chaptersRes.rows,
            isBookmarked
          });
        }

        if (request.method === "PATCH" || request.method === "PUT") {
          if (!sessionUser || sessionUser.role !== "admin") {
            return respondJson({ error: "Admin access required" }, 403);
          }
          const data = await request.json();
          await client.execute({
            sql: `UPDATE books
                  SET title = ?, author = ?, description = ?, cover_url = ?, type = ?, category = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [
              data.title,
              data.author,
              data.description,
              data.cover_url,
              data.type,
              data.category,
              data.status,
              bookId
            ]
          });
          return respondJson({ success: true });
        }

        if (request.method === "DELETE") {
          if (!sessionUser || sessionUser.role !== "admin") {
            return respondJson({ error: "Admin access required" }, 403);
          }
          await client.execute({
            sql: "DELETE FROM books WHERE id = ?",
            args: [bookId]
          });
          return respondJson({ success: true });
        }
      }

      if (pathParts[4] === "toggle-bookmark" && request.method === "POST") {
        if (!sessionUser) {
          return respondJson({ error: "Unauthorized" }, 401);
        }
        const existing = await client.execute({
          sql: "SELECT 1 FROM bookmarks WHERE user_id = ? AND book_id = ? LIMIT 1",
          args: [sessionUser.id, bookId]
        });

        if (existing.rows.length > 0) {
          await client.execute({
            sql: "DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?",
            args: [sessionUser.id, bookId]
          });
          await client.execute({
            sql: "DELETE FROM book_favorites WHERE user_id = ? AND book_id = ?",
            args: [sessionUser.id, bookId]
          }).catch(() => {});
          return respondJson({ success: true, isBookmarked: false, message: "Đã xóa khỏi thư viện" });
        } else {
          await client.execute({
            sql: "INSERT INTO bookmarks (user_id, book_id, chapter_id) VALUES (?, ?, NULL)",
            args: [sessionUser.id, bookId]
          });
          await client.execute({
            sql: "INSERT OR IGNORE INTO book_favorites (user_id, book_id) VALUES (?, ?)",
            args: [sessionUser.id, bookId]
          }).catch(() => {});
          return respondJson({ success: true, isBookmarked: true, message: "Đã thêm vào thư viện" });
        }
      }

      if (pathParts[4] === "rate" && request.method === "POST") {
        if (!sessionUser) {
          return respondJson({ error: "Unauthorized" }, 401);
        }
        const data = await request.json();
        const rating = parseInt(data.rating);
        const comment = data.comment || "";
        if (isNaN(rating) || rating < 1 || rating > 5) {
          return respondJson({ error: "Rating must be 1-5" }, 400);
        }

        const check = await client.execute({
          sql: "SELECT id FROM book_ratings WHERE user_id = ? AND book_id = ?",
          args: [sessionUser.id, bookId]
        });

        if (check.rows.length > 0) {
          await client.execute({
            sql: "UPDATE book_ratings SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND book_id = ?",
            args: [rating, comment, sessionUser.id, bookId]
          });
        } else {
          await client.execute({
            sql: "INSERT INTO book_ratings (user_id, book_id, rating, comment) VALUES (?, ?, ?, ?)",
            args: [sessionUser.id, bookId, rating, comment]
          });
        }

        const ratingsRes = await client.execute({
          sql: "SELECT rating FROM book_ratings WHERE book_id = ?",
          args: [bookId]
        });
        const sum = ratingsRes.rows.reduce((acc, r) => acc + r.rating, 0);
        const avg = ratingsRes.rows.length > 0 ? (sum / ratingsRes.rows.length) : 0;

        await client.execute({
          sql: "UPDATE books SET rating = ? WHERE id = ?",
          args: [avg, bookId]
        });

        return respondJson({ success: true });
      }

      if (pathParts[4] === "ratings" && request.method === "GET") {
        const ratingsRes = await client.execute({
          sql: "SELECT r.*, u.username FROM book_ratings r JOIN user u ON r.user_id = u.id WHERE r.book_id = ? ORDER BY r.created_at DESC",
          args: [bookId]
        });
        const sum = ratingsRes.rows.reduce((acc, r) => acc + r.rating, 0);
        const avg = ratingsRes.rows.length > 0 ? parseFloat((sum / ratingsRes.rows.length).toFixed(1)) : 0;
        return respondJson({
          ratings: ratingsRes.rows,
          average: avg,
          count: ratingsRes.rows.length
        });
      }
    }

    if (url.pathname === "/api/homepage" && request.method === "GET") {
      const booksRes = await client.execute("SELECT * FROM books ORDER BY created_at DESC LIMIT 8");
      const audiosRes = await client.execute("SELECT * FROM audios ORDER BY created_at DESC LIMIT 8");
      const videosRes = await client.execute("SELECT * FROM videos ORDER BY created_at DESC LIMIT 8");
      return respondJson({
        books: booksRes.rows,
        audios: audiosRes.rows,
        videos: videosRes.rows
      });
    }

    if (url.pathname === "/api/audios" && request.method === "GET") {
      const audiosRes = await client.execute("SELECT * FROM audios ORDER BY created_at DESC");
      return respondJson({ audios: audiosRes.rows });
    }

    if (url.pathname === "/api/audios" && request.method === "POST") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const data = await request.json();
      const res = await client.execute({
        sql: "INSERT INTO audios (title, author, cover_url, audio_url, lyrics) VALUES (?, ?, ?, ?, ?)",
        args: [
          data.title,
          data.author,
          data.cover_url || "",
          data.audio_url || "",
          data.lyrics || ""
        ]
      });
      return respondJson({ success: true, audioId: Number(res.lastInsertRowid) });
    }

    if (url.pathname.startsWith("/api/audios/")) {
      const audioId = parseInt(url.pathname.split("/")[3]);
      if (isNaN(audioId)) {
        return respondJson({ error: "Invalid Audio ID" }, 400);
      }

      if (request.method === "GET") {
        const audioRes = await client.execute({
          sql: "SELECT * FROM audios WHERE id = ?",
          args: [audioId]
        });
        if (audioRes.rows.length === 0) {
          return respondJson({ error: "Audio not found" }, 404);
        }

        await client.execute({
          sql: "UPDATE audios SET views = views + 1 WHERE id = ?",
          args: [audioId]
        });

        let isBookmarked = false;
        if (sessionUser) {
          const bookmarkRes = await client.execute({
            sql: "SELECT 1 FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id IS NULL LIMIT 1",
            args: [sessionUser.id, audioId]
          });
          isBookmarked = bookmarkRes.rows.length > 0;
        }

        return respondJson({
          audio: audioRes.rows[0],
          isBookmarked
        });
      }

      if (request.method === "POST") {
        if (!sessionUser) {
          return respondJson({ error: "Unauthorized" }, 401);
        }
        const existing = await client.execute({
          sql: "SELECT 1 FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id IS NULL LIMIT 1",
          args: [sessionUser.id, audioId]
        });

        if (existing.rows.length > 0) {
          await client.execute({
            sql: "DELETE FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id IS NULL",
            args: [sessionUser.id, audioId]
          });
          return respondJson({ success: true, isBookmarked: false, message: "Đã xóa khỏi thư viện" });
        } else {
          await client.execute({
            sql: "INSERT INTO bookmarks (user_id, book_id, chapter_id) VALUES (?, ?, NULL)",
            args: [sessionUser.id, audioId]
          });
          return respondJson({ success: true, isBookmarked: true, message: "Đã thêm vào thư viện" });
        }
      }
    }

    if (url.pathname === "/api/videos" && request.method === "GET") {
      const videosRes = await client.execute("SELECT * FROM videos ORDER BY created_at DESC");
      return respondJson({ videos: videosRes.rows });
    }

    if (url.pathname === "/api/videos" && request.method === "POST") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const data = await request.json();
      const res = await client.execute({
        sql: "INSERT INTO videos (title, author, cover_url, video_url, description) VALUES (?, ?, ?, ?, ?)",
        args: [
          data.title,
          data.author,
          data.cover_url || "",
          data.video_url || "",
          data.description || ""
        ]
      });
      return respondJson({ success: true, videoId: Number(res.lastInsertRowid) });
    }

    if (url.pathname.startsWith("/api/videos/")) {
      const videoId = parseInt(url.pathname.split("/")[3]);
      if (isNaN(videoId)) {
        return respondJson({ error: "Invalid Video ID" }, 400);
      }

      if (request.method === "GET") {
        const videoRes = await client.execute({
          sql: "SELECT * FROM videos WHERE id = ?",
          args: [videoId]
        });
        if (videoRes.rows.length === 0) {
          return respondJson({ error: "Video not found" }, 404);
        }

        await client.execute({
          sql: "UPDATE videos SET views = views + 1 WHERE id = ?",
          args: [videoId]
        });

        let isBookmarked = false;
        if (sessionUser) {
          const bookmarkRes = await client.execute({
            sql: "SELECT 1 FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id IS NULL LIMIT 1",
            args: [sessionUser.id, videoId]
          });
          isBookmarked = bookmarkRes.rows.length > 0;
        }

        const recommendedRes = await client.execute({
          sql: "SELECT * FROM videos WHERE id != ? ORDER BY views DESC LIMIT 6",
          args: [videoId]
        });

        return respondJson({
          video: videoRes.rows[0],
          isBookmarked,
          recommended: recommendedRes.rows
        });
      }

      if (request.method === "POST") {
        if (!sessionUser) {
          return respondJson({ error: "Unauthorized" }, 401);
        }
        const existing = await client.execute({
          sql: "SELECT 1 FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id IS NULL LIMIT 1",
          args: [sessionUser.id, videoId]
        });

        if (existing.rows.length > 0) {
          await client.execute({
            sql: "DELETE FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id IS NULL",
            args: [sessionUser.id, videoId]
          });
          return respondJson({ success: true, isBookmarked: false, message: "Đã xóa khỏi thư viện" });
        } else {
          await client.execute({
            sql: "INSERT INTO bookmarks (user_id, book_id, chapter_id) VALUES (?, ?, NULL)",
            args: [sessionUser.id, videoId]
          });
          return respondJson({ success: true, isBookmarked: true, message: "Đã thêm vào thư viện" });
        }
      }
    }

    if (url.pathname === "/api/library" && request.method === "GET") {
      if (!sessionUser) {
        return respondJson({ error: "Unauthorized" }, 401);
      }
      const bookmarksRes = await client.execute({
        sql: `SELECT b.id, b.title, b.author, b.cover_url, b.description, b.category, bm.created_at as bookmarked_at
              FROM bookmarks bm
              JOIN books b ON bm.book_id = b.id
              WHERE bm.user_id = ?
              ORDER BY bm.created_at DESC`,
        args: [sessionUser.id]
      });
      return respondJson({ bookmarkedBooks: bookmarksRes.rows });
    }

    if (url.pathname === "/api/library" && request.method === "DELETE") {
      if (!sessionUser) {
        return respondJson({ error: "Unauthorized" }, 401);
      }
      const data = await request.json();
      const bookId = parseInt(data.bookId);
      if (isNaN(bookId)) {
        return respondJson({ error: "Invalid Book ID" }, 400);
      }

      await client.execute({
        sql: "DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?",
        args: [sessionUser.id, bookId]
      });
      return respondJson({ success: true });
    }

    if (url.pathname === "/api/admin/users" && request.method === "GET") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const usersRes = await client.execute("SELECT id, username, email, role, banned, createdAt FROM user ORDER BY createdAt DESC");
      return respondJson({ users: usersRes.rows });
    }

    if (url.pathname === "/api/admin/users/role" && request.method === "POST") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const data = await request.json();
      const targetUserId = data.userId;
      const targetRole = data.role;
      await client.execute({
        sql: "UPDATE user SET role = ? WHERE id = ?",
        args: [targetRole, targetUserId]
      });
      return respondJson({ success: true });
    }


    if (url.pathname === "/api/admin/users/ban" && request.method === "POST") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const data = await request.json();
      const targetUserId = data.userId;
      const banStatus = data.banned ? 1 : 0;
      await client.execute({
        sql: "UPDATE user SET banned = ? WHERE id = ?",
        args: [banStatus, targetUserId]
      });
      return respondJson({ success: true });
    }

    if (url.pathname === "/api/admin/stats" && request.method === "GET") {
      if (!sessionUser || sessionUser.role !== "admin") {
        return respondJson({ error: "Admin access required" }, 403);
      }
      const booksCount = await client.execute("SELECT COUNT(*) as count FROM books");
      const audiosCount = await client.execute("SELECT COUNT(*) as count FROM audios");
      const videosCount = await client.execute("SELECT COUNT(*) as count FROM videos");
      const usersCount = await client.execute("SELECT COUNT(*) as count FROM user");

      return respondJson({
        books: booksCount.rows[0].count,
        audios: audiosCount.rows[0].count,
        videos: videosCount.rows[0].count,
        users: usersCount.rows[0].count
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
