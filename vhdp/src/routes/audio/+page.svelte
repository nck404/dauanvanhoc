<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import SkeletonCard from "$lib/components/SkeletonCard.svelte";

    let audios = $state([]);
    let loaded = $state(false);
    const SKELETON_COUNT = 5;
    const totalAudios = () => audios.length;

    onMount(async () => {
        document.body.classList.add("paper-theme");
        try {
            const res = await apiFetch("/api/audios");
            if (res.ok) {
                const data = await res.json();
                audios = data.audios || [];
            }
        } catch (e) {
            console.error(e);
        }
        const timer = setTimeout(() => {
            loaded = true;
        }, 420);
        return () => {
            clearTimeout(timer);
            document.body.classList.remove("paper-theme");
        };
    });
</script>

<svelte:head>
    <title>Audio Sách - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="audio-page">
    <section class="hero">
        <div class="hero-content">
            <span class="pill">Audio studio</span>
            <h1>
                Không gian <em>nghe</em> mới cho <em>văn học</em>
                <span class="dot">.</span>
            </h1>
            <p class="subtitle">
                Tuyển tập giọng đọc địa phương, sắp xếp như một playlist đầy cảm
                xúc.
            </p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-label">Tác phẩm</span>
                    <strong>{totalAudios()}</strong>
                </div>
                <div class="stat">
                    <span class="stat-label">Chủ đề</span>
                    <strong>Địa phương</strong>
                </div>
                <div class="stat">
                    <span class="stat-label">Chế độ</span>
                    <strong>Studio</strong>
                </div>
            </div>
        </div>
        <div class="hero-visual">
            <div class="reel">
                <div class="reel-core"></div>
                <div class="reel-ring"></div>
            </div>
            <div class="wave">
                {#each Array(16).fill(0) as _, i}
                    <span style={`--i:${i}`}></span>
                {/each}
            </div>
            <div class="visual-tag">Dấu Ấn Audio Lab</div>
        </div>
    </section>

    <section class="playlist">
        <div class="section-head">
            <div>
                <h2>Playlist nổi bật</h2>
                <p>Thiết kế lại theo nhịp nghe: rõ ràng, tập trung, nổi bật.</p>
            </div>
            <div class="section-actions">
                <button class="chip">All</button>
                <button class="chip chip-ghost">Mới</button>
                <button class="chip chip-ghost">Phổ biến</button>
            </div>
        </div>

        {#if !loaded}
            <div class="list">
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <div class="audio-item skeleton">
                        <div class="cover">
                            <SkeletonCard type="audio" />
                        </div>
                        <div class="meta">
                            <SkeletonCard type="text" />
                            <SkeletonCard type="text" />
                        </div>
                        <div class="cta">
                            <SkeletonCard type="text" />
                        </div>
                    </div>
                {/each}
            </div>
        {:else if !audios.length}
            <div class="empty">Chưa có Audio nào được thêm vào hệ thống.</div>
        {:else}
            <div class="list">
                {#each audios as audio, i}
                    <a href="/audio/{audio.id}" class="audio-item">
                        <div class="index">
                            #{String(i + 1).padStart(2, "0")}
                        </div>
                        <div class="cover">
                            {#if audio.cover_url}
                                <img src={audio.cover_url} alt="Cover" loading="lazy" decoding="async" />
                            {:else}
                                <div class="cover-placeholder">
                                    <i class="bx bxs-music"></i>
                                </div>
                            {/if}
                            <div class="cover-overlay">
                                <i class="bx bx-play"></i>
                            </div>
                        </div>
                        <div class="content">
                            <span class="tag">Audio</span>
                            <h3>{audio.title}</h3>
                            <p>{audio.author}</p>
                        </div>
                        <div class="cta">
                            <div class="listen">
                                <i class="bx bx-headphone"></i>
                                <span>{audio.views || 0} lượt nghe</span>
                            </div>
                            <span class="arrow"
                                ><i class="bx bx-right-arrow-alt"></i></span
                            >
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </section>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Pattaya&family=Space+Grotesk:wght@300..700&display=swap');

    .audio-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 70px 40px 120px;
        display: flex;
        flex-direction: column;
        gap: 60px;
    }

    .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
        gap: 40px;
        align-items: center;
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-ink);
        padding: 40px;
        box-shadow: var(--shadow-hard);
        position: relative;
        overflow: hidden;
    }

    .hero-content,
    .hero-visual {
        position: relative;
        z-index: 1;
    }

    .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        padding: 6px 14px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
    }

    .hero h1 {
        font-family: "Space Grotesk", sans-serif;
        font-size: clamp(34px, 4vw, 54px);
        margin: 18px 0 12px;
        color: var(--newsprint-ink);
        font-weight: 800;
    }

    .hero h1 em {
        font-family: "Pattaya", sans-serif;
        font-style: normal;
        font-weight: 400;
        color: var(--newsprint-red);
    }

    .dot {
        color: var(--newsprint-red);
    }

    .subtitle {
        font-family: "Playfair Display", serif;
        font-style: italic;
        color: var(--newsprint-neutral-600);
        font-size: 18px;
        max-width: 520px;
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 24px;
    }

    .stat {
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-ink);
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 2px 2px 0px var(--newsprint-ink);
    }

    .stat-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-muted);
        font-family: "JetBrains Mono", monospace;
    }

    .stat strong {
        font-size: 18px;
        color: var(--newsprint-ink);
    }

    .hero-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        background: var(--newsprint-surface);
        padding: 26px;
        border: 1px dashed var(--newsprint-ink);
    }

    .reel {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-ink);
        position: relative;
        display: grid;
        place-items: center;
    }

    .reel-core {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--newsprint-red);
        border: 1px solid var(--newsprint-ink);
    }

    .reel-ring {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 1px dashed var(--newsprint-ink);
    }

    .wave {
        display: grid;
        grid-template-columns: repeat(16, 1fr);
        gap: 6px;
        width: 100%;
        align-items: end;
    }

    .wave span {
        height: calc(12px + (var(--i) * 2px));
        background: var(--newsprint-red);
        opacity: 0.8;
    }

    .visual-tag {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--newsprint-muted);
    }

    .playlist {
        display: flex;
        flex-direction: column;
        gap: 26px;
    }

    .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
    }

    .section-head h2 {
        font-family: "Playfair Display", serif;
        font-size: 28px;
        color: var(--newsprint-ink);
        font-weight: 900;
    }

    .section-head p {
        color: var(--newsprint-neutral-600);
        font-family: "Lora", serif;
        font-style: italic;
        font-size: 14px;
    }

    .section-actions {
        display: flex;
        gap: 10px;
    }

    .chip {
        padding: 8px 16px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-ink);
        color: var(--newsprint-bg);
        transition: all 0.2s ease-out;
    }

    .chip-ghost {
        background: transparent;
        color: var(--newsprint-ink);
    }

    .chip-ghost:hover {
        background: var(--newsprint-surface);
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .audio-item {
        display: grid;
        grid-template-columns: auto 120px minmax(0, 1fr) auto;
        align-items: center;
        gap: 20px;
        padding: 18px 20px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        text-decoration: none;
        color: inherit;
        transition: all 0.2s ease-out;
    }

    .audio-item:hover {
        background: var(--newsprint-surface);
        box-shadow: var(--shadow-hard);
        transform: translate(-2px, -2px);
    }

    .audio-item .index {
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        letter-spacing: 0.16em;
        color: var(--newsprint-muted);
    }

    .cover {
        position: relative;
        width: 120px;
        height: 120px;
        overflow: hidden;
        background: var(--newsprint-surface);
        border: 1px solid var(--newsprint-ink);
        display: grid;
        place-items: center;
    }

    .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(100%);
        transition: filter 0.3s ease-out;
    }

    .audio-item:hover .cover img {
        filter: grayscale(0%);
    }

    .cover-placeholder {
        font-size: 34px;
        color: var(--newsprint-muted);
    }

    .cover-overlay {
        position: absolute;
        inset: 0;
        background: rgba(30, 27, 24, 0.4);
        display: grid;
        place-items: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        color: #fff;
        font-size: 36px;
    }

    .audio-item:hover .cover-overlay {
        opacity: 1;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .content h3 {
        font-family: "Playfair Display", serif;
        font-size: 20px;
        color: var(--newsprint-ink);
        font-weight: 700;
    }

    .content p {
        font-family: "Lora", serif;
        font-style: italic;
        color: var(--newsprint-neutral-600);
        font-size: 14px;
    }

    .tag {
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-red);
        background: var(--newsprint-surface);
        width: fit-content;
        padding: 4px 10px;
        border: 1px solid var(--newsprint-ink);
    }

    .cta {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .listen {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: var(--newsprint-ink);
        background: var(--newsprint-surface);
        padding: 8px 12px;
        border: 1px solid var(--newsprint-ink);
    }

    .arrow {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-ink);
        color: var(--newsprint-ink);
        transition: all 0.2s ease-out;
    }

    .audio-item:hover .arrow {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }

    .empty {
        text-align: center;
        padding: 60px 20px;
        background: var(--newsprint-white);
        border: 1px dashed var(--newsprint-ink);
        font-family: "Space Grotesk", sans-serif;
        color: var(--newsprint-muted);
        font-size: 15px;
    }

    .skeleton {
        pointer-events: none;
    }

    .skeleton .cover {
        padding: 16px;
    }

    @media (max-width: 960px) {
        .hero {
            grid-template-columns: 1fr;
        }

        .section-head {
            flex-direction: column;
            align-items: flex-start;
        }

        .audio-item {
            grid-template-columns: 90px minmax(0, 1fr);
            grid-template-rows: auto auto;
        }

        .audio-item .index,
        .audio-item .cta {
            grid-column: 2 / -1;
        }

        .cta {
            justify-content: space-between;
            width: 100%;
        }
    }

    @media (max-width: 640px) {
        .audio-page {
            padding: 50px 20px 90px;
        }

        .hero {
            padding: 28px;
        }

        .stats {
            grid-template-columns: 1fr;
        }

        .audio-item {
            grid-template-columns: 1fr;
            text-align: left;
        }

        .cover {
            width: 100%;
            height: 180px;
        }

        .cta {
            justify-content: flex-start;
        }
    }
</style>

