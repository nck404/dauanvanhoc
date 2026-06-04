<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { apiFetch } from "$lib/api.js";
    import Plyr from "plyr";
    import "plyr/dist/plyr.css";

    let video = $state(null);
    let isBookmarked = $state(false);
    let recommended = $state([]);
    let loading = $state(true);

    function usePlyr(node) {
        const player = new Plyr(node, {
            controls: [
                'play-large',
                'play',
                'progress',
                'current-time',
                'duration',
                'mute',
                'volume',
                'settings',
                'pip',
                'airplay',
                'fullscreen'
            ],
            settings: ['speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
        });

        return {
            destroy() {
                player.destroy();
            }
        };
    }

    let videoElement;
    let isPlaying = $state(false);
    let currentTime = $state(0);
    let duration = $state(0);
    let volume = $state(0.85);
    let isMuted = $state(false);
    let playbackRate = $state(1);
    let isFullscreen = $state(false);
    let progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
    let isWaiting = $state(false);

    let isLiked = $state(false);
    let likesOffset = $state(0);
    let likeCount = $derived(video ? (video.views ? Math.floor(video.views * 0.15) + 3 : 12) + likesOffset : 0);
    let isSubscribed = $state(false);
    let isExpanded = $state(false);
    let isCopied = $state(false);
    let showOverlayType = $state("");
    let overlayTimeout;

    const speedSteps = [1, 1.25, 1.5, 2];

    function formatTime(seconds) {
        if (!seconds || Number.isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function togglePlay() {
        if (!videoElement) return;

        if (isPlaying) {
            videoElement.pause();
            triggerOverlayAnimation("pause");
        } else {
            videoElement.play().catch(() => {});
            triggerOverlayAnimation("play");
        }

        isPlaying = !isPlaying;
    }

    function triggerOverlayAnimation(type) {
        showOverlayType = type;
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(() => {
            showOverlayType = "";
        }, 600);
    }

    function skip(seconds) {
        if (!videoElement) return;
        const nextTime = Math.min(
            Math.max(videoElement.currentTime + seconds, 0),
            duration || videoElement.duration || 0,
        );
        videoElement.currentTime = nextTime;
        currentTime = nextTime;
    }

    function seek(event) {
        if (!videoElement || !duration) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = Math.min(
            Math.max((event.clientX - rect.left) / rect.width, 0),
            1,
        );
        const nextTime = percent * duration;
        videoElement.currentTime = nextTime;
        currentTime = nextTime;
    }

    function updateVolume(event) {
        if (!videoElement) return;
        const nextVolume = Number(event.currentTarget.value);
        updateVolumeValue(nextVolume);
    }

    function updateVolumeValue(nextVolume) {
        if (!videoElement) return;
        volume = nextVolume;
        videoElement.volume = nextVolume;
        if (nextVolume > 0) {
            isMuted = false;
            videoElement.muted = false;
        } else {
            isMuted = true;
            videoElement.muted = true;
        }
    }

    function toggleMute() {
        if (!videoElement) return;
        isMuted = !isMuted;
        videoElement.muted = isMuted;
        if (!isMuted && volume === 0) {
            volume = 0.5;
            videoElement.volume = volume;
        }
    }

    function changeSpeed() {
        const currentIndex = speedSteps.indexOf(playbackRate);
        const nextRate = speedSteps[(currentIndex + 1) % speedSteps.length];
        playbackRate = nextRate;

        if (videoElement) {
            videoElement.playbackRate = nextRate;
        }
    }

    async function toggleFullscreen() {
        if (!videoElement) return;

        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
            isFullscreen = false;
            return;
        }

        await videoElement.parentElement?.requestFullscreen?.().catch(() => {});
        isFullscreen = true;
    }

    function toggleLike() {
        isLiked = !isLiked;
        if (isLiked) {
            likesOffset += 1;
        } else {
            likesOffset -= 1;
        }
    }

    function toggleSubscribe() {
        isSubscribed = !isSubscribed;
    }

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    function shareVideo() {
        navigator.clipboard.writeText(window.location.href);
        isCopied = true;
        setTimeout(() => {
            isCopied = false;
        }, 2000);
    }

    async function toggleBookmark() {
        try {
            const res = await apiFetch(`/api/videos/${page.params.id}`, {
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

    function handleKeyDown(event) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
            return;
        }

        switch (event.code) {
            case "Space":
                event.preventDefault();
                togglePlay();
                break;
            case "ArrowLeft":
                event.preventDefault();
                skip(-10);
                break;
            case "ArrowRight":
                event.preventDefault();
                skip(10);
                break;
            case "ArrowUp":
                event.preventDefault();
                const nextVolUp = Math.min(volume + 0.05, 1);
                updateVolumeValue(nextVolUp);
                break;
            case "ArrowDown":
                event.preventDefault();
                const nextVolDown = Math.max(volume - 0.05, 0);
                updateVolumeValue(nextVolDown);
                break;
            case "KeyM":
                event.preventDefault();
                toggleMute();
                break;
            case "KeyF":
                event.preventDefault();
                toggleFullscreen();
                break;
        }
    }

    onMount(async () => {
        document.body.classList.add("paper-theme");
        const videoId = page.params.id;
        try {
            const res = await apiFetch(`/api/videos/${videoId}`);
            if (res.ok) {
                const data = await res.json();
                video = data.video;
                isBookmarked = data.isBookmarked;
                recommended = data.recommended || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }

        if (videoElement) {
            videoElement.volume = volume;
            videoElement.playbackRate = playbackRate;
            videoElement.muted = isMuted;
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.classList.remove("paper-theme");
            window.removeEventListener("keydown", handleKeyDown);
        };
    });
</script>

<svelte:head>
    <title>{video?.title ? `${video.title} - Dấu Ấn Văn Học` : 'Đang tải... - Dấu Ấn Văn Học'}</title>
</svelte:head>

{#if loading}
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 18px; font-weight: 500;">
        Đang tải...
    </div>
{:else if video}

    <div class="video-container">
    <div class="content-layout">
        <header class="player-header">
            <a href="/video" class="back-link">
                <i class="bx bx-left-arrow-alt"></i> Quay lại thư viện
            </a>
        </header>

        <div class="video-layout-grid">
            <div class="video-main-column">
                <div class="player-section comic-card">
                    <div class="video-wrapper">
                        <video
                            use:usePlyr
                            src={video.video_url}
                            poster={video.cover_url}
                            class="main-video"
                            playsinline
                        >
                            <track kind="captions" />
                            Trình duyệt của bạn không hỗ trợ xem video.
                        </video>
                    </div>
                </div>

                <div class="video-info-compact-card">
                    <h1>{video.title}</h1>

                    <div class="channel-actions-bar">
                        <div class="author-profile">
                            <div class="author-avatar-glow">
                                <div class="author-avatar">
                                    {video.author ? video.author.charAt(0).toUpperCase() : "V"}
                                </div>
                            </div>
                            <div class="author-meta-info">
                                <span class="author-name">{video.author || "Tác giả"}</span>
                                <span class="subscriber-count">Tư liệu viên</span>
                            </div>
                            <button
                                type="button"
                                class="subscribe-btn comic-btn comic-btn--sm {isSubscribed ? 'comic-btn--white' : 'comic-btn--red'}"
                                onclick={toggleSubscribe}
                            >
                                {isSubscribed ? "Đã theo dõi" : "Theo dõi"}
                            </button>
                        </div>

                        <div class="actions-pill-group">
                            <button
                                type="button"
                                class="action-pill-btn {isLiked ? 'liked' : ''}"
                                onclick={toggleLike}
                            >
                                <i class="bx {isLiked ? 'bxs-like' : 'bx-like'}"></i>
                                <span>{likeCount}</span>
                            </button>
                            <button
                                onclick={toggleBookmark}
                                class="action-pill-btn {isBookmarked ? 'bookmarked' : ''}"
                            >
                                <i class="bx {isBookmarked ? 'bxs-bookmark' : 'bx-bookmark'}"></i>
                                <span>{isBookmarked ? "Đã lưu" : "Lưu"}</span>
                            </button>

                            <button
                                type="button"
                                class="action-pill-btn share-btn-state"
                                onclick={shareVideo}
                            >
                                <i class="bx bx-share-alt"></i>
                                <span>{isCopied ? "Đã sao chép!" : "Chia sẻ"}</span>
                            </button>

                            {#if video.video_url}
                                <a
                                    href={video.video_url}
                                    download
                                    target="_blank"
                                    class="action-pill-btn-link"
                                >
                                    <i class="bx bx-download"></i>
                                    <span>Tải về</span>
                                </a>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="description-expandable-card" class:expanded={isExpanded}>
                    <div class="desc-stats-row">
                        <span class="stat-item"><i class="bx bx-show-alt"></i> {video.views + 1} lượt xem</span>
                        <span class="stat-item"><i class="bx bx-calendar"></i> {new Date(video.created_at).toLocaleDateString("vi-VN")}</span>
                        <span class="stat-tag">#dauandanvanhoc</span>
                        <span class="stat-tag">#tulieu</span>
                    </div>

                    <div class="description-body">
                        {#if video.description}
                            {@html video.description}
                        {:else}
                            <p>Không có mô tả cho video này.</p>
                        {/if}
                    </div>

                    {#if !isExpanded}
                        <div class="description-fade-overlay"></div>
                    {/if}

                    <button type="button" class="expand-toggle-btn" onclick={toggleExpand}>
                        {isExpanded ? "Rút gọn" : "Xem thêm"}
                        <i class="bx {isExpanded ? 'bx-chevron-up' : 'bx-chevron-down'}"></i>
                    </button>
                </div>
            </div>

            <aside class="video-sidebar-column">
                <div class="sidebar-header">
                    <h3><i class="bx bx-compass"></i> Nội dung liên quan</h3>
                    <div class="pulse-indicator"></div>
                </div>

                <div class="sidebar-list">
                    {#if !recommended?.length}
                        <div class="empty-sidebar">
                            Không có video gợi ý nào khác.
                        </div>
                    {:else}
                        {#each recommended as rec}
                            <a href="/video/{rec.id}" class="recommended-card-horizontal">
                                <div class="rec-thumbnail-box">
                                    {#if rec.cover_url}
                                        <img src={rec.cover_url} alt={rec.title} />
                                    {:else}
                                        <div class="rec-placeholder-box">
                                            <i class="bx bx-video"></i>
                                        </div>
                                    {/if}
                                    <span class="play-small-icon"><i class="bx bx-play"></i></span>
                                </div>
                                <div class="rec-details">
                                    <h4>{rec.title}</h4>
                                    <span class="rec-author">{rec.author || "Tác giả"}</span>
                                    <span class="rec-views"><i class="bx bx-show"></i> {rec.views} lượt xem</span>
                                </div>
                            </a>
                        {/each}
                    {/if}
                </div>
            </aside>
        </div>
    </div>
</div>
{:else}
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 18px; font-weight: 500;">
        Không tìm thấy video
    </div>
{/if}

<style>
    .video-container {
        min-height: 100vh;
        background: transparent;
        padding-bottom: 80px;
        font-family: "Space Grotesk", sans-serif;
    }

    .content-layout {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
    }

    .player-header {
        height: 60px;
        display: flex;
        align-items: center;
        margin-bottom: 12px;
    }

    .back-link {
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: var(--ink-faint);
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--coral);
    }

    .video-layout-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
        align-items: start;
    }

    @media (max-width: 1024px) {
        .video-layout-grid {
            grid-template-columns: 1fr;
        }
    }

    .video-main-column {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .player-section {
        background: var(--paper-warm);
        overflow: hidden;
        position: relative;
    }

    .video-wrapper {
        width: 100%;
        background: #000;
        aspect-ratio: 16 / 9;
        position: relative;
        overflow: hidden;
        cursor: pointer;
    }

    .main-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        outline: none;
    }

    .action-overlay-animation {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.15);
        pointer-events: none;
        animation: fadeOutOverlay 0.6s ease forwards;
    }

    .overlay-icon-box {
        width: 72px;
        height: 72px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 36px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        animation: scalePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes fadeOutOverlay {
        0% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
    }

    @keyframes scalePop {
        0% { transform: scale(0.6); opacity: 0; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); }
    }

    .player-toolbar {
        padding: 14px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #fff;
        border-top: 3px solid #1a1515;
    }

    .seek-row {
        width: 100%;
        cursor: pointer;
        padding: 6px 0;
    }

    .seek-track {
        position: relative;
        width: 100%;
        height: 5px;
        background: var(--accent-light);
        border: 1px solid #1a1515;
        border-radius: 999px;
    }

    .seek-fill {
        height: 100%;
        background: var(--coral);
        border-radius: inherit;
    }

    .seek-thumb {
        position: absolute;
        top: 50%;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid #1a1515;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .control-group.center {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        font-weight: 700;
        color: #1a1515;
    }

    .time-sep {
        opacity: 0.5;
    }

    .time-code {
        min-width: 40px;
        text-align: center;
    }

    .control-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #1a1515;
        background: #fff;
        color: #1a1515;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        box-shadow: 2px 2px 0px #1a1515;
        transition: all 0.15s ease;
    }

    .control-btn:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px #1a1515;
        background: var(--accent-light);
        color: var(--coral);
    }

    .play-btn {
        width: 40px;
        height: 40px;
        background: var(--coral);
        color: #fff;
    }

    .play-btn:hover {
        background: #ef6b6b;
        color: #fff;
    }

    .speed-btn {
        width: auto;
        min-width: 38px;
        padding: 0 8px;
        height: 28px;
        border-radius: 6px;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: 10px;
    }

    .volume-slider {
        width: 80px;
        accent-color: var(--coral);
        height: 6px;
        border-radius: 3px;
        outline: none;
    }

    .video-info-compact-card {
        background: #fff;
        border: 3px solid #1a1515;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 4px 4px 0px #1a1515;
    }

    .video-info-compact-card h1 {
        font-family: "Space Grotesk", sans-serif;
        font-size: 24px;
        font-weight: 800;
        line-height: 1.3;
        color: #1a1515;
        margin-bottom: 20px;
    }

    .channel-actions-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
    }

    .author-profile {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .author-avatar-glow {
        background: linear-gradient(135deg, var(--coral), #f1c40f);
        padding: 2px;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(225, 91, 91, 0.2);
    }

    .author-avatar {
        width: 42px;
        height: 42px;
        background: #1a1515;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 900;
        font-size: 18px;
        border: 2px solid #fff;
    }

    .author-meta-info {
        display: flex;
        flex-direction: column;
    }

    .author-name {
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: 15px;
        color: #1a1515;
    }

    .subscriber-count {
        font-size: 11px;
        color: var(--ink-faint);
        font-family: "JetBrains Mono", monospace;
    }

    .subscribe-btn {
        margin-left: 8px;
    }

    .actions-pill-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .action-pill-btn, .action-pill-btn-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border: 2px solid #1a1515;
        background: var(--accent-light);
        border-radius: 999px;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 12px;
        color: #1a1515;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .action-pill-btn:hover, .action-pill-btn-link:hover {
        transform: translateY(-2px);
        background: #fff;
        box-shadow: 0 4px 0px #1a1515;
    }

    .action-pill-btn.liked {
        background: #ffe5e5;
        border-color: var(--coral);
        color: var(--coral);
    }

    .action-pill-btn.bookmarked {
        background: #e5f1ff;
        border-color: #2563eb;
        color: #2563eb;
    }

    .description-expandable-card {
        background: rgba(26, 21, 21, 0.03);
        border: 2px solid #1a1515;
        border-radius: 12px;
        padding: 16px;
        position: relative;
        overflow: hidden;
        transition: max-height 0.3s ease;
        max-height: 140px;
    }

    .description-expandable-card.expanded {
        max-height: 2000px;
    }

    .desc-stats-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: #1a1515;
    }

    .stat-item i {
        color: var(--coral);
        margin-right: 2px;
    }

    .stat-tag {
        color: #2563eb;
        font-size: 12px;
    }

    .description-body {
        font-size: 14px;
        line-height: 1.7;
        color: var(--ink-soft);
    }

    .description-body p {
        margin-bottom: 8px;
    }

    .description-fade-overlay {
        position: absolute;
        bottom: 40px;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(transparent, rgba(255, 255, 255, 0.95));
        pointer-events: none;
    }

    .expand-toggle-btn {
        width: 100%;
        text-align: center;
        padding: 8px 0 0 0;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: 12px;
        color: #1a1515;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-top: 1px dashed rgba(26, 21, 21, 0.1);
        margin-top: 12px;
    }

    .expand-toggle-btn:hover {
        color: var(--coral);
    }

    .video-sidebar-column {
        background: #fff;
        border: 3px solid #1a1515;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 4px 4px 0px #1a1515;
    }

    .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        border-bottom: 2px solid #1a1515;
        padding-bottom: 10px;
    }

    .sidebar-header h3 {
        font-family: "Space Grotesk", sans-serif;
        font-size: 16px;
        font-weight: 800;
        color: #1a1515;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .pulse-indicator {
        width: 8px;
        height: 8px;
        background-color: var(--coral);
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(225, 91, 91, 0.7);
        animation: pulseAnimation 1.6s infinite;
    }

    @keyframes pulseAnimation {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(225, 91, 91, 0.7);
        }
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(225, 91, 91, 0);
        }
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(225, 91, 91, 0);
        }
    }

    .sidebar-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .empty-sidebar {
        text-align: center;
        color: var(--ink-faint);
        font-size: 13px;
        padding: 20px 0;
    }

    .recommended-card-horizontal {
        display: flex;
        gap: 12px;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s ease;
    }

    .recommended-card-horizontal:hover {
        transform: translateX(4px);
    }

    .rec-thumbnail-box {
        width: 120px;
        aspect-ratio: 16 / 9;
        position: relative;
        border: 2px solid #1a1515;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
        background: var(--paper-warm);
    }

    .rec-thumbnail-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .rec-placeholder-box {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--ink-faint);
    }

    .play-small-icon {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 18px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .recommended-card-horizontal:hover .play-small-icon {
        opacity: 1;
    }

    .rec-details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
    }

    .rec-details h4 {
        font-family: "Space Grotesk", sans-serif;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.3;
        color: #1a1515;
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .rec-author {
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-size: 11px;
        color: var(--ink-mute);
        margin-bottom: 2px;
    }

    .rec-views {
        font-size: 10px;
        color: var(--coral);
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
    }

    .buffering-spinner {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.4);
        pointer-events: none;
        z-index: 10;
    }

    .buffering-spinner i {
        font-size: 50px;
        color: #ffffff;
    }

    :global(.plyr) {
        --plyr-color-main: var(--accent-dark, #e15b5b);
        border-radius: 12px;
        overflow: hidden;
        width: 100%;
        height: 100%;
    }
</style>
