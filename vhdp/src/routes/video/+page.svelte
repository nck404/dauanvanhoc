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

<div class="video-dashboard">
    <div class="header-section">
        <span class="label">Ấn bản truyền hình</span>
        <h1>Thư viện <em>Video</em> &amp; <em>Tư liệu</em><span class="dot">.</span></h1>
        <p class="lead">Góc chia sẻ nội dung video tư liệu lịch sử, điện ảnh địa phương và kịch nghệ truyền thống.</p>
    </div>

<div class="grid">
        {#if !loaded}
            {#each Array(SKELETON_COUNT).fill(0) as _, i}
                <div class="comic-card video-card">
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
            <div class="empty">
                Chưa có Video nào được thêm vào hệ thống.
            </div>
        {:else}
            {#each videos as video}
                <a href="/video/{video.id}" class="comic-card video-card">
                    <div class="cover-box">
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

    .video-dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 40px 120px;
    }

    .header-section {
        text-align: center;
        margin-bottom: 60px;
        border-bottom: 1px solid var(--line);
        padding-bottom: 40px;
    }

    .header-section .label {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--coral);
        margin-bottom: 15px;
        display: inline-block;
    }

    .header-section h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 800;
        font-size: clamp(32px, 4vw, 48px);
        line-height: 1.2;
        margin-bottom: 15px;
        color: var(--ink);
    }

    .header-section h1 em {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-weight: 500;
        color: var(--coral);
    }

    .header-section h1 .dot {
        color: var(--coral);
    }

    .header-section .lead {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        color: var(--ink-soft);
        max-width: 50ch;
        margin: 0 auto;
        line-height: 1.6;
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

