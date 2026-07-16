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
    
    let transcriptContainer = $state(null);
    let lastHighlightedIndex = -1;

    $effect(() => {
        if (transcriptContainer && audioData?.lyrics && duration > 0) {
            const paragraphs = Array.from(transcriptContainer.querySelectorAll('p'));
            if (paragraphs.length > 0) {
                const index = Math.min(
                    paragraphs.length - 1, 
                    Math.floor((currentTime / duration) * paragraphs.length)
                );
                
                if (index !== lastHighlightedIndex) {
                    paragraphs.forEach((p, i) => {
                        if (i === index) {
                            p.classList.add('highlighted-text');
                            p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            p.classList.remove('highlighted-text');
                        }
                    });
                    lastHighlightedIndex = index;
                }
            }
        }
    });

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

    let toastMessage = $state("");
    let toastTimeout;

    function showToast(msg) {
        toastMessage = msg;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastMessage = "";
        }, 3000);
    }

    async function toggleBookmark() {
        // Optimistic UI Update
        const previousState = isBookmarked;
        isBookmarked = !isBookmarked;
        
        if (isBookmarked) {
            showToast("Đã thêm vào Thư viện");
        } else {
            showToast("Đã xóa khỏi Thư viện");
        }

        try {
            const res = await apiFetch(`/api/audios/${page.params.id}`, {
                method: "POST"
            });
            if (res.ok) {
                const result = await res.json();
                // Sync with server if there's a discrepancy
                if (isBookmarked !== result.isBookmarked) {
                    isBookmarked = result.isBookmarked;
                }
            } else {
                // Revert on error
                isBookmarked = previousState;
                showToast("Lỗi: Không thể cập nhật");
            }
        } catch (e) {
            console.error(e);
            isBookmarked = previousState;
            showToast("Lỗi: Không thể kết nối");
        }
    }

    onMount(() => {
        document.body.classList.add("paper-theme");
        // Hide navbar if there is one
        document.body.classList.add("hide-navbar");
        
        const loadAudio = async () => {
            const audioId = page.params.id;
            try {
                const res = await apiFetch(`/api/audios/${audioId}`);
                if (res.ok) {
                    const result = await res.json();
                    
                    const API_BASE = "https://vhdp-worker.frenda.workers.dev";
                    if (result.audio && result.audio.audio_url && result.audio.audio_url.startsWith('/uploads/') && !result.audio.audio_url.startsWith('http')) {
                        result.audio.audio_url = `${API_BASE}${result.audio.audio_url}`;
                    }
                    if (result.audio && result.audio.cover_url && result.audio.cover_url.startsWith('/uploads/') && !result.audio.cover_url.startsWith('http')) {
                        result.audio.cover_url = `${API_BASE}${result.audio.cover_url}`;
                    }
                    
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
        };

        loadAudio();
        
        return () => {
            document.body.classList.remove("paper-theme");
            document.body.classList.remove("hide-navbar");
        };
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
    <div class="loader-cover">
        <div class="spinner"></div>
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

    <div class="reader-container dot-grid-bg newsprint-texture">
        <a href="/audio" class="floating-btn back" title="Quay lại">
            <i class="bx bx-left-arrow-alt"></i>
        </a>

        <button
            onclick={toggleBookmark}
            class="floating-btn bookmark"
            class:active={isBookmarked}
            title={isBookmarked ? "Xóa khỏi thư viện" : "Thêm vào thư viện"}
        >
            <i class="bx {isBookmarked ? 'bxs-heart' : 'bx-heart'}"></i>
        </button>

        <div class="reading-workspace">
            <div class="book-page-sim newsprint-card hard-shadow">
                <div class="book-page-inner">
                    <div class="book-cover-design">
                        {#if audioData.cover_url}
                            <img src={audioData.cover_url} alt="Cover" class="cover-image-small" />
                        {/if}
                        <h1>{audioData.title}</h1>
                        <h3>{audioData.author}</h3>
                        <div class="ornament">❧</div>
                    </div>

                    <div class="transcript-scroll" bind:this={transcriptContainer}>
                        <div class="quill-html-content">
                            {@html audioData.lyrics}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fixed bottom audio player -->
        <div class="audio-bottom-bar newsprint-card hard-shadow">
            <div class="audio-bar-inner">
                <button class="cycle-speed-btn" onclick={cycleSpeed}>{playbackSpeed}x</button>
                <button class="skip-btn" onclick={seekBackward}><i class="bx bx-rewind"></i></button>
                
                <button class="play-btn newsprint-btn newsprint-btn--primary" onclick={togglePlay}>
                    <i class="bx {isPlaying ? 'bx-pause' : 'bx-play'}"></i>
                </button>

                <button class="skip-btn" onclick={seekForward}><i class="bx bx-fast-forward"></i></button>

                <div class="timeline-container">
                    <span class="time-text">{formatTime(currentTime)}</span>
                    <div
                        class="timeline-track"
                        onclick={handleSeek}
                        onkeydown={() => {}}
                        role="slider"
                        tabindex="0"
                        aria-valuenow={progress}
                    >
                        <div class="timeline-fill" style:width="{progress}%"></div>
                    </div>
                    <span class="time-text">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="loader-cover">
        <p class="error-msg font-mono">Không tìm thấy Audio</p>
    </div>
{/if}

{#if toastMessage}
    <div class="newsprint-toast">
        {toastMessage}
    </div>
{/if}

<style>
    :global(body.hide-navbar nav) {
        display: none !important;
    }

    .loader-cover {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        background: var(--newsprint-surface);
        position: fixed;
        inset: 0;
        z-index: 9999;
    }

    .spinner {
        width: 45px;
        height: 45px;
        border: 3px solid var(--newsprint-ink);
        border-top-color: var(--newsprint-red);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-msg {
        font-size: 16px;
        color: var(--newsprint-ink);
    }

    .reader-container {
        display: flex;
        height: 100vh;
        width: 100vw;
        position: fixed;
        inset: 0;
        overflow: hidden;
        background: var(--newsprint-bg);
        z-index: 1000; /* overlay everything */
    }

    .floating-btn {
        position: absolute;
        top: 24px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        color: var(--newsprint-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 100;
        box-shadow: 2px 2px 0 rgba(0,0,0,1);
        transition: all 0.2s;
    }

    .floating-btn:hover {
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--newsprint-red);
        border-color: var(--newsprint-red);
        color: var(--newsprint-red);
    }

    .floating-btn.back { left: 24px; }
    .floating-btn.bookmark { right: 24px; }
    .floating-btn.bookmark.active { color: var(--newsprint-red); }

    .reading-workspace {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px 20px 100px; /* leave space for bottom bar */
        height: 100%;
        box-sizing: border-box;
    }

    .book-page-sim {
        background: var(--newsprint-white);
        width: 100%;
        max-width: 800px;
        height: 100%;
        border: 2px solid var(--newsprint-ink);
        display: flex;
        flex-direction: column;
    }

    .book-page-inner {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 40px 40px 0;
        overflow: hidden;
    }

    .book-cover-design {
        text-align: center;
        border-bottom: 2px solid var(--newsprint-ink);
        padding-bottom: 30px;
        margin-bottom: 30px;
    }

    .cover-image-small {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border: 2px solid var(--newsprint-ink);
        margin: 0 auto 20px;
        display: block;
    }

    .book-cover-design h1 {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: 32px;
        color: var(--newsprint-ink);
        margin-bottom: 8px;
    }

    .book-cover-design h3 {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        color: var(--newsprint-neutral-600);
        text-transform: uppercase;
    }

    .ornament {
        font-size: 24px;
        color: var(--newsprint-red);
        margin-top: 15px;
    }

    .transcript-scroll {
        flex: 1;
        overflow-y: auto;
        padding-right: 15px;
        padding-bottom: 40px;
        scroll-behavior: smooth;
    }

    .transcript-scroll::-webkit-scrollbar { width: 6px; }
    .transcript-scroll::-webkit-scrollbar-track { background: transparent; }
    .transcript-scroll::-webkit-scrollbar-thumb { background: var(--newsprint-divider); border-radius: 4px; }
    .transcript-scroll::-webkit-scrollbar-thumb:hover { background: var(--newsprint-ink); }

    .quill-html-content {
        font-family: 'Lora', serif;
        font-size: 18px;
        line-height: 1.8;
        color: var(--newsprint-ink-soft);
    }

    :global(.quill-html-content p) {
        margin-bottom: 1.5em;
        transition: all 0.3s ease;
        padding: 4px 12px;
        border-left: 2px solid transparent;
    }
    
    :global(.quill-html-content p.highlighted-text) {
        color: var(--newsprint-ink);
        background: var(--newsprint-surface);
        border-left-color: var(--newsprint-red);
        font-weight: 600;
    }

    .audio-bottom-bar {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 800px;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        padding: 16px 24px;
        z-index: 100;
    }

    .audio-bar-inner {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .cycle-speed-btn {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        border: 2px solid var(--newsprint-ink);
        background: transparent;
        color: var(--newsprint-ink);
        padding: 4px 8px;
        cursor: pointer;
        min-width: 50px;
    }

    .cycle-speed-btn:hover {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .skip-btn {
        font-size: 28px;
        background: transparent;
        border: none;
        color: var(--newsprint-ink);
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: color 0.2s;
    }

    .skip-btn:hover { color: var(--newsprint-red); }

    .play-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        flex-shrink: 0;
    }

    .timeline-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .time-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--newsprint-ink);
        min-width: 40px;
    }

    .timeline-track {
        flex: 1;
        height: 6px;
        background: var(--newsprint-divider);
        cursor: pointer;
        position: relative;
    }

    .timeline-fill {
        height: 100%;
        background: var(--newsprint-red);
        position: absolute;
        top: 0;
        left: 0;
    }

    @media (max-width: 768px) {
        .audio-bottom-bar {
            width: 100%;
            bottom: 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
        }

        .book-page-sim {
            border: none;
            border-left: 1px solid var(--newsprint-divider);
            border-right: 1px solid var(--newsprint-divider);
        }

        .floating-btn {
            top: 12px;
            width: 40px;
            height: 40px;
            font-size: 20px;
        }

        .reading-workspace {
            padding: 80px 0 100px;
        }
    }

    .newsprint-toast {
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: toast-fade-in 0.3s ease forwards;
        pointer-events: none;
    }

    @keyframes toast-fade-in {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
</style>
