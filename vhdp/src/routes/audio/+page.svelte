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
                                <img src={audio.cover_url} alt="Cover" />
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
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95),
            rgba(255, 255, 255, 0.7)
        );
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 40px;
        box-shadow: 0 20px 50px rgba(26, 21, 21, 0.12);
        position: relative;
        overflow: hidden;
    }

    .hero::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
            70% 60% at 20% 10%,
            rgba(225, 91, 91, 0.18),
            rgba(225, 91, 91, 0)
        );
        z-index: 0;
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
        letter-spacing: 0.2em;
        padding: 6px 14px;
        border-radius: 999px;
        background: var(--coral);
        color: #fff;
        box-shadow: 0 12px 18px rgba(225, 91, 91, 0.35);
    }

    .hero h1 {
        font-family: "Space Grotesk", sans-serif;
        font-size: clamp(34px, 4vw, 54px);
        margin: 18px 0 12px;
        color: var(--ink);
    }

    .hero h1 em {
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-weight: 500;
        color: var(--coral);
    }

    .dot {
        color: var(--coral);
    }

    .subtitle {
        font-family: "Playfair Display", serif;
        font-style: italic;
        color: var(--ink-soft);
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
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--line-faint);
        border-radius: 16px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 10px 18px rgba(26, 21, 21, 0.08);
    }

    .stat-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--ink-faint);
        font-family: "JetBrains Mono", monospace;
    }

    .stat strong {
        font-size: 18px;
        color: var(--ink);
    }

    .hero-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        background: rgba(26, 21, 21, 0.04);
        border-radius: 22px;
        padding: 26px;
        border: 1px dashed var(--line);
    }

    .reel {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, 0.9),
            rgba(26, 21, 21, 0.08)
        );
        border: 1px solid rgba(26, 21, 21, 0.2);
        position: relative;
        display: grid;
        place-items: center;
        box-shadow: inset 0 10px 30px rgba(26, 21, 21, 0.12);
    }

    .reel-core {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--coral);
        box-shadow: 0 8px 18px rgba(225, 91, 91, 0.4);
    }

    .reel-ring {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 1px dashed rgba(26, 21, 21, 0.3);
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
        background: linear-gradient(
            180deg,
            var(--coral),
            rgba(225, 91, 91, 0.2)
        );
        border-radius: 999px;
        opacity: 0.8;
    }

    .visual-tag {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--ink-faint);
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
        font-family: "Space Grotesk", sans-serif;
        font-size: 28px;
        color: var(--ink);
    }

    .section-head p {
        color: var(--ink-soft);
    }

    .section-actions {
        display: flex;
        gap: 10px;
    }

    .chip {
        border-radius: 999px;
        padding: 8px 16px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        border: 1px solid var(--line);
        background: var(--coral);
        color: #fff;
    }

    .chip-ghost {
        background: transparent;
        color: var(--ink);
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
        border-radius: 20px;
        border: 1px solid var(--line-faint);
        background: rgba(255, 255, 255, 0.85);
        box-shadow: 0 16px 30px rgba(26, 21, 21, 0.08);
        text-decoration: none;
        color: inherit;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .audio-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 22px 40px rgba(26, 21, 21, 0.12);
    }

    .audio-item .index {
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        letter-spacing: 0.16em;
        color: var(--ink-faint);
    }

    .cover {
        position: relative;
        width: 120px;
        height: 120px;
        border-radius: 16px;
        overflow: hidden;
        background: linear-gradient(135deg, var(--bg-wash), var(--bone));
        border: 1px solid var(--line-faint);
        display: grid;
        place-items: center;
    }

    .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .cover-placeholder {
        font-size: 34px;
        color: var(--ink-faint);
    }

    .cover-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            135deg,
            rgba(225, 91, 91, 0.75),
            rgba(26, 21, 21, 0.65)
        );
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
        font-family: "Space Grotesk", sans-serif;
        font-size: 18px;
        color: var(--ink);
    }

    .content p {
        font-family: "Playfair Display", serif;
        font-style: italic;
        color: var(--ink-mute);
    }

    .tag {
        font-family: "JetBrains Mono", monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--coral);
        background: rgba(225, 91, 91, 0.12);
        width: fit-content;
        padding: 4px 10px;
        border-radius: 999px;
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
        color: var(--ink-faint);
        background: rgba(26, 21, 21, 0.05);
        padding: 8px 12px;
        border-radius: 999px;
    }

    .arrow {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--coral);
        color: #fff;
        box-shadow: 0 10px 18px rgba(225, 91, 91, 0.35);
    }

    .empty {
        text-align: center;
        padding: 60px 20px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px dashed var(--line);
        border-radius: 16px;
        font-family: "Space Grotesk", sans-serif;
        color: var(--ink-mute);
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

