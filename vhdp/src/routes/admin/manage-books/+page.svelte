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

<svelte:head>
    <title>Quản lý kho lưu trữ - Admin</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Tòa Soạn</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Hệ Thống Quản Trị Nội Dung</div>
</div>

<div class="page-container">
    <header class="page-header">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Không Gian Quản Trị</span>
        </div>
        
        <div class="header-main-title">
            <a href="/admin" class="back-link">
                <i class="bx bx-arrow-back"></i> Quay lại Bảng điều khiển
            </a>
            <h1 class="page-title">
                Quản lý kho <em class="page-accent">Lưu trữ</em><span class="page-dot">.</span>
            </h1>
        </div>
        
        <p class="page-lead">
            Theo dõi, chỉnh sửa thông tin, hoặc gỡ bỏ các ấn phẩm sách, truyện tranh, podcast audio và video tư liệu trong hệ thống.
        </p>
    </header>

    <div class="action-bar-wrapper">
        <div class="tabs-container">
            <button class:active={activeTab === 'books'} onclick={() => switchTab('books')}>
                Ấn phẩm ({books.length})
            </button>
            <button class:active={activeTab === 'audios'} onclick={() => switchTab('audios')}>
                Audio Podcast ({audios.length})
            </button>
            <button class:active={activeTab === 'videos'} onclick={() => switchTab('videos')}>
                Video Tư liệu ({videos.length})
            </button>
        </div>

        <div class="action-buttons-group">
            {#if activeTab === 'books'}
                <button class="newsprint-btn newsprint-btn--secondary" onclick={syncCovers} disabled={deletingId !== null || syncing}>
                    <i class="bx bx-sync"></i> {syncing ? 'Đang đồng bộ...' : 'Đồng bộ bìa trang cuối'}
                </button>
            {/if}

            {#if selectedIds.length > 0}
                <button class="newsprint-btn newsprint-btn--red" onclick={deleteSelected} disabled={deletingId !== null}>
                    <i class="bx bx-trash"></i> Xóa đã chọn ({selectedIds.length})
                </button>
            {/if}

            {#if activeTab === 'books'}
                <a href="/admin/add-book" class="newsprint-btn newsprint-btn--primary">
                    <i class="bx bx-plus"></i> Viết truyện chữ
                </a>
                <a href="/admin/add-manga" class="newsprint-btn newsprint-btn--secondary add-comic-btn">
                    <i class="bx bx-image-add"></i> Đăng truyện tranh
                </a>
            {:else if activeTab === 'audios'}
                <a href="/admin/add-audio" class="newsprint-btn newsprint-btn--primary">
                    <i class="bx bx-plus"></i> Phát thanh Podcast
                </a>
            {:else}
                <a href="/admin/add-video" class="newsprint-btn newsprint-btn--primary">
                    <i class="bx bx-plus"></i> Chiếu Video
                </a>
            {/if}
        </div>
    </div>

    {#if errorMsg}
        <div class="error-banner">{errorMsg}</div>
    {/if}

    <div class="table-wrapper">
        {#if activeTab === 'books'}
            <table class="newsprint-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" checked={isAllSelected} onchange={toggleSelectAll} />
                        </th>
                        <th class="cover-col">Hình bìa</th>
                        <th>Tác phẩm</th>
                        <th>Tác giả</th>
                        <th>Thể loại</th>
                        <th>Định dạng</th>
                        <th>Ngày phát hành</th>
                        <th class="actions-col">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {#each books as book}
                        <tr>
                            <td class="checkbox-col">
                                <input type="checkbox" checked={selectedIds.includes(book.id)} onchange={() => toggleSelect(book.id)} />
                            </td>
                            <td class="cover-col">
                                <img
                                    src={getCoverSrc(book, 'books')}
                                    alt={book.title}
                                    class="mini-cover"
                                    onerror={handleCoverError}
                                />
                            </td>
                            <td class="book-title font-serif">{book.title}</td>
                            <td>{book.author}</td>
                            <td><span class="category-tag">{book.category || "N/A"}</span></td>
                            <td>
                                <span class="format-badge {book.type === 'text' || book.type === 'truyện chữ' ? 'text' : 'manga'} font-mono">
                                    {getTypeLabel(book.type)}
                                </span>
                            </td>
                            <td class="font-mono">{formatDate(book.created_at)}</td>
                            <td class="actions-col">
                                <div class="action-group">
                                    <a href={`/admin/edit-book/${book.id}`} class="action-btn edit-btn">
                                        <i class="bx bx-edit-alt"></i>
                                    </a>
                                    <button
                                        type="button"
                                        class="action-btn delete-btn"
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
                            <td colspan="8" class="empty font-body">Kho lưu trữ chưa có tác phẩm nào</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        {:else if activeTab === 'audios'}
            <table class="newsprint-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" checked={isAllSelected} onchange={toggleSelectAll} />
                        </th>
                        <th class="cover-col">Hình bìa</th>
                        <th>Tiêu đề Podcast</th>
                        <th>Tác giả / Người đọc</th>
                        <th>Lượt nghe</th>
                        <th>Ngày đăng</th>
                        <th class="actions-col">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {#each audios as audio}
                        <tr>
                            <td class="checkbox-col">
                                <input type="checkbox" checked={selectedIds.includes(audio.id)} onchange={() => toggleSelect(audio.id)} />
                            </td>
                            <td class="cover-col">
                                <img
                                    src={getCoverSrc(audio, 'audios')}
                                    alt={audio.title}
                                    class="mini-cover"
                                    onerror={handleCoverError}
                                />
                            </td>
                            <td class="book-title font-serif">{audio.title}</td>
                            <td>{audio.author}</td>
                            <td class="font-mono">{audio.views || 0}</td>
                            <td class="font-mono">{formatDate(audio.created_at)}</td>
                            <td class="actions-col">
                                <div class="action-group">
                                    <a href={`/admin/edit-audio/${audio.id}`} class="action-btn edit-btn">
                                        <i class="bx bx-edit-alt"></i>
                                    </a>
                                    <button
                                        type="button"
                                        class="action-btn delete-btn"
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
                            <td colspan="7" class="empty font-body">Kho lưu trữ chưa có audio podcast nào</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        {:else}
            <table class="newsprint-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" checked={isAllSelected} onchange={toggleSelectAll} />
                        </th>
                        <th class="cover-col">Ảnh xem trước</th>
                        <th>Tiêu đề Video</th>
                        <th>Tác giả / Đạo diễn</th>
                        <th>Lượt xem</th>
                        <th>Ngày chiếu</th>
                        <th class="actions-col">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {#each videos as video}
                        <tr>
                            <td class="checkbox-col">
                                <input type="checkbox" checked={selectedIds.includes(video.id)} onchange={() => toggleSelect(video.id)} />
                            </td>
                            <td class="cover-col">
                                <img
                                    src={getCoverSrc(video, 'videos')}
                                    alt={video.title}
                                    class="mini-cover video-cover-mini"
                                    onerror={handleCoverError}
                                />
                            </td>
                            <td class="book-title font-serif">{video.title}</td>
                            <td>{video.author}</td>
                            <td class="font-mono">{video.views || 0}</td>
                            <td class="font-mono">{formatDate(video.created_at)}</td>
                            <td class="actions-col">
                                <div class="action-group">
                                    <a href={`/admin/edit-video/${video.id}`} class="action-btn edit-btn">
                                        <i class="bx bx-edit-alt"></i>
                                    </a>
                                    <button
                                        type="button"
                                        class="action-btn delete-btn"
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
                            <td colspan="7" class="empty font-body">Kho lưu trữ chưa có video tư liệu nào</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        {/if}
    </div>
</div>

<style>
    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 100px 24px 120px;
    }
    
    .page-header {
        padding: 60px 0 80px;
        border-bottom: 4px solid var(--newsprint-ink);
        margin-bottom: 40px;
    }

    .header-label {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.25em;
        color: var(--newsprint-red);
        margin-bottom: 24px;
    }

    .header-label-bar {
        width: 48px;
        height: 2px;
        background: var(--newsprint-red);
    }

    .header-main-title {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
    }

    .back-link {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--newsprint-ink);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        padding: 8px 16px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        width: fit-content;
    }

    .back-link:hover {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .page-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: clamp(38px, 4.5vw, 64px);
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: var(--newsprint-ink);
        margin: 0;
    }

    .page-title em {
        font-style: italic;
        color: var(--newsprint-red);
    }

    .page-dot {
        color: #cc0000;
    }

    .page-lead {
        font-family: 'Lora', serif;
        font-size: 16px;
        line-height: 1.6;
        color: var(--newsprint-neutral-600);
        max-width: 60ch;
        margin: 0;
    }

    .action-bar-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 32px;
    }

    @media (min-width: 1024px) {
        .action-bar-wrapper {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
        }
    }

    .tabs-container {
        display: flex;
        gap: 6px;
        border-bottom: 2px solid var(--newsprint-ink);
        padding-bottom: 0;
        width: 100%;
    }

    @media (min-width: 1024px) {
        .tabs-container {
            width: auto;
        }
    }

    .tabs-container button {
        padding: 12px 20px;
        font-size: 13px;
        font-weight: 700;
        color: var(--newsprint-neutral-600);
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        border-bottom: none;
        cursor: pointer;
        position: relative;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: all 0.15s ease-out;
        bottom: -2px;
    }

    .tabs-container button:hover {
        background: var(--newsprint-muted-bg);
        color: var(--newsprint-ink);
    }

    .tabs-container button.active {
        color: var(--newsprint-white);
        background: var(--newsprint-ink);
        border-color: var(--newsprint-ink);
    }

    .action-buttons-group {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .add-comic-btn {
        background: var(--newsprint-surface) !important;
        color: var(--newsprint-ink) !important;
        border-color: var(--newsprint-ink) !important;
    }
    
    .add-comic-btn:hover {
        background: var(--newsprint-ink) !important;
        color: var(--newsprint-white) !important;
    }

    .error-banner {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
        border: 2px solid var(--newsprint-red);
        box-shadow: 4px 4px 0 var(--newsprint-red);
        padding: 16px 20px;
        margin-bottom: 32px;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        font-size: 13px;
    }

    .table-wrapper {
        overflow-x: auto;
        border: 2px solid var(--newsprint-ink);
        box-shadow: var(--shadow-hard);
        background: var(--newsprint-white);
    }

    .newsprint-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    .newsprint-table th {
        padding: 16px 20px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--newsprint-ink);
        background: var(--newsprint-surface);
        border-bottom: 2px solid var(--newsprint-ink);
        border-right: 1px solid var(--newsprint-divider);
        font-weight: 800;
    }

    .newsprint-table th:last-child {
        border-right: none;
    }

    .newsprint-table td {
        padding: 16px 20px;
        vertical-align: middle;
        border-bottom: 1px solid var(--newsprint-divider);
        border-right: 1px solid var(--newsprint-divider);
        font-size: 14px;
        color: var(--newsprint-ink-soft);
        background: var(--newsprint-white);
    }

    .newsprint-table td:last-child {
        border-right: none;
    }

    .newsprint-table tr:last-child td {
        border-bottom: none;
    }

    .checkbox-col {
        width: 50px;
        text-align: center;
    }

    .checkbox-col input {
        width: 16px;
        height: 16px;
        accent-color: var(--newsprint-ink);
        cursor: pointer;
    }

    .cover-col {
        width: 80px;
        text-align: center;
    }

    .mini-cover {
        width: 44px;
        height: 60px;
        border: 1px solid var(--newsprint-ink);
        object-fit: cover;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
    }

    .video-cover-mini {
        aspect-ratio: 16/9;
        height: 34px;
        width: 60px;
    }

    .book-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--newsprint-ink);
    }

    .category-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        background: var(--newsprint-surface);
        border: 1px solid var(--newsprint-divider);
        padding: 2px 8px;
        color: var(--newsprint-neutral-700);
    }

    .format-badge {
        display: inline-block;
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid var(--newsprint-ink);
    }

    .format-badge.text {
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
    }

    .format-badge.manga {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .actions-col {
        width: 120px;
        text-align: center;
    }

    .action-group {
        display: flex;
        justify-content: center;
        gap: 8px;
    }

    .action-btn {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
        font-size: 16px;
        cursor: pointer;
        transition: all 0.15s ease-out;
    }

    .action-btn:hover {
        transform: translate(-1px, -1px);
        box-shadow: 2px 2px 0 var(--newsprint-ink);
    }

    .action-btn.edit-btn:hover {
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
    }

    .action-btn.delete-btn:hover {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }

    .empty {
        text-align: center;
        padding: 60px 20px !important;
        color: var(--newsprint-neutral-500);
        font-style: italic;
    }

    .side-rail {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: auto;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        pointer-events: none;
    }
    
    .side-rail.left { left: 20px; }
    .side-rail.right { right: 20px; }
    
    .rail-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: var(--newsprint-neutral-400);
        transform: rotate(-90deg);
        white-space: nowrap;
    }

    @media (max-width: 768px) {
        .side-rail { display: none; }
        .page-container { padding: 80px 16px 100px; }
        .page-header { padding: 40px 0 50px; margin-bottom: 30px; }
        .page-title { font-size: 32px; }
    }
</style>
