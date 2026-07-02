<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import SkeletonCard from "$lib/components/SkeletonCard.svelte";

    let videos = $state([]);
    let loaded = $state(false);
    const SKELETON_COUNT = 6;

    onMount(async () => {
        document.body.classList.add("paper-theme");
        try {
            const res = await apiFetch("/api/videos");
            if (res.ok) {
                const data = await res.json();
                videos = data.videos || [];
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
            <span>Video Tư Liệu</span>
        </div>
        
        <h1 class="page-title">
            Thư viện <em class="page-accent">video</em> &amp; tư liệu<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Góc chia sẻ nội dung video tư liệu lịch sử, điện ảnh địa phương và kịch nghệ truyền thống.
        </p>

        <div class="editorial-search">
            <i class="bx bx-search editorial-search-icon"></i>
            <input
                type="text"
                placeholder="Tìm kiếm tác phẩm hoặc tác giả..."
                class="editorial-search-input"
            />
            <button class="editorial-search-btn">Tìm kiếm</button>
        </div>
    </header>

    <section class="content-section">
        <div class="section-header">
            <div class="section-count">{videos.length} Video</div>
            <div class="small-ornament">✧✧✧✧</div>
            <div class="section-updated">Cập nhật liên tục</div>
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
        {:else if !videos.length}
            <div class="empty empty--center">
                <div class="empty-symbol">§</div>
                <p>Không tìm thấy video nào.</p>
            </div>
        {:else}
            {#each videos as video}
                <a href="/video/{video.id}" class="newsprint-card hard-shadow-hover video-card">
                    <div class="cover-box border-b-2 border-[#111111]">
                        {#if video.cover_url}
                            <img src={video.cover_url} alt="Cover" />
                        {:else}
                            <div class="placeholder"><i class="bx bx-video"></i></div>
                        {/if}
                        <div class="play-overlay">
                            <i class="bx bx-play-circle"></i>
                        </div>
                    </div>
                    <div class="info">
                        <span class="index-tag">Video</span>
                        <h3>{video.title}</h3>
                        <p>{video.author}</p>
                        <div class="meta">
                            <span><i class="bx bx-show"></i> {video.views} lượt xem</span>
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
        padding: 100px 24px 120px;
    }

    .page-header {
        padding: 60px 0 80px;
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
        max-width: 44ch;
        margin-bottom: 32px;
    }

    .search-wrapper {
        border: 2px solid var(--newsprint-ink);
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
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 32px;
    }

    .video-card {
        text-decoration: none;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .cover-box {
        aspect-ratio: 16 / 9;
        position: relative;
        overflow: hidden;
        background: var(--paper-warm);
    }

    .cover-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
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

    .play-overlay {
        position: absolute;
        inset: 0;
        background: rgba(21, 20, 15, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.25s;
    }

    .play-overlay i {
        font-size: 52px;
        color: white;
    }

    .video-card:hover .play-overlay {
        opacity: 1;
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

    .info .index-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--coral);
        display: block;
        margin-bottom: 8px;
    }

    .info h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
    }

    .info p {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 13px;
        color: var(--ink-mute);
        margin-bottom: 12px;
    }

    .meta {
        margin-top: auto;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 11px;
        color: var(--coral);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px;
        color: var(--ink-soft);
        font-size: 16px;
        background: var(--bone);
        border: 1px dashed var(--line);
        border-radius: 14px;
    }

    @media (max-width: 1280px) {
        .side-rail { display: none; }
    }
</style>

