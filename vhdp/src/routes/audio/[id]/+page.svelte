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
    let playbackSpeed = $state(1);
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

    function seekBackward() {
        if (!audioEl) return;
        audioEl.currentTime = Math.max(0, audioEl.currentTime - 15);
    }

    function seekForward() {
        if (!audioEl) return;
        audioEl.currentTime = Math.min(duration, audioEl.currentTime + 15);
    }

    function cycleSpeed() {
        const speeds = [1, 1.25, 1.5, 2, 0.8];
        const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
        playbackSpeed = speeds[nextIdx];
        if (audioEl) {
            audioEl.playbackRate = playbackSpeed;
        }
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
            audioEl.playbackRate = playbackSpeed;
        }
    });

    onDestroy(() => {
        if (audioEl) {
            audioEl.pause();
        }
    });
</script>

<svelte:head>
    <title>{audioData?.title ? `${audioData.title} - Dấu Ấn Văn Học` : 'Đang tải...'}</title>
</svelte:head>

{#if loading}
    <div class="loader-container">
        <div class="loader-spinner"></div>
    </div>
{:else if audioData}
    <audio
        bind:this={audioEl}
        src={audioData.audio_url}
        ontimeupdate={() => {
            if (audioEl) {
                currentTime = audioEl.currentTime;
            }
        }}
        onloadedmetadata={() => {
            if (audioEl) {
                duration = audioEl.duration;
            }
        }}
        onended={() => (isPlaying = false)}
    ></audio>

    <div class="spotify-player-root">
        <div class="spotify-grid">
            <div class="player-sidebar">
                <a href="/audio" class="back-navigation-btn">
                    <i class="bx bx-chevron-left"></i>
                    <span>Thư viện Audio</span>
                </a>

                <div class="podcast-cover-box">
                    <img
                        src={audioData.cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400"}
                        alt="Podcast Cover"
                        class="podcast-cover-image"
                    />
                </div>

                <div class="podcast-details">
                    <h1 class="podcast-title">{audioData.title}</h1>
                    <p class="podcast-host">{audioData.author}</p>
                </div>

                <div class="player-controls-container">
                    <div class="timeline-row">
                        <span class="time-label">{formatTime(currentTime)}</span>
                        <div
                            class="timeline-track-outer"
                            onclick={handleSeek}
                            onkeydown={() => {}}
                            role="slider"
                            tabindex="0"
                            aria-valuenow={progress}
                        >
                            <div class="timeline-track-inner">
                                <div
                                    class="timeline-progress-fill"
                                    style:width="{progress}%"
                                ></div>
                            </div>
                        </div>
                        <span class="time-label">{formatTime(duration)}</span>
                    </div>

                    <div class="controls-action-row">
                        <button class="cycle-speed-btn" onclick={cycleSpeed}>
                            {playbackSpeed}x
                        </button>

                        <button class="skip-btn" onclick={seekBackward}>
                            <i class="bx bx-undo"></i>
                            <span class="skip-text">15</span>
                        </button>

                        <button class="main-toggle-play-btn" onclick={togglePlay}>
                            <i class="bx {isPlaying ? 'bx-pause' : 'bx-play'}"></i>
                        </button>

                        <button class="skip-btn" onclick={seekForward}>
                            <i class="bx bx-redo"></i>
                            <span class="skip-text">15</span>
                        </button>

                        <button
                            class="spotify-fav-btn"
                            class:saved={isBookmarked}
                            onclick={toggleBookmark}
                        >
                            <i class="bx {isBookmarked ? 'bxs-heart' : 'bx-heart'}"></i>
                        </button>
                    </div>
                </div>

                <div class="podcast-extra-row">
                    <div class="listeners-badge">
                        <i class="bx bx-headphone"></i>
                        <span>{audioData.views + 1} lượt nghe</span>
                    </div>
                </div>
            </div>

            <div class="transcript-panel">
                <div class="transcript-title-row">
                    <h2><i class="bx bx-detail"></i> Lời thoại / Bản ghi</h2>
                </div>
                <div class="transcript-body-scroll">
                    <div class="quill-html-content">
                        {@html audioData.lyrics}
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="loader-container">
        <p class="error-msg">Không tìm thấy Audio</p>
    </div>
{/if}

<style>
    :global(body) {
        background-color: #0b0b0b !important;
        color: #ffffff !important;
    }

    .loader-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        background: #0b0b0b;
    }

    .loader-spinner {
        width: 45px;
        height: 45px;
        border: 3px solid #1c1c1c;
        border-top-color: #1db954;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-msg {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        color: #b3b3b3;
    }

    .spotify-player-root {
        height: 100vh;
        width: 100vw;
        background: linear-gradient(180deg, #181818 0%, #0c0c0c 100%);
        overflow: hidden;
        font-family: 'Space Grotesk', sans-serif;
        display: flex;
        padding-top: 10px;
    }

    .spotify-grid {
        display: grid;
        grid-template-columns: 460px 1fr;
        width: 100%;
        height: 100%;
        max-width: 1600px;
        margin: 0 auto;
    }

    .player-sidebar {
        background: #121212;
        border-right: 1px solid #282828;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        box-sizing: border-box;
    }

    .back-navigation-btn {
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 700;
        color: #b3b3b3;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.12em;
        text-decoration: none;
        transition: color 0.2s;
        margin-bottom: 30px;
    }

    .back-navigation-btn:hover {
        color: #ffffff;
    }

    .podcast-cover-box {
        width: 280px;
        height: 280px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(0,0,0,0.7);
        margin-bottom: 30px;
    }

    .podcast-cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .podcast-details {
        text-align: center;
        width: 100%;
        margin-bottom: 30px;
    }

    .podcast-title {
        font-size: 24px;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 8px;
        line-height: 1.2;
    }

    .podcast-host {
        font-size: 14px;
        color: #b3b3b3;
        font-weight: 500;
    }

    .player-controls-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
    }

    .timeline-row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
    }

    .time-label {
        font-family: monospace;
        font-size: 11px;
        color: #a7a7a7;
        min-width: 32px;
    }

    .timeline-track-outer {
        flex: 1;
        height: 16px;
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .timeline-track-inner {
        width: 100%;
        height: 4px;
        background: #4f4f4f;
        border-radius: 2px;
        overflow: hidden;
        position: relative;
    }

    .timeline-progress-fill {
        height: 100%;
        background: #1db954;
        border-radius: 2px;
        transition: width 0.1s linear;
    }

    .timeline-track-outer:hover .timeline-progress-fill {
        background: #1ed760;
    }

    .controls-action-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
    }

    .cycle-speed-btn {
        font-size: 12px;
        font-weight: 700;
        color: #b3b3b3;
        border: 1px solid #b3b3b3;
        border-radius: 4px;
        padding: 2px 6px;
        min-width: 44px;
        text-align: center;
    }

    .cycle-speed-btn:hover {
        color: #ffffff;
        border-color: #ffffff;
    }

    .skip-btn {
        font-size: 22px;
        color: #b3b3b3;
        display: flex;
        align-items: center;
        position: relative;
    }

    .skip-btn:hover {
        color: #ffffff;
    }

    .skip-text {
        position: absolute;
        font-size: 8px;
        font-family: sans-serif;
        font-weight: 700;
        top: 55%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .main-toggle-play-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #ffffff;
        color: #000000;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }

    .main-toggle-play-btn:hover {
        transform: scale(1.06);
    }

    .spotify-fav-btn {
        font-size: 22px;
        color: #b3b3b3;
    }

    .spotify-fav-btn:hover {
        color: #ffffff;
    }

    .spotify-fav-btn.saved {
        color: #1db954;
    }

    .podcast-extra-row {
        margin-top: auto;
    }

    .listeners-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #b3b3b3;
        background: #282828;
        padding: 6px 14px;
        border-radius: 20px;
    }

    .transcript-panel {
        display: flex;
        flex-direction: column;
        background: #181818;
        height: 100%;
        overflow: hidden;
    }

    .transcript-title-row {
        padding: 40px 60px 20px;
        border-bottom: 1px solid #282828;
    }

    .transcript-title-row h2 {
        font-size: 20px;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .transcript-body-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 40px 60px 80px;
    }

    .transcript-body-scroll::-webkit-scrollbar {
        width: 8px;
    }

    .transcript-body-scroll::-webkit-scrollbar-thumb {
        background: #3e3e3e;
        border-radius: 4px;
    }

    .quill-html-content {
        font-size: 16px;
        line-height: 1.8;
        color: #b3b3b3;
        max-width: 800px;
    }

    :global(.quill-html-content p) {
        margin-bottom: 1.5em;
    }

    @media (max-width: 1024px) {
        .spotify-grid {
            grid-template-columns: 1fr;
        }

        .player-sidebar {
            border-right: none;
            border-bottom: 1px solid #282828;
            height: auto;
        }

        .transcript-panel {
            height: auto;
            overflow: visible;
        }

        .transcript-body-scroll {
            overflow: visible;
            height: auto;
        }
    }
</style>
