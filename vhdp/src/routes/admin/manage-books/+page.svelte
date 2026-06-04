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
                errorMsg = "Không thể xóa cuốn sách này";
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
        <h1>Quản lý kho sách</h1>
        <a href="/admin/add-book" class="comic-btn comic-btn--red comic-btn--md add-btn">
            <i class="bx bx-plus"></i> Thêm sách mới
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
                        <td
                            ><span class="type-badge {book.type}"
                                >{book.type}</span
                            ></td
                        >
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
                        <td colspan="6" class="empty"
                            >Chưa có sách nào trong kho</td
                        >
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
        font-size: 28px;
        font-weight: 800;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .add-btn {
        text-decoration: none;
        padding: 10px 20px;
        gap: 8px;
        font-size: 13px;
    }

    .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #1a1515;
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 18px;
        background: #fff;
        color: #1a1515;
        text-decoration: none;
        box-shadow: 3px 3px 0px #1a1515;
    }

    .icon-btn:hover {
        box-shadow: 2px 2px 0px #1a1515;
        transform: translate(1px, 1px);
    }

    .icon-btn.edit:hover {
        color: #2563eb;
        box-shadow: 2px 2px 0px #2563eb;
        background: #eff6ff;
    }

    .icon-btn.delete:hover {
        box-shadow: 2px 2px 0px #1a1515;
        color: #e44232;
        background: #fff5f3;
    }

    .table-container {
        background: white;
        overflow: hidden;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    thead {
        background: #fdfdfd;
        border-bottom: 2px solid #f0f0f0;
    }

    th {
        padding: 16px 24px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        font-weight: 700;
    }

    td {
        padding: 16px 24px;
        vertical-align: middle;
        border-bottom: 1px solid #f5f5f5;
        font-size: 14px;
        color: var(--text-main);
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
        color: var(--text-main);
    }

    .type-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
    }

    .type-badge.visual-novel {
        background: rgba(225, 91, 91, 0.1);
        color: var(--accent-dark);
    }
    .type-badge.manga {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }
    .type-badge.novel {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
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
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #1a1515;
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 18px;
        background: #fff;
        color: #1a1515;
        text-decoration: none;
        box-shadow: 3px 3px 0px #1a1515;
    }

    .icon-btn:hover {
        box-shadow: 2px 2px 0px #1a1515;
        transform: translate(1px, 1px);
    }

    .icon-btn.edit:hover {
        color: #2563eb;
        box-shadow: 2px 2px 0px #2563eb;
        background: #eff6ff;
    }

    .icon-btn.delete:hover {
        box-shadow: 2px 2px 0px #1a1515;
        color: #e44232;
        background: #fff5f3;
    }

    .empty {
        text-align: center;
        padding: 60px !important;
        color: var(--text-muted);
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

