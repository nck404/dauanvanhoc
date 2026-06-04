<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let books = $state([]);
    let deletingId = $state(null);
    let errorMsg = $state("");

    function formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    }

    function getCoverSrc(book) {
        const src = (book?.cover_url || book?.cover || "").toString().trim();
        return src || "/placeholder-book.jpg";
    }

    function handleCoverError(e) {
        const img = e.currentTarget;
        if (img && img.src && !img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = "/placeholder-book.jpg";
        }
    }

    function getTypeLabel(type) {
        switch (type) {
            case "text": return "Truyện chữ";
            case "manga": return "Truyện tranh";
            case "video": return "Video";
            case "audio": return "Audio";
            case "vn": return "Visual Novel";
            default: return type || "Chưa phân loại";
        }
    }

    async function loadBooks() {
        try {
            const res = await apiFetch("/api/books?limit=100");
            if (res.ok) {
                const data = await res.json();
                books = data.books || [];
            }
        } catch (e) {
            console.error(e);
        }
    }

    onMount(() => {
        loadBooks();
    });

    async function deleteBook(bookId, bookTitle) {
        if (!confirm(`Bạn có chắc muốn xóa "${bookTitle}"?`)) return;
        deletingId = bookId;
        try {
            const res = await apiFetch(`/api/books/${bookId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                await loadBooks();
            } else {
                errorMsg = "Không thể xóa tác phẩm này";
            }
        } catch (e) {
            errorMsg = "Lỗi kết nối";
        } finally {
            deletingId = null;
        }
    }
</script>

<div class="admin-container">
    <div class="header">
        <h1>Quản lý tác phẩm <span class="title-count">{books.length}</span></h1>
        <a href="/admin/add-book" class="modern-add-btn">
            <i class="bx bx-plus"></i> Thêm tác phẩm mới
        </a>
    </div>

    {#if errorMsg}
        <div class="error-banner">{errorMsg}</div>
    {/if}

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Bìa</th>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Thể loại</th>
                    <th>Loại</th>
                    <th>Ngày tạo</th>
                    <th class="actions">Thao tác</th>
                </tr>
            </thead>
            <tbody>
                {#each books as book}
                    <tr>
                        <td>
                            <img
                                src={getCoverSrc(book)}
                                alt={book.title}
                                class="mini-cover"
                                onerror={handleCoverError}
                            />
                        </td>
                        <td class="book-title">{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.category || "N/A"}</td>
                        <td>
                            <span class="type-badge {book.type}">
                                {getTypeLabel(book.type)}
                            </span>
                        </td>
                        <td>{formatDate(book.created_at)}</td>
                        <td class="actions">
                            <div class="action-group">
                                <a
                                    href={`/admin/edit-book/${book.id}`}
                                    class="icon-btn edit"
                                >
                                    <i class="bx bx-edit-alt"></i>
                                </a>
                                <button
                                    type="button"
                                    class="icon-btn delete"
                                    onclick={() => deleteBook(book.id, book.title)}
                                    disabled={deletingId === book.id}
                                >
                                    {#if deletingId === book.id}
                                        <i class="bx bx-loader-alt bx-spin"></i>
                                    {:else}
                                        <i class="bx bx-trash"></i>
                                    {/if}
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
                {#if books.length === 0}
                    <tr>
                        <td colspan="7" class="empty">
                            Chưa có tác phẩm nào trong kho
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    .admin-container {
        padding: 40px;
        max-width: 1200px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
    }

    .header h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 28px;
        font-weight: 800;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .title-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        color: #64748b;
        font-size: 14px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        -webkit-text-fill-color: #64748b;
        border: 1px solid #e2e8f0;
    }

    .modern-add-btn {
        text-decoration: none;
        padding: 10px 20px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #ffffff;
        box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2), 0 2px 4px -1px rgba(220, 38, 38, 0.1);
        transition: all 0.2s ease;
    }

    .modern-add-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px -2px rgba(220, 38, 38, 0.3), 0 3px 6px -2px rgba(220, 38, 38, 0.2);
    }

    .table-container {
        background: white;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
        border: 1px solid #f1f5f9;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    thead {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
    }

    th {
        padding: 16px 24px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        font-weight: 700;
    }

    td {
        padding: 16px 24px;
        vertical-align: middle;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
        color: #334155;
    }

    .mini-cover {
        width: 40px;
        height: 56px;
        border-radius: 6px;
        object-fit: cover;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .book-title {
        font-weight: 600;
        color: #1e293b;
    }

    .type-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        display: inline-block;
        text-align: center;
    }

    .type-badge.text {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }
    .type-badge.manga {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    .type-badge.video {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }
    .type-badge.audio {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
    }
    .type-badge.vn {
        background: rgba(236, 72, 153, 0.1);
        color: #ec4899;
    }

    .actions {
        text-align: right;
    }

    .action-group {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 18px;
        background: #ffffff;
        color: #64748b;
        text-decoration: none;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .icon-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    }

    .icon-btn.edit:hover {
        color: #3b82f6;
        border-color: #bfdbfe;
        background: #f0f9ff;
    }

    .icon-btn.delete:hover {
        color: #ef4444;
        border-color: #fca5a5;
        background: #fef2f2;
    }

    .empty {
        text-align: center;
        padding: 60px !important;
        color: #94a3b8;
        font-style: italic;
    }

    .error-banner {
        background: #fee2e2;
        color: #ef4444;
        padding: 12px 20px;
        border-radius: 12px;
        margin-bottom: 24px;
        font-weight: 600;
    }
</style>
