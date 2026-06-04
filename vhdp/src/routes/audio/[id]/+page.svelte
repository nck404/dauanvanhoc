<script>
    import { onDestroy, onMount } from "svelte";
    import { page } from "$app/state";
    import { apiFetch } from "$lib/api.js";

    let audioData = $state(null);
    let isBookmarked = $state(false);
    let loading = $state(true);

    let audioEl;
    let isPlaying = $state(false);
    let currentTime = $state(0);
    let duration = $state(0);
    let progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

    function togglePlay() {
        if (!audioEl) return;
        if (isPlaying) {
            audioEl.pause();
        } else {
            audioEl.play().catch(console.error);
        }
        isPlaying = !isPlaying;
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || !seconds) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, "0")}`;
    }

    function handleSeek(e) {
        if (!audioEl || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioEl.currentTime = percent * duration;
    }

    async function toggleBookmark() {
        try {
            const res = await apiFetch(`/api/audios/${page.params.id}`, {
                method: "POST"
            });
            if (res.ok) {
                const result = await res.json();
                isBookmarked = result.isBookmarked;
            }
        } catch (e) {
            console.error(e);
        }
    }

    onMount(async () => {
        document.body.classList.add("paper-theme");
        const audioId = page.params.id;
        try {
            const res = await apiFetch(`/api/audios/${audioId}`);
            if (res.ok) {
                const result = await res.json();
                audioData = result.audio;
                isBookmarked = result.isBookmarked;
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
        if (audioEl) {
            audioEl.volume = 0.8;
        }
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });

    onDestroy(() => {
        if (audioEl) {
            audioEl.pause();
        }
    });
</script>

<svelte:head>
    <title>{audioData?.title ? `${audioData.title} - Dấu Ấn Văn Học` : 'Đang tải... - Dấu Ấn Văn Học'}</title>
</svelte:head>

{#if loading}
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 18px; font-weight: 500;">
        Đang tải...
    </div>
{:else if audioData}

    <audio
        bind:this={audioEl}
        src={audioData.audio_url}
        ontimeupdate={() => (currentTime = audioEl.currentTime)}
        onloadedmetadata={() => (duration = audioEl.duration)}
        onended={() => (isPlaying = false)}
    ></audio>

    <div class="audio-container">
        <div class="split-layout">
            <div class="player-panel comic-card">
                <a href="/audio" class="back-link">
                    <i class="bx bx-left-arrow-alt"></i> Thư viện Audio
                </a>

                <div class="record-wrapper {isPlaying ? 'playing' : ''}">
                    <div class="record">
                        <img
                            src={audioData.cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400"}
                            alt="Cover"
                        />
                        <div class="hole"></div>
                    </div>
                </div>

                <div class="track-info">
                    <h1>{audioData.title}</h1>
                    <p class="author">{audioData.author}</p>
                </div>

                <div class="player-controls">
                    <div
                        class="progress-container"
                        onclick={handleSeek}
                        onkeydown={() => {}}
                        role="slider"
                        tabindex="0"
                        aria-valuenow={progress}
                    >
                        <div class="progress-bar">
                            <div
                                class="progress-fill"
                                style:width="{progress}%"
                            ></div>
                        </div>
                    </div>

                    <div class="time-stamp">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    <div class="buttons">
                        <button class="btn-side"><i class="bx bx-rewind"></i></button>
                        <button class="btn-play" onclick={togglePlay}>
                            <i class="bx {isPlaying ? 'bx-pause' : 'bx-play'}"></i>
                        </button>
                        <button class="btn-side"><i class="bx bx-fast-forward"></i></button>
                    </div>
                </div>

                <div class="action-bar">
                    <button
                        onclick={toggleBookmark}
                        class="favorite-btn"
                        class:active={isBookmarked}
                    >
                        <i class="bx {isBookmarked ? 'bxs-heart' : 'bx-heart'}"></i>
                        <span>{isBookmarked ? "Đã lưu vào thư viện" : "Lưu vào thư viện"}</span>
                    </button>
                </div>

                <div class="extra-meta">
                    <span><i class="bx bx-headphone"></i> Lượt nghe: {audioData.views + 1}</span>
                </div>
            </div>

            <div class="lyrics-panel">
                <div class="lyrics-header">
                    <h2><i class="bx bx-book-reader"></i> Nội dung / Lời thoại</h2>
                </div>
                <div class="lyrics-content">
                    <div class="quill-output">
                        {@html audioData.lyrics}
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 18px; font-weight: 500;">
        Không tìm thấy audio
    </div>
{/if}

<style>
    .audio-container {
        height: 100vh;
        width: 100vw;
        background: transparent;
        overflow: hidden;
        display: flex;
        font-family: 'Space Grotesk', sans-serif;
    }

    .split-layout {
        display: flex;
        width: 100%;
        height: 100%;
        margin: 0 auto;
        max-width: 1600px;
        background: transparent;
    }

    .player-panel {
        width: 460px;
        background: var(--bone);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 40px;
        position: relative;
    }

    .back-link {
        position: absolute;
        top: 30px;
        left: 40px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        color: var(--ink-faint);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.15em;
        text-decoration: none;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--coral);
    }

    .record-wrapper {
        margin-top: 50px;
        width: 250px;
        height: 250px;
        border-radius: 50%;
        background: #1c1a17;
        box-shadow:
            0 25px 50px -15px rgba(21, 20, 15, 0.3),
            inset 0 0 25px rgba(0, 0, 0, 0.8),
            0 0 0 8px var(--line-faint);
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .record {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        position: relative;
        background: #111;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .record img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.85;
    }

    .record .hole {
        position: absolute;
        width: 38px;
        height: 38px;
        background: var(--bg-color);
        border-radius: 50%;
        border: 4px solid #1c1a17;
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6);
    }

    .playing .record {
        animation: spin 12s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .track-info {
        text-align: center;
        margin-top: 35px;
        margin-bottom: 25px;
        width: 100%;
    }

    .track-info h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 800;
        font-size: 22px;
        color: var(--ink);
        margin-bottom: 8px;
        line-height: 1.3;
    }

    .track-info .author {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 15px;
        color: var(--coral);
        font-weight: 500;
    }

    .player-controls {
        width: 100%;
    }

    .progress-container {
        width: 100%;
        height: 20px;
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .progress-bar {
        width: 100%;
        height: 4px;
        background: var(--line);
        border-radius: 99px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--coral);
        transition: width 0.1s linear;
    }

    .time-stamp {
        display: flex;
        justify-content: space-between;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--ink-mute);
        margin-top: 6px;
        margin-bottom: 24px;
    }

    .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
    }

    .btn-side {
        font-size: 24px;
        color: var(--ink-faint);
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.2s;
    }

    .btn-side:hover {
        color: var(--ink);
    }

    .btn-play {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--coral);
        color: white;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 25px -10px rgba(225, 91, 91, 0.4);
        border: none;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-play:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 30px -8px rgba(225, 91, 91, 0.5);
    }

    .action-bar {
        margin-top: 35px;
        width: 100%;
    }

    .favorite-btn {
        width: 100%;
        padding: 12px;
        border-radius: 30px;
        border: 1px solid var(--line);
        background: var(--bone);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: var(--ink-soft);
        cursor: pointer;
        transition: all 0.2s;
    }

    .favorite-btn i {
        font-size: 18px;
    }

    .favorite-btn.active {
        background: var(--coral);
        border-color: var(--coral);
        color: white;
    }

    .favorite-btn:hover {
        border-color: var(--coral);
        color: var(--coral);
    }

    .favorite-btn.active:hover {
        color: white;
        background: var(--coral);
        opacity: 0.9;
    }

    .extra-meta {
        margin-top: auto;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--ink-faint);
    }

    .lyrics-panel {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: transparent;
    }

    .lyrics-header {
        padding: 40px 60px;
        border-bottom: 1px solid var(--line-faint);
    }

    .lyrics-header h2 {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 18px;
        color: var(--ink);
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .lyrics-content {
        flex: 1;
        overflow-y: auto;
        padding: 60px;
    }

    .lyrics-content::-webkit-scrollbar {
        width: 6px;
    }
    .lyrics-content::-webkit-scrollbar-thumb {
        background: var(--line);
        border-radius: 3px;
    }

    .quill-output {
        font-family: 'Playfair Display', serif;
        font-size: 18px;
        line-height: 1.8;
        color: var(--ink-soft);
        max-width: 750px;
        text-align: justify;
    }

    :global(.quill-output p) {
        margin-bottom: 1.5em;
    }
</style>
