<script>
    import { onMount } from "svelte";
    import BookCard from "$lib/BookCard.svelte";
    import { apiFetch } from "$lib/api.js";

    let bookmarkedBooks = $state([]);
    let bookmarkedAudios = $state([]);
    let bookmarkedVideos = $state([]);
    let activeTab = $state("books");
    let loading = $state(true);

    async function loadLibrary() {
        try {
            const res = await apiFetch("/api/library");
            if (res.ok) {
                const data = await res.json();
                bookmarkedBooks = data.bookmarkedBooks || [];
                bookmarkedAudios = data.bookmarkedAudios || [];
                bookmarkedVideos = data.bookmarkedVideos || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        document.body.classList.add("paper-theme");
        loadLibrary();
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });

    async function removeBookmark(id, type, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            const res = await apiFetch("/api/library", {
                method: "DELETE",
                body: JSON.stringify({ id, type })
            });
            if (res.ok) {
                if (type === "book") {
                    bookmarkedBooks = bookmarkedBooks.filter(b => b.id !== id);
                } else if (type === "audio") {
                    bookmarkedAudios = bookmarkedAudios.filter(a => a.id !== id);
                } else if (type === "video") {
                    bookmarkedVideos = bookmarkedVideos.filter(v => v.id !== id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<svelte:head>
    <title>Thư viện của tôi - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Thư Viện</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
</div>

<div class="page-container">
    <header class="page-header">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Thư viện cá nhân</span>
        </div>
        
        <h1 class="page-title">
            Bộ sưu tập <em class="page-accent">yêu thích</em> của bạn<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Không gian riêng tư lưu trữ những cuốn sách, truyện chữ, thước phim tư liệu cùng các bản ghi âm địa phương bạn tâm đắc nhất.
        </p>

        <div class="tabs">
            <button
                class="tab-btn {activeTab === 'books' ? 'active' : ''}"
                onclick={() => (activeTab = "books")}
            >
                <i class="bx bx-book-open"></i> Sách &amp; Truyện ({bookmarkedBooks.length})
            </button>
            <button
                class="tab-btn {activeTab === 'videos' ? 'active' : ''}"
                onclick={() => (activeTab = "videos")}
            >
                <i class="bx bx-video"></i> Video Tư Liệu ({bookmarkedVideos.length})
            </button>
            <button
                class="tab-btn {activeTab === 'audios' ? 'active' : ''}"
                onclick={() => (activeTab = "audios")}
            >
                <i class="bx bx-volume-full"></i> Sách Nói &amp; Âm Thanh ({bookmarkedAudios.length})
            </button>
        </div>
    </header>

    <section class="content-section">
        {#if loading}
            <div class="loading-state font-mono">Đang tải thư viện cá nhân...</div>
        {:else}
            {#if activeTab === "books"}
                <div class="section-header">
                    <div class="section-count">{bookmarkedBooks.length} Tác phẩm đã lưu</div>
                    <div class="section-updated">Sách &amp; Truyện chữ</div>
                </div>

                <div class="book-grid">
                    {#if bookmarkedBooks.length === 0}
                        <div class="empty empty--center">
                            <div class="empty-symbol">§</div>
                            <p>Không có tác phẩm chữ nào trong thư viện. Hãy tìm cho mình cuốn sách tâm đắc nhé.</p>
                            <a href="/" class="newsprint-btn newsprint-btn--primary mt-4">Khám phá sách</a>
                        </div>
                    {:else}
                        {#each bookmarkedBooks as book (book.id)}
                            <div class="book-item-wrapper newsprint-card hard-shadow-hover">
                                <div class="book-link-wrapper">
                                    <BookCard {book} />
                                </div>

                                <button
                                    type="button"
                                    onclick={(e) => removeBookmark(book.id, "book", e)}
                                    class="remove-btn"
                                    title="Xóa khỏi thư viện"
                                >
                                    <i class="bx bx-x"></i>
                                </button>
                            </div>
                        {/each}
                    {/if}
                </div>
            {/if}

            {#if activeTab === "videos"}
                <div class="section-header">
                    <div class="section-count">{bookmarkedVideos.length} Video đã lưu</div>
                    <div class="section-updated">Thước phim tư liệu</div>
                </div>

                <div class="media-grid">
                    {#if bookmarkedVideos.length === 0}
                        <div class="empty empty--center">
                            <div class="empty-symbol">§</div>
                            <p>Chưa có video tư liệu nào được yêu thích. Khám phá kho phim tư liệu của chúng tôi.</p>
                            <a href="/video" class="newsprint-btn newsprint-btn--primary mt-4">Khám phá video</a>
                        </div>
                    {:else}
                        {#each bookmarkedVideos as video (video.id)}
                            <a href="/video/{video.id}" class="newsprint-card hard-shadow-hover media-card">
                                <div class="media-cover border-b-2 border-[#111111]">
                                    {#if video.cover_url}
                                        <img src={video.cover_url} alt={video.title} />
                                    {:else}
                                        <div class="media-placeholder"><i class="bx bx-video"></i></div>
                                    {/if}
                                    <div class="play-indicator-overlay">
                                        <i class="bx bx-play-circle"></i>
                                    </div>
                                </div>
                                <div class="media-info">
                                    <span class="media-tag">Video tư liệu</span>
                                    <h3>{video.title}</h3>
                                    <p>{video.author || "Khuyết danh"}</p>
                                </div>

                                <button
                                    type="button"
                                    onclick={(e) => removeBookmark(video.id, "video", e)}
                                    class="remove-btn"
                                    title="Xóa khỏi thư viện"
                                >
                                    <i class="bx bx-x"></i>
                                </button>
                            </a>
                        {/each}
                    {/if}
                </div>
            {/if}

            {#if activeTab === "audios"}
                <div class="section-header">
                    <div class="section-count">{bookmarkedAudios.length} Bản ghi đã lưu</div>
                    <div class="section-updated">Sách nói &amp; Diễn xướng</div>
                </div>

                <div class="media-grid">
                    {#if bookmarkedAudios.length === 0}
                        <div class="empty empty--center">
                            <div class="empty-symbol">§</div>
                            <p>Không có tệp âm thanh hay sách nói nào được lưu. Lắng nghe những âm điệu bản địa.</p>
                            <a href="/audio" class="newsprint-btn newsprint-btn--primary mt-4">Nghe sách nói</a>
                        </div>
                    {:else}
                        {#each bookmarkedAudios as audio (audio.id)}
                            <a href="/audio/{audio.id}" class="newsprint-card hard-shadow-hover media-card">
                                <div class="media-cover border-b-2 border-[#111111]">
                                    {#if audio.cover_url}
                                        <img src={audio.cover_url} alt={audio.title} />
                                    {:else}
                                        <div class="media-placeholder"><i class="bx bx-volume-full"></i></div>
                                    {/if}
                                    <div class="play-indicator-overlay">
                                        <i class="bx bx-play-circle"></i>
                                    </div>
                                </div>
                                <div class="media-info">
                                    <span class="media-tag">Sách nói &amp; Âm thanh</span>
                                    <h3>{audio.title}</h3>
                                    <p>{audio.author || "Khuyết danh"}</p>
                                </div>

                                <button
                                    type="button"
                                    onclick={(e) => removeBookmark(audio.id, "audio", e)}
                                    class="remove-btn"
                                    title="Xóa khỏi thư viện"
                                >
                                    <i class="bx bx-x"></i>
                                </button>
                            </a>
                        {/each}
                    {/if}
                </div>
            {/if}
        {/if}
    </section>
</div>

<style>
    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 60px 24px 120px;
    }
    
    .page-header {
        padding: 40px 0 50px;
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

    .page-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: clamp(38px, 4.5vw, 64px);
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: var(--newsprint-ink);
        margin-bottom: 24px;
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
        max-width: 50ch;
        margin-bottom: 32px;
    }

    .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .tab-btn {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 13px;
        font-weight: 700;
        padding: 12px 24px;
        background: transparent;
        color: var(--newsprint-ink);
        border: 2px solid var(--newsprint-ink);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        text-shadow: none;
    }

    .tab-btn:hover {
        background: rgba(30, 27, 24, 0.05);
        transform: translateY(-1px);
    }

    .tab-btn.active {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        transform: translate(-2px, -2px);
    }

    .content-section {
        margin-top: 20px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 2px solid var(--newsprint-ink);
        padding-top: 16px;
        margin-bottom: 32px;
    }

    .section-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--newsprint-ink);
    }

    .section-updated {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-neutral-500);
    }
    
    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 24px;
    }
    
    .book-item-wrapper {
        position: relative;
        background: var(--newsprint-surface);
        display: flex;
        flex-direction: column;
    }

    .book-link-wrapper {
        flex: 1;
    }
    
    .book-item-wrapper :global(.book-card) {
        height: 100%;
        border: none;
        box-shadow: none;
    }

    .book-item-wrapper :global(.book-card:hover) {
        transform: none;
        box-shadow: none;
    }

    .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 28px;
    }

    .media-card {
        position: relative;
        text-decoration: none;
        display: flex;
        flex-direction: column;
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
    }

    .media-cover {
        aspect-ratio: 16 / 9;
        position: relative;
        overflow: hidden;
        background: var(--newsprint-bg);
    }

    .media-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .media-card:hover .media-cover img {
        transform: scale(1.05);
    }

    .media-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        color: var(--newsprint-neutral-400);
    }

    .play-indicator-overlay {
        position: absolute;
        inset: 0;
        background: rgba(30, 27, 24, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .media-card:hover .play-indicator-overlay {
        opacity: 1;
    }

    .play-indicator-overlay i {
        font-size: 48px;
        color: var(--newsprint-white);
    }

    .media-info {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .media-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        text-transform: uppercase;
        font-weight: 700;
        color: var(--newsprint-red);
        margin-bottom: 6px;
    }

    .media-info h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.4;
        color: var(--newsprint-ink);
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .media-info p {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 12px;
        color: var(--newsprint-neutral-600);
        margin-top: auto;
    }

    .remove-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        z-index: 10;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--newsprint-ink);
        font-size: 18px;
        cursor: pointer;
        box-shadow: 2px 2px 0 rgba(0,0,0,1);
        transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        text-shadow: none;
    }

    .remove-btn:hover {
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--newsprint-red);
        color: var(--newsprint-red);
        border-color: var(--newsprint-red);
    }

    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        border: 2px dashed var(--newsprint-divider);
        background: var(--newsprint-surface);
    }

    .empty--center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .empty-symbol {
        font-family: 'Playfair Display', serif;
        font-size: 64px;
        color: var(--newsprint-neutral-300);
        line-height: 1;
    }

    .empty p {
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        color: var(--newsprint-neutral-500);
    }
    
    .loading-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px;
        font-size: 14px;
        color: var(--newsprint-neutral-500);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    
    @media (max-width: 1024px) {
        .book-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    
    @media (max-width: 768px) {
        .page-container {
            padding: 40px 24px 100px;
        }
        
        .book-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        
        .page-title {
            font-size: 32px;
        }

        .media-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
    }
    
    @media (max-width: 480px) {
        .book-grid {
            grid-template-columns: 1fr;
        }

        .media-grid {
            grid-template-columns: 1fr;
        }
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
    
    .side-rail.left {
        left: 20px;
    }
    
    .side-rail.right {
        right: 20px;
    }
    
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
        .side-rail {
            display: none;
        }
    }
</style>
