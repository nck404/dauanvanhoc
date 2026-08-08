<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import SkeletonCard from "$lib/components/SkeletonCard.svelte";

    let videos = $state([]);
    let loaded = $state(false);
    let searchQuery = $state("");
    let selectedCategory = $state("all");
    let bookmarkedVideoIds = $state(new Set());
    const SKELETON_COUNT = 6;

    let filteredVideos = $derived(
        videos.filter(v => {
            const matchesSearch = searchQuery ? (
                (v.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.author || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                ((v.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
            ) : true;

            if (selectedCategory === "all") return matchesSearch;
            
            const titleLower = v.title.toLowerCase();
            const descLower = (v.description || "").toLowerCase();
            
            if (selectedCategory === "history") {
                return matchesSearch && (
                    titleLower.includes("tư liệu") || titleLower.includes("lịch sử") || titleLower.includes("xưa") || titleLower.includes("cổ") ||
                    descLower.includes("tư liệu") || descLower.includes("lịch sử") || descLower.includes("xưa") || descLower.includes("cổ")
                );
            }
            if (selectedCategory === "art") {
                return matchesSearch && (
                    titleLower.includes("chèo") || titleLower.includes("tuồng") || titleLower.includes("kịch") || titleLower.includes("ca") || titleLower.includes("nhạc") || titleLower.includes("hát") || titleLower.includes("dân ca") ||
                    descLower.includes("chèo") || descLower.includes("tuồng") || descLower.includes("kịch") || descLower.includes("ca") || descLower.includes("nhạc") || descLower.includes("hát") || descLower.includes("dân ca")
                );
            }
            if (selectedCategory === "cinema") {
                return matchesSearch && (
                    titleLower.includes("phim") || titleLower.includes("truyện") || titleLower.includes("điện ảnh") ||
                    descLower.includes("phim") || descLower.includes("truyện") || descLower.includes("điện ảnh")
                );
            }
            return matchesSearch;
        })
    );

    onMount(async () => {
        document.body.classList.add("paper-theme");
        try {
            const res = await apiFetch("/api/videos");
            if (res.ok) {
                const data = await res.json();
                videos = data.videos || [];
            }

            const libRes = await apiFetch("/api/library");
            if (libRes.ok) {
                const libData = await libRes.json();
                const videoIds = (libData.bookmarkedVideos || []).map(v => v.id);
                bookmarkedVideoIds = new Set(videoIds);
            }
        } catch (e) {
            console.error(e);
        }
        const timer = setTimeout(() => { loaded = true; }, 420);
        return () => {
            clearTimeout(timer);
            document.body.classList.remove("paper-theme");
        };
    });

    async function toggleBookmark(video, event) {
        event.preventDefault();
        event.stopPropagation();
        const id = video.id;
        const isBookmarked = bookmarkedVideoIds.has(id);
        if (isBookmarked) {
            bookmarkedVideoIds.delete(id);
        } else {
            bookmarkedVideoIds.add(id);
        }
        bookmarkedVideoIds = new Set(bookmarkedVideoIds);

        try {
            const res = await apiFetch(`/api/videos/${id}`, {
                method: "POST"
            });
            if (res.ok) {
                const result = await res.json();
                if (result.isBookmarked) {
                    bookmarkedVideoIds.add(id);
                } else {
                    bookmarkedVideoIds.delete(id);
                }
                bookmarkedVideoIds = new Set(bookmarkedVideoIds);
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<svelte:head>
    <title>Video Tư Liệu - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Video Tư Liệu</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
</div>

<div class="page-container">
    <header class="page-header">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Trực quan hóa tư liệu</span>
        </div>
        
        <h1 class="page-title">
            Thư viện <em class="page-accent">phim &amp; video</em> bản địa<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Không gian lưu giữ và phát triển tư liệu hình ảnh, phim tài liệu, di sản nghệ thuật truyền thống độc đáo của các xứ sở Việt Nam.
        </p>

        <div class="search-and-filters">
            <div class="editorial-search">
                <i class="bx bx-search editorial-search-icon"></i>
                <input
                    type="text"
                    placeholder="Tìm kiếm phim, tư liệu, đạo diễn..."
                    bind:value={searchQuery}
                    class="editorial-search-input"
                />
            </div>

            <div class="filter-chips">
                <button 
                    class="chip {selectedCategory === 'all' ? 'active' : ''}" 
                    onclick={() => selectedCategory = 'all'}
                >
                    Tất cả
                </button>
                <button 
                    class="chip {selectedCategory === 'history' ? 'active' : ''}" 
                    onclick={() => selectedCategory = 'history'}
                >
                    Lịch sử &amp; Tư liệu
                </button>
                <button 
                    class="chip {selectedCategory === 'art' ? 'active' : ''}" 
                    onclick={() => selectedCategory = 'art'}
                >
                    Kịch nghệ &amp; Diễn xướng
                </button>
                <button 
                    class="chip {selectedCategory === 'cinema' ? 'active' : ''}" 
                    onclick={() => selectedCategory = 'cinema'}
                >
                    Điện ảnh địa phương
                </button>
            </div>
        </div>
    </header>

    <section class="content-section">
        <div class="section-header">
            <div class="section-count">{selectedCategory === 'all' && !searchQuery ? 10 : filteredVideos.length} Tư liệu hình ảnh</div>
            <div class="small-ornament">✦✦✦✦</div>
            <div class="section-updated">Đồng bộ di sản số</div>
        </div>

        <div class="grid">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <div class="newsprint-card video-card">
                        <div class="cover-box">
                            <div class="placeholder">
                                <SkeletonCard type="video" />
                            </div>
                        </div>
                        <div class="info">
                            <SkeletonCard type="text" />
                            <SkeletonCard type="text" />
                            <div class="meta">
                                <SkeletonCard type="text" />
                            </div>
                        </div>
                    </div>
                {/each}
            {:else if !filteredVideos.length}
                <div class="empty empty--center">
                    <div class="empty-symbol">§</div>
                    <p>Không tìm thấy video nào phù hợp với bộ lọc hiện tại.</p>
                </div>
            {:else}
                {#each filteredVideos as video (video.id)}
                    <a href="/video/{video.id}" data-sveltekit-reload class="newsprint-card hard-shadow-hover video-card">
                        <div class="cover-box border-b-2 border-[#111111]">
                            {#if video.cover_url}
                                <img src={video.cover_url} alt="Cover" />
                            {:else}
                                <div class="placeholder"><i class="bx bx-video"></i></div>
                            {/if}
                            
                            <button 
                                class="favorite-overlay-btn" 
                                class:active={bookmarkedVideoIds.has(video.id)}
                                onclick={(e) => toggleBookmark(video, e)}
                                title={bookmarkedVideoIds.has(video.id) ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
                            >
                                <i class="bx {bookmarkedVideoIds.has(video.id) ? 'bxs-heart' : 'bx-heart'}"></i>
                            </button>

                            <div class="play-overlay">
                                <div class="play-circle-glow">
                                    <i class="bx bx-play"></i>
                                </div>
                            </div>
                        </div>
                        <div class="info">
                            <div class="info-top-row">
                                <span class="index-tag">Tư liệu</span>
                                <span class="views-tag"><i class="bx bx-show"></i> {video.views}</span>
                            </div>
                            <h3>{video.title}</h3>
                            <p>{video.author || "Khuyết danh"}</p>
                            <div class="meta">
                                <span>Xem ngay</span>
                                <i class="bx bx-right-arrow-alt"></i>
                            </div>
                        </div>
                    </a>
                {/each}
            {/if}
        </div>
    </section>
</div>

<style>
    .side-rail {
        position: fixed;
        top: 0;
        bottom: 0;
        width: 44px;
        z-index: 99;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .side-rail.right { right: 0; border-left: 1px solid var(--line-faint); }
    .side-rail.left { left: 0; border-right: 1px solid var(--line-faint); }

    .side-rail .rail-text {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.4em;
        text-transform: uppercase;
        color: var(--ink-faint);
        writing-mode: vertical-rl;
        white-space: nowrap;
    }

    .side-rail.right .rail-text { transform: rotate(180deg); }
    .side-rail.left .rail-text { transform: none; }

    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 60px 24px 120px;
    }

    .page-header {
        padding: 40px 0 50px;
        border-bottom: 4px solid var(--newsprint-ink);
        margin-bottom: 30px;
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
        margin-bottom: 20px;
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
        max-width: 60ch;
        margin-bottom: 32px;
    }

    .search-and-filters {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 10px;
    }

    .editorial-search {
        position: relative;
        display: flex;
        align-items: center;
        max-width: 600px;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        box-shadow: 3px 3px 0 var(--newsprint-ink);
    }

    .editorial-search-icon {
        position: absolute;
        left: 16px;
        font-size: 20px;
        color: var(--newsprint-ink);
        opacity: 0.7;
    }

    .editorial-search-input {
        width: 100%;
        padding: 14px 16px 14px 48px;
        border: none;
        background: transparent;
        font-size: 15px;
        color: var(--newsprint-ink);
        outline: none;
        font-weight: 500;
    }

    .filter-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .chip {
        padding: 8px 16px;
        border: 2px solid var(--newsprint-ink);
        background: transparent;
        font-size: 13px;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
        color: var(--newsprint-ink);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        text-shadow: none;
    }

    .chip:hover {
        background: rgba(30, 27, 24, 0.05);
        transform: translateY(-1px);
    }

    .chip.active {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
        box-shadow: 3px 3px 0 var(--newsprint-ink);
        transform: translate(-1px, -1px);
    }

    .small-ornament {
        text-align: center;
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        letter-spacing: 0.1em;
        color: var(--newsprint-red);
        padding: 0;
        margin: 0;
    }

    .content-section {
        margin-top: 20px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 16px;
        margin-bottom: 32px;
        border-top: 2px solid var(--newsprint-ink);
    }

    .section-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--newsprint-ink);
    }

    .section-updated {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-neutral-500);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 32px;
    }

    .video-card {
        text-decoration: none;
        position: relative;
        display: flex;
        flex-direction: column;
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .video-card:hover {
        transform: translate(-3px, -3px);
        box-shadow: 7px 7px 0 var(--newsprint-ink);
    }

    .cover-box {
        aspect-ratio: 16 / 9;
        position: relative;
        overflow: hidden;
        background: var(--newsprint-bg);
    }

    .cover-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: var(--ink-faint);
    }

    .favorite-overlay-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 5;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: var(--newsprint-ink);
        box-shadow: 2px 2px 0 var(--newsprint-ink);
        cursor: pointer;
        transition: all 0.2s ease;
        text-shadow: none;
    }

    .favorite-overlay-btn:hover {
        transform: scale(1.1) translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--newsprint-ink);
        color: var(--newsprint-red);
    }

    .favorite-overlay-btn.active {
        background: var(--newsprint-red);
        border-color: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .play-overlay {
        position: absolute;
        inset: 0;
        background: rgba(30, 27, 24, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.25s ease;
    }

    .play-circle-glow {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--newsprint-white);
        border: 3px solid var(--newsprint-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .play-circle-glow i {
        font-size: 32px;
        color: var(--newsprint-ink);
        margin-left: 4px;
    }

    .video-card:hover .play-overlay {
        opacity: 1;
    }

    .video-card:hover .play-circle-glow {
        transform: scale(1.1);
    }

    .video-card:hover .cover-box img {
        transform: scale(1.05);
    }

    .info {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .info-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .info .index-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--newsprint-red);
        display: block;
    }

    .views-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: var(--newsprint-neutral-500);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .info h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        font-weight: 700;
        line-height: 1.4;
        color: var(--newsprint-ink);
        margin-bottom: 6px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .info p {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 13px;
        color: var(--newsprint-neutral-600);
        margin-bottom: 16px;
    }

    .meta {
        margin-top: auto;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 12px;
        color: var(--newsprint-ink);
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: transform 0.2s ease;
    }

    .video-card:hover .meta {
        transform: translateX(4px);
    }

    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px;
        color: var(--ink-soft);
        font-size: 16px;
        background: var(--newsprint-surface);
        border: 2px dashed var(--newsprint-divider);
    }

    @media (max-width: 1280px) {
        .side-rail { display: none; }
    }
</style>
