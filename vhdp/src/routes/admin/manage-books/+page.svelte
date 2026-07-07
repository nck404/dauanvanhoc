<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let activeTab = $state("books");
    let books = $state([]);
    let audios = $state([]);
    let videos = $state([]);
    let deletingId = $state(null);
    let errorMsg = $state("");

    let selectedIds = $state([]);

    function formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    }

    function getCoverSrc(item, type) {
        const src = (item?.cover_url || item?.cover || "").toString().trim();
        if (src) return src;
        return "/default_cover.jpg";
    }

    function handleCoverError(e) {
        const img = e.currentTarget;
        if (img && img.src && !img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = "/default_cover.jpg";
        }
    }

    function getTypeLabel(type) {
        switch (type) {
            case "text":
            case "truyện chữ":
                return "Truyện chữ";
            case "manga":
            case "truyện tranh":
                return "Truyện tranh";
            default:
                return type || "Truyện chữ";
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

    async function loadAudios() {
        try {
            const res = await apiFetch("/api/audios");
            if (res.ok) {
                const data = await res.json();
                audios = data.audios || [];
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function loadVideos() {
        try {
            const res = await apiFetch("/api/videos");
            if (res.ok) {
                const data = await res.json();
                videos = data.videos || [];
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function reloadAll() {
        await Promise.all([loadBooks(), loadAudios(), loadVideos()]);
    }

    onMount(() => {
        reloadAll();
    });

    async function deleteItem(id, title, type) {
        if (!confirm(`Bạn có chắc muốn xóa "${title}"?`)) return;
        deletingId = id;
        errorMsg = "";
        
        let url = "";
        if (type === "books") {
            url = `/api/books/${id}`;
        } else if (type === "audios") {
            url = `/api/audios/${id}`;
        } else if (type === "videos") {
            url = `/api/videos/${id}`;
        }

        try {
            const res = await apiFetch(url, {
                method: "DELETE"
            });
            if (res.ok) {
                selectedIds = selectedIds.filter(x => x !== id);
                await reloadAll();
            } else {
                errorMsg = "Không thể xóa nội dung này";
            }
        } catch (e) {
            errorMsg = "Lỗi kết nối";
        } finally {
            deletingId = null;
        }
    }

    function toggleSelect(id) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter(x => x !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    }

    function toggleSelectAll(e) {
        const checked = e.currentTarget.checked;
        const currentItems = activeTab === "books" ? books : (activeTab === "audios" ? audios : videos);
        if (checked) {
            selectedIds = currentItems.map(item => item.id);
        } else {
            selectedIds = [];
        }
    }

    async function deleteSelected() {
        const count = selectedIds.length;
        if (count === 0) return;
        if (!confirm(`Bạn có chắc muốn xóa ${count} mục đã chọn?`)) return;

        deletingId = "bulk";
        errorMsg = "";

        try {
            await Promise.all(selectedIds.map(id => {
                let url = "";
                if (activeTab === "books") url = `/api/books/${id}`;
                else if (activeTab === "audios") url = `/api/audios/${id}`;
                else if (activeTab === "videos") url = `/api/videos/${id}`;
                return apiFetch(url, { method: "DELETE" });
            }));
            selectedIds = [];
            await reloadAll();
        } catch (e) {
            errorMsg = "Lỗi khi thực hiện xóa hàng loạt";
        } finally {
            deletingId = null;
        }
    }

    function switchTab(tab) {
        activeTab = tab;
        selectedIds = [];
    }

    let syncing = $state(false);

    const targetTitles = [
        "SỰ TÍCH VỀ NGUỒN GỐC CỦA NGƯỜI M'NÔNG",
        "SỰ TÍCH QUẢ BẦU",
        "SỰ TÍCH CÂY NÊU THẦN",
        "QUẢ BẦU MẸ",
        "CẬU BÉ BỤNG CHƠ LAN",
        "CON VƯỢN VÀ THẦN LÚA",
        "CHÀNG PIỆNG GIẾT CON RỒNG",
        "CHÀNG K'MBÔNG",
        "CHUYỆN THẨN LÚA",
        "CHUYỆN K'TAR LUT-NDUR",
        "BÀ MẸ KẾ",
        "Chàng Khỉ",
        "Chàng khỉ"
    ];

    async function syncCovers() {
        if (!confirm("Bạn có chắc muốn đồng bộ ảnh bìa từ trang cuối cho các truyện M'Nông?")) return;
        syncing = true;
        errorMsg = "";
        
        try {
            const API_BASE = "https://vhdp-worker.frenda.workers.dev";
            for (const book of books) {
                if (targetTitles.includes(book.title)) {
                    const detailRes = await apiFetch(`/api/books/${book.id}`);
                    if (!detailRes.ok) continue;

                    const detailData = await detailRes.json();
                    const chapters = detailData.chapters || [];
                    const imageUrls = [];

                    for (const ch of chapters) {
                        const regex = /<img[^>]+src=["']([^"']+)["']/g;
                        let match;
                        while ((match = regex.exec(ch.content)) !== null) {
                            imageUrls.push(match[1]);
                        }
                    }

                    if (imageUrls.length > 0) {
                        let lastImage = imageUrls[imageUrls.length - 1];
                        if (lastImage.startsWith("/")) {
                            lastImage = `${API_BASE}${lastImage}`;
                        }

                        await apiFetch(`/api/books/${book.id}`, {
                            method: "PUT",
                            body: JSON.stringify({
                                title: book.title,
                                author: book.author,
                                type: book.type,
                                category: book.category,
                                description: book.description,
                                status: book.status,
                                cover_url: lastImage
                            })
                        });
                    }
                }
            }
            alert("Đã đồng bộ ảnh bìa thành công!");
            await reloadAll();
        } catch (e) {
            errorMsg = "Lỗi khi đồng bộ ảnh bìa";
        } finally {
            syncing = false;
        }
    }

    let isAllSelected = $derived.by(() => {
        const currentItems = activeTab === "books" ? books : (activeTab === "audios" ? audios : videos);
        if (currentItems.length === 0) return false;
        return currentItems.every(item => selectedIds.includes(item.id));
    });
</script>

<div class="admin-container">
    <div class="header">
        <h1>Quản lý kho nội dung</h1>
        <div class="header-actions">
            {#if activeTab === 'books'}
                <button class="bulk-delete-btn" onclick={syncCovers} disabled={deletingId !== null || syncing} style="background: #f0fdf4; border-color: #bbf7d0; color: #16a34a;">
                    <i class="bx bx-sync"></i> {syncing ? 'Đang đồng bộ...' : 'Đồng bộ bìa trang cuối'}
                </button>
            {/if}

            {#if selectedIds.length > 0}
                <button class="bulk-delete-btn" onclick={deleteSelected} disabled={deletingId !== null}>
                    <i class="bx bx-trash"></i> Xóa đã chọn ({selectedIds.length})
                </button>
            {/if}

            {#if activeTab === 'books'}
                <div class="book-add-buttons">
                    <a href="/admin/add-book" class="modern-add-btn">
                        <i class="bx bx-plus"></i> Thêm sách / truyện chữ
                    </a>
                    <a href="/admin/add-manga" class="modern-add-btn comic-add-btn">
                        <i class="bx bx-image-add"></i> Thêm truyện tranh
                    </a>
                </div>
            {:else if activeTab === 'audios'}
                <a href="/admin/add-audio" class="modern-add-btn">
                    <i class="bx bx-plus"></i> Thêm Audio mới
                </a>
            {:else}
                <a href="/admin/add-video" class="modern-add-btn">
                    <i class="bx bx-plus"></i> Thêm Video mới
                </a>
            {/if}
        </div>
    </div>

    {#if errorMsg}
        <div class="error-banner">{errorMsg}</div>
    {/if}

    <div class="tabs-container">
        <button class:active={activeTab === 'books'} onclick={() => switchTab('books')}>
            Sách & Truyện ({books.length})
        </button>
        <button class:active={activeTab === 'audios'} onclick={() => switchTab('audios')}>
            Audio Sách ({audios.length})
        </button>
        <button class:active={activeTab === 'videos'} onclick={() => switchTab('videos')}>
            Video Tư Liệu ({videos.length})
        </button>
    </div>

    <div class="table-container">
        {#if activeTab === 'books'}
            <table>
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" checked={isAllSelected} onchange={toggleSelectAll} />
                        </th>
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
                            <td class="checkbox-col">
                                <input type="checkbox" checked={selectedIds.includes(book.id)} onchange={() => toggleSelect(book.id)} />
                            </td>
                            <td>
                                <img
                                    src={getCoverSrc(book, 'books')}
                                    alt={book.title}
                                    class="mini-cover"
                                    onerror={handleCoverError}
                                />
                            </td>
                            <td class="book-title">{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.category || "N/A"}</td>
                            <td>
                                <span class="type-badge {book.type === 'text' || book.type === 'truyện chữ' ? 'text' : 'manga'}">
                                    {getTypeLabel(book.type)}
                                </span>
                            </td>
                            <td>{formatDate(book.created_at)}</td>
                            <td class="actions">
                                <div class="action-group">
                                    <a href={`/admin/edit-book/${book.id}`} class="icon-btn edit">
                                        <i class="bx bx-edit-alt"></i>
                                    </a>
                                    <button
                                        type="button"
                                        class="icon-btn delete"
                                        onclick={() => deleteItem(book.id, book.title, 'books')}
                                        disabled={deletingId !== null}
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
                            <td colspan="8" class="empty">Chưa có tác phẩm nào</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        {:else if activeTab === 'audios'}
            <table>
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" checked={isAllSelected} onchange={toggleSelectAll} />
                        </th>
                        <th>Bìa</th>
                        <th>Tiêu đề</th>
                        <th>Tác giả / Người đọc</th>
                        <th>Lượt nghe</th>
                        <th>Ngày tạo</th>
                        <th class="actions">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {#each audios as audio}
                        <tr>
                            <td class="checkbox-col">
                                <input type="checkbox" checked={selectedIds.includes(audio.id)} onchange={() => toggleSelect(audio.id)} />
                            </td>
                            <td>
                                <img
                                    src={getCoverSrc(audio, 'audios')}
                                    alt={audio.title}
                                    class="mini-cover"
                                    onerror={handleCoverError}
                                />
                            </td>
                            <td class="book-title">{audio.title}</td>
                            <td>{audio.author}</td>
                            <td>{audio.views || 0}</td>
                            <td>{formatDate(audio.created_at)}</td>
                            <td class="actions">
                                <div class="action-group">
                                    <a href={`/admin/edit-audio/${audio.id}`} class="icon-btn edit">
                                        <i class="bx bx-edit-alt"></i>
                                    </a>
                                    <button
                                        type="button"
                                        class="icon-btn delete"
                                        onclick={() => deleteItem(audio.id, audio.title, 'audios')}
                                        disabled={deletingId !== null}
                                    >
                                        {#if deletingId === audio.id}
                                            <i class="bx bx-loader-alt bx-spin"></i>
                                        {:else}
                                            <i class="bx bx-trash"></i>
                                        {/if}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                    {#if audios.length === 0}
                        <tr>
                            <td colspan="7" class="empty">Chưa có audio nào</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        {:else}
            <table>
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" checked={isAllSelected} onchange={toggleSelectAll} />
                        </th>
                        <th>Ảnh bìa</th>
                        <th>Tiêu đề</th>
                        <th>Tác giả / Đạo diễn</th>
                        <th>Lượt xem</th>
                        <th>Ngày tạo</th>
                        <th class="actions">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {#each videos as video}
                        <tr>
                            <td class="checkbox-col">
                                <input type="checkbox" checked={selectedIds.includes(video.id)} onchange={() => toggleSelect(video.id)} />
                            </td>
                            <td>
                                <img
                                    src={getCoverSrc(video, 'videos')}
                                    alt={video.title}
                                    class="mini-cover video-cover-mini"
                                    onerror={handleCoverError}
                                />
                            </td>
                            <td class="book-title">{video.title}</td>
                            <td>{video.author}</td>
                            <td>{video.views || 0}</td>
                            <td>{formatDate(video.created_at)}</td>
                            <td class="actions">
                                <div class="action-group">
                                    <a href={`/admin/edit-video/${video.id}`} class="icon-btn edit">
                                        <i class="bx bx-edit-alt"></i>
                                    </a>
                                    <button
                                        type="button"
                                        class="icon-btn delete"
                                        onclick={() => deleteItem(video.id, video.title, 'videos')}
                                        disabled={deletingId !== null}
                                    >
                                        {#if deletingId === video.id}
                                            <i class="bx bx-loader-alt bx-spin"></i>
                                        {:else}
                                            <i class="bx bx-trash"></i>
                                        {/if}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                    {#if videos.length === 0}
                        <tr>
                            <td colspan="7" class="empty">Chưa có video nào</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        {/if}
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
        color: var(--text-main);
    }

    .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    .book-add-buttons {
        display: flex;
        gap: 0.75rem;
    }
    .comic-add-btn {
        background: var(--newsprint-blue, #2b6cb0) !important;
        border-color: var(--newsprint-blue, #2b6cb0) !important;
    }
    .comic-add-btn:hover {
        background: #2c5282 !important;
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
        box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
        transition: all 0.2s ease;
    }

    .modern-add-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px -2px rgba(220, 38, 38, 0.3);
    }

    .bulk-delete-btn {
        padding: 10px 20px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 8px;
        background: #fef2f2;
        color: #ef4444;
        border: 1px solid #fca5a5;
        cursor: pointer;
        transition: all 0.2s;
    }

    .bulk-delete-btn:hover {
        background: #fee2e2;
        transform: translateY(-1px);
    }

    .tabs-container {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 8px;
    }

    .tabs-container button {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 700;
        color: #64748b;
        border-radius: 8px 8px 0 0;
        border: none;
        background: transparent;
        cursor: pointer;
        position: relative;
    }

    .tabs-container button.active {
        color: #ef4444;
    }

    .tabs-container button.active::after {
        content: "";
        position: absolute;
        bottom: -10px;
        left: 0;
        right: 0;
        height: 3px;
        background: #ef4444;
    }

    .table-container {
        background: white;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
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

    .checkbox-col {
        width: 48px;
        padding-right: 0;
        text-align: center;
    }

    .checkbox-col input {
        width: 16px;
        height: 16px;
        cursor: pointer;
    }

    .mini-cover {
        width: 40px;
        height: 56px;
        border-radius: 6px;
        object-fit: cover;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .video-cover-mini {
        aspect-ratio: 16/9;
        height: auto;
        width: 60px;
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
        text-transform: uppercase;
    }

    .type-badge.text {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .type-badge.manga {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
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
        transition: all 0.2s;
        font-size: 18px;
        background: #ffffff;
        color: #64748b;
        text-decoration: none;
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
