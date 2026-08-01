import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getAuth } from "./auth.js";
import { put, get } from "@vercel/blob";
import { initDatabase } from "./database.js";
import { handleCors } from "./cors.js";
import { makeUrlsAbsolute } from "./utils.js";
export { MyDurableObject } from "./durable_object.js";





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
      const origin = request.headers.get("Origin");
      if (origin) {
        newHeaders.set("Access-Control-Allow-Origin", origin);
        newHeaders.set("Access-Control-Allow-Credentials", "true");
      } else {
        newHeaders.set("Access-Control-Allow-Origin", "*");
      }
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
              headers.set("Accept-Ranges", "bytes");
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
        headers.set("Accept-Ranges", "bytes");

        const range = request.headers.get("Range");
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : file.data.byteLength - 1;
          
          if (start >= file.data.byteLength || end >= file.data.byteLength) {
            headers.set("Content-Range", `bytes */${file.data.byteLength}`);
            return new Response(null, { status: 416, headers });
          }
          
          headers.set("Content-Range", `bytes ${start}-${end}/${file.data.byteLength}`);
          headers.set("Content-Length", (end - start + 1).toString());
          const slice = file.data.slice(start, end + 1);
          return new Response(slice, { status: 206, headers });
        }

        headers.set("Content-Length", file.data.byteLength.toString());
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
      const type = url.searchParams.get("type");

      let total = 0;
      let booksRows = [];

      if (type) {
        const isTruyenChu = type === "truyện chữ" || type === "text";
        const countRes = await client.execute({
          sql: isTruyenChu 
            ? "SELECT COUNT(*) as total FROM books WHERE type IN ('truyện chữ', 'text') OR type IS NULL OR type = ''"
            : "SELECT COUNT(*) as total FROM books WHERE type IN ('truyện tranh', 'comic', 'manga')",
          args: []
        });
        total = countRes.rows[0].total || 0;

        const booksRes = await client.execute({
          sql: isTruyenChu
            ? "SELECT * FROM books WHERE type IN ('truyện chữ', 'text') OR type IS NULL OR type = '' ORDER BY created_at DESC LIMIT ? OFFSET ?"
            : "SELECT * FROM books WHERE type IN ('truyện tranh', 'comic', 'manga') ORDER BY created_at DESC LIMIT ? OFFSET ?",
          args: [limit, offset]
        });
        booksRows = booksRes.rows;
      } else {
        const countRes = await client.execute("SELECT COUNT(*) as total FROM books");
        total = countRes.rows[0].total || 0;

        const booksRes = await client.execute({
          sql: "SELECT * FROM books ORDER BY created_at DESC LIMIT ? OFFSET ?",
          args: [limit, offset]
        });
        booksRows = booksRes.rows;
      }

      return respondJson({
        books: booksRows,
        total,
        pages: Math.ceil(total / limit)
      });
    }

    if (url.pathname === "/api/search" && request.method === "GET") {
      const q = url.searchParams.get("q") || "";
      
      let books = [];
      let audios = [];
      let videos = [];
      
      if (q.trim() !== "") {
        const queryPattern = `%${q}%`;
        const booksRes = await client.execute({
          sql: "SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ? LIMIT 50",
          args: [queryPattern, queryPattern, queryPattern]
        });
        books = booksRes.rows;
        
        const audiosRes = await client.execute({
          sql: "SELECT * FROM audios WHERE title LIKE ? OR author LIKE ? LIMIT 50",
          args: [queryPattern, queryPattern]
        });
        audios = audiosRes.rows;
        
        const videosRes = await client.execute({
          sql: "SELECT * FROM videos WHERE title LIKE ? OR author LIKE ? OR description LIKE ? LIMIT 50",
          args: [queryPattern, queryPattern, queryPattern]
        });
        videos = videosRes.rows;
      }
      
      return respondJson({
        books,
        audios,
        videos
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

      if (pathParts[4] === "chapters" && request.method === "POST") {
        if (!sessionUser || sessionUser.role !== "admin") {
          return respondJson({ error: "Admin access required" }, 403);
        }
        const data = await request.json();
        const res = await client.execute({
          sql: "INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, ?, ?, ?)",
          args: [
            bookId,
            data.chapter_number || 1,
            data.title || `Chương ${data.chapter_number || 1}`,
            data.content || ""
          ]
        });
        return respondJson({ success: true, chapterId: Number(res.lastInsertRowid) });
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

    if (url.pathname.startsWith("/api/chapters/")) {
      const pathParts = url.pathname.split("/");
      const chapterId = parseInt(pathParts[3]);

      if (!isNaN(chapterId)) {
        if (request.method === "DELETE") {
          if (!sessionUser || sessionUser.role !== "admin") {
            return respondJson({ error: "Admin access required" }, 403);
          }
          await client.execute({
            sql: "DELETE FROM chapters WHERE id = ?",
            args: [chapterId]
          });
          return respondJson({ success: true });
        }

        if (request.method === "PUT") {
          if (!sessionUser || sessionUser.role !== "admin") {
            return respondJson({ error: "Admin access required" }, 403);
          }
          const data = await request.json();
          await client.execute({
            sql: "UPDATE chapters SET chapter_number = ?, title = ?, content = ? WHERE id = ?",
            args: [
              data.chapter_number,
              data.title,
              data.content,
              chapterId
            ]
          });
          return respondJson({ success: true });
        }
      }
    }

    if (url.pathname === "/api/homepage" && request.method === "GET") {
      const truyenChuRes = await client.execute({
        sql: "SELECT * FROM books WHERE type IN ('truyện chữ', 'text') OR type IS NULL OR type = '' ORDER BY created_at DESC LIMIT 8",
        args: []
      });
      const truyenTranhRes = await client.execute({
        sql: "SELECT * FROM books WHERE type IN ('truyện tranh', 'comic', 'manga') ORDER BY created_at DESC LIMIT 8",
        args: []
      });
      const audiosRes = await client.execute("SELECT * FROM audios ORDER BY created_at DESC LIMIT 8");
      const videosRes = await client.execute("SELECT * FROM videos ORDER BY created_at DESC LIMIT 8");

      const truyenChuCountRes = await client.execute("SELECT COUNT(*) as count FROM books WHERE type IN ('truyện chữ', 'text') OR type IS NULL OR type = ''");
      const truyenTranhCountRes = await client.execute("SELECT COUNT(*) as count FROM books WHERE type IN ('truyện tranh', 'comic', 'manga')");
      const audiosCountRes = await client.execute("SELECT COUNT(*) as count FROM audios");
      const videosCountRes = await client.execute("SELECT COUNT(*) as count FROM videos");

      const truyenChuCount = truyenChuCountRes.rows[0].count || 0;
      const truyenTranhCount = truyenTranhCountRes.rows[0].count || 0;
      const audiosCount = audiosCountRes.rows[0].count || 0;
      const videosCount = videosCountRes.rows[0].count || 0;
      const totalSaved = truyenChuCount + truyenTranhCount + audiosCount + videosCount;

      return respondJson({
        truyenChu: truyenChuRes.rows,
        truyenTranh: truyenTranhRes.rows,
        audios: audiosRes.rows,
        videos: videosRes.rows,
        truyenChuCount,
        truyenTranhCount,
        audiosCount,
        videosCount,
        totalSaved
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
            sql: "SELECT 1 FROM audio_favorites WHERE user_id = ? AND audio_id = ? LIMIT 1",
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
          sql: "SELECT 1 FROM audio_favorites WHERE user_id = ? AND audio_id = ? LIMIT 1",
          args: [sessionUser.id, audioId]
        });

        if (existing.rows.length > 0) {
          await client.execute({
            sql: "DELETE FROM audio_favorites WHERE user_id = ? AND audio_id = ?",
            args: [sessionUser.id, audioId]
          });
          return respondJson({ success: true, isBookmarked: false, message: "Đã xóa khỏi thư viện" });
        } else {
          await client.execute({
            sql: "INSERT INTO audio_favorites (user_id, audio_id) VALUES (?, ?)",
            args: [sessionUser.id, audioId]
          });
          return respondJson({ success: true, isBookmarked: true, message: "Đã thêm vào thư viện" });
        }
      }

      if (request.method === "PUT" || request.method === "PATCH") {
        if (!sessionUser || sessionUser.role !== "admin") {
          return respondJson({ error: "Admin access required" }, 403);
        }
        const data = await request.json();
        await client.execute({
          sql: "UPDATE audios SET title = ?, author = ?, cover_url = ?, audio_url = ?, lyrics = ? WHERE id = ?",
          args: [
            data.title,
            data.author,
            data.cover_url || "",
            data.audio_url || "",
            data.lyrics || "",
            audioId
          ]
        });
        return respondJson({ success: true });
      }

      if (request.method === "DELETE") {
        if (!sessionUser || sessionUser.role !== "admin") {
          return respondJson({ error: "Admin access required" }, 403);
        }
        await client.execute({
          sql: "DELETE FROM audios WHERE id = ?",
          args: [audioId]
        });
        return respondJson({ success: true });
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
            sql: "SELECT 1 FROM video_favorites WHERE user_id = ? AND video_id = ? LIMIT 1",
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
          sql: "SELECT 1 FROM video_favorites WHERE user_id = ? AND video_id = ? LIMIT 1",
          args: [sessionUser.id, videoId]
        });

        if (existing.rows.length > 0) {
          await client.execute({
            sql: "DELETE FROM video_favorites WHERE user_id = ? AND video_id = ?",
            args: [sessionUser.id, videoId]
          });
          return respondJson({ success: true, isBookmarked: false, message: "Đã xóa khỏi thư viện" });
        } else {
          await client.execute({
            sql: "INSERT INTO video_favorites (user_id, video_id) VALUES (?, ?)",
            args: [sessionUser.id, videoId]
          });
          return respondJson({ success: true, isBookmarked: true, message: "Đã thêm vào thư viện" });
        }
      }

      if (request.method === "PUT" || request.method === "PATCH") {
        if (!sessionUser || sessionUser.role !== "admin") {
          return respondJson({ error: "Admin access required" }, 403);
        }
        const data = await request.json();
        await client.execute({
          sql: "UPDATE videos SET title = ?, author = ?, cover_url = ?, video_url = ?, description = ? WHERE id = ?",
          args: [
            data.title,
            data.author,
            data.cover_url || "",
            data.video_url || "",
            data.description || "",
            videoId
          ]
        });
        return respondJson({ success: true });
      }

      if (request.method === "DELETE") {
        if (!sessionUser || sessionUser.role !== "admin") {
          return respondJson({ error: "Admin access required" }, 403);
        }
        await client.execute({
          sql: "DELETE FROM videos WHERE id = ?",
          args: [videoId]
        });
        return respondJson({ success: true });
      }

      const pathParts = url.pathname.split("/");
      if (pathParts[4] === "comments") {
        if (request.method === "GET") {
          const commentsRes = await client.execute({
            sql: `SELECT c.id, c.content, c.created_at, u.username, u.name, u.image
                  FROM video_comments c
                  JOIN user u ON c.user_id = u.id
                  WHERE c.video_id = ?
                  ORDER BY c.created_at DESC`,
            args: [videoId]
          });
          return respondJson({ comments: commentsRes.rows });
        }

        if (request.method === "POST") {
          if (!sessionUser) {
            return respondJson({ error: "Unauthorized" }, 401);
          }
          const data = await request.json();
          const content = data.content || "";
          if (!content.trim()) {
            return respondJson({ error: "Content cannot be empty" }, 400);
          }
          const res = await client.execute({
            sql: "INSERT INTO video_comments (user_id, video_id, content) VALUES (?, ?, ?)",
            args: [sessionUser.id, videoId, content]
          });
          const insertedId = Number(res.lastInsertRowid);
          const commentRes = await client.execute({
            sql: `SELECT c.id, c.content, c.created_at, u.username, u.name, u.image
                  FROM video_comments c
                  JOIN user u ON c.user_id = u.id
                  WHERE c.id = ? LIMIT 1`,
            args: [insertedId]
          });
          return respondJson({ success: true, comment: commentRes.rows[0] });
        }
      }
    }

    if (url.pathname === "/api/library" && request.method === "GET") {
      if (!sessionUser) {
        return respondJson({ error: "Unauthorized" }, 401);
      }
      const bookmarksRes = await client.execute({
        sql: `SELECT b.id, b.title, b.author, b.cover_url, b.description, b.category, b.type, bm.created_at as bookmarked_at
              FROM bookmarks bm
              JOIN books b ON bm.book_id = b.id
              WHERE bm.user_id = ?
              ORDER BY bm.created_at DESC`,
        args: [sessionUser.id]
      });
      const audiosRes = await client.execute({
        sql: `SELECT a.id, a.title, a.author, a.cover_url, a.audio_url, af.created_at as bookmarked_at
              FROM audio_favorites af
              JOIN audios a ON af.audio_id = a.id
              WHERE af.user_id = ?
              ORDER BY af.created_at DESC`,
        args: [sessionUser.id]
      });
      const videosRes = await client.execute({
        sql: `SELECT v.id, v.title, v.author, v.cover_url, v.video_url, v.description, vf.created_at as bookmarked_at
              FROM video_favorites vf
              JOIN videos v ON vf.video_id = v.id
              WHERE vf.user_id = ?
              ORDER BY vf.created_at DESC`,
        args: [sessionUser.id]
      });
      return respondJson({
        bookmarkedBooks: bookmarksRes.rows,
        bookmarkedAudios: audiosRes.rows,
        bookmarkedVideos: videosRes.rows
      });
    }

    if (url.pathname === "/api/library" && request.method === "DELETE") {
      if (!sessionUser) {
        return respondJson({ error: "Unauthorized" }, 401);
      }
      const data = await request.json();
      const id = parseInt(data.id || data.bookId);
      const type = data.type || "book";
      if (isNaN(id)) {
        return respondJson({ error: "Invalid ID" }, 400);
      }

      if (type === "audio") {
        await client.execute({
          sql: "DELETE FROM audio_favorites WHERE user_id = ? AND audio_id = ?",
          args: [sessionUser.id, id]
        });
      } else if (type === "video") {
        await client.execute({
          sql: "DELETE FROM video_favorites WHERE user_id = ? AND video_id = ?",
          args: [sessionUser.id, id]
        });
      } else {
        await client.execute({
          sql: "DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?",
          args: [sessionUser.id, id]
        });
      }
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

    if (url.pathname === "/api/forum/upload" && request.method === "POST") {
      if (!sessionUser) {
        return respondJson({ error: "Unauthorized" }, 401);
      }
      const formData = await request.formData();
      const fileData = formData.get("file");
      if (!fileData) {
        return respondJson({ error: "No file uploaded" }, 400);
      }
      const arrayBuffer = await fileData.arrayBuffer();
      const mimeType = fileData.type || "application/octet-stream";
      const filename = `forum-${sessionUser.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const stub = env.MY_DURABLE_OBJECT.getByName("file-store");
      let uploadUrl = "";
      if (env.BLOB_READ_WRITE_TOKEN) {
        await put(filename, arrayBuffer, {
          access: "private",
          contentType: mimeType,
          token: env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false
        });
        uploadUrl = `/uploads/${filename}`;
      } else {
        await stub.uploadFile(filename, mimeType, arrayBuffer);
        uploadUrl = `/uploads/${filename}`;
      }
      return respondJson({ success: true, url: uploadUrl });
    }

    if (url.pathname === "/api/forum/posts" && request.method === "GET") {
      const pageNum = parseInt(url.searchParams.get("page") || "1");
      const limitNum = parseInt(url.searchParams.get("limit") || "20");
      const offsetNum = (pageNum - 1) * limitNum;
      const currentUserId = sessionUser ? sessionUser.id : "";

      const countRes = await client.execute({
        sql: "SELECT COUNT(*) as total FROM threads WHERE parent_id IS NULL",
        args: []
      });
      const total = countRes.rows[0].total || 0;

      const postsRes = await client.execute({
        sql: `SELECT t.id, t.user_id, t.content, t.media_url, t.parent_id, t.created_at,
                     u.username, u.name, u.image,
                     (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.id) as likes_count,
                     (SELECT COUNT(*) FROM threads WHERE parent_id = t.id) as replies_count,
                     (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.id AND user_id = ?) as is_liked
              FROM threads t
              JOIN user u ON t.user_id = u.id
              WHERE t.parent_id IS NULL
              ORDER BY t.created_at DESC
              LIMIT ? OFFSET ?`,
        args: [currentUserId, limitNum, offsetNum]
      });

      return respondJson({
        posts: postsRes.rows,
        total,
        pages: Math.ceil(total / limitNum)
      });
    }

    if (url.pathname === "/api/forum/posts" && request.method === "POST") {
      if (!sessionUser) {
        return respondJson({ error: "Unauthorized" }, 401);
      }
      const data = await request.json();
      const content = data.content || "";
      const media_url = data.media_url || null;
      const parent_id = data.parent_id || null;

      if (!content.trim() && !media_url) {
        return respondJson({ error: "Content cannot be empty" }, 400);
      }

      const res = await client.execute({
        sql: "INSERT INTO threads (user_id, content, media_url, parent_id) VALUES (?, ?, ?, ?)",
        args: [sessionUser.id, content, media_url, parent_id]
      });

      return respondJson({ success: true, id: Number(res.lastInsertRowid) });
    }

    if (url.pathname.startsWith("/api/forum/posts/")) {
      const pathParts = url.pathname.split("/");
      const postId = parseInt(pathParts[4]);
      if (isNaN(postId)) {
        return respondJson({ error: "Invalid Post ID" }, 400);
      }

      if (pathParts.length === 5) {
        if (request.method === "GET") {
          const currentUserId = sessionUser ? sessionUser.id : "";
          const postRes = await client.execute({
            sql: `SELECT t.id, t.user_id, t.content, t.media_url, t.parent_id, t.created_at,
                         u.username, u.name, u.image,
                         (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.id) as likes_count,
                         (SELECT COUNT(*) FROM threads WHERE parent_id = t.id) as replies_count,
                         (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.id AND user_id = ?) as is_liked
                  FROM threads t
                  JOIN user u ON t.user_id = u.id
                  WHERE t.id = ?`,
            args: [currentUserId, postId]
          });

          if (postRes.rows.length === 0) {
            return respondJson({ error: "Post not found" }, 404);
          }

          const repliesRes = await client.execute({
            sql: `SELECT t.id, t.user_id, t.content, t.media_url, t.parent_id, t.created_at,
                         u.username, u.name, u.image,
                         (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.id) as likes_count,
                         (SELECT COUNT(*) FROM threads WHERE parent_id = t.id) as replies_count,
                         (SELECT COUNT(*) FROM thread_likes WHERE thread_id = t.id AND user_id = ?) as is_liked
                  FROM threads t
                  JOIN user u ON t.user_id = u.id
                  WHERE t.parent_id = ?
                  ORDER BY t.created_at ASC`,
            args: [currentUserId, postId]
          });

          return respondJson({
            post: postRes.rows[0],
            replies: repliesRes.rows
          });
        }

        if (request.method === "DELETE") {
          if (!sessionUser) {
            return respondJson({ error: "Unauthorized" }, 401);
          }
          const check = await client.execute({
            sql: "SELECT user_id FROM threads WHERE id = ?",
            args: [postId]
          });
          if (check.rows.length === 0) {
            return respondJson({ error: "Post not found" }, 404);
          }
          if (check.rows[0].user_id !== sessionUser.id && sessionUser.role !== "admin") {
            return respondJson({ error: "Forbidden" }, 403);
          }
          await client.execute({
            sql: "DELETE FROM threads WHERE id = ?",
            args: [postId]
          });
          return respondJson({ success: true });
        }
      }

      if (pathParts[5] === "like" && request.method === "POST") {
        if (!sessionUser) {
          return respondJson({ error: "Unauthorized" }, 401);
        }
        const check = await client.execute({
          sql: "SELECT 1 FROM thread_likes WHERE user_id = ? AND thread_id = ?",
          args: [sessionUser.id, postId]
        });
        if (check.rows.length > 0) {
          await client.execute({
            sql: "DELETE FROM thread_likes WHERE user_id = ? AND thread_id = ?",
            args: [sessionUser.id, postId]
          });
          return respondJson({ success: true, liked: false });
        } else {
          await client.execute({
            sql: "INSERT INTO thread_likes (user_id, thread_id) VALUES (?, ?)",
            args: [sessionUser.id, postId]
          });
          return respondJson({ success: true, liked: true });
        }
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};

