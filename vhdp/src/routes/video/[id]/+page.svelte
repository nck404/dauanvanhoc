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
    let isBuffering = $state(false);

    let comments = $state([]);
    let newCommentText = $state("");
    let loadingComments = $state(true);

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

        player.on('waiting', () => { isBuffering = true; });
        player.on('playing', () => { isBuffering = false; });
        player.on('seeking', () => { isBuffering = true; });
        player.on('seeked', () => { isBuffering = false; });

        return {
            destroy() {
                player.destroy();
            }
        };
    }

    let isSubscribed = $state(false);
    let isExpanded = $state(false);
    let isCopied = $state(false);

    async function loadComments() {
        try {
            const res = await apiFetch(`/api/videos/${page.params.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                comments = data.comments || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loadingComments = false;
        }
    }

    async function postComment(e) {
        if (e) e.preventDefault();
        if (!newCommentText.trim()) return;
        try {
            const res = await apiFetch(`/api/videos/${page.params.id}/comments`, {
                method: "POST",
                body: JSON.stringify({ content: newCommentText })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.comment) {
                    comments = [data.comment, ...comments];
                    newCommentText = "";
                }
            }
        } catch (e) {
            console.error(e);
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
        const previousState = isBookmarked;
        isBookmarked = !isBookmarked;
        try {
            const res = await apiFetch(`/api/videos/${page.params.id}`, {
                method: "POST"
            });
            if (res.ok) {
                const result = await res.json();
                isBookmarked = result.isBookmarked;
            } else {
                isBookmarked = previousState;
            }
        } catch (e) {
            console.error(e);
            isBookmarked = previousState;
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
            await loadComments();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }

        return () => {
            document.body.classList.remove("paper-theme");
        };
    });
</script>

<svelte:head>
    <title>{video?.title ? `${video.title} - Dấu Ấn Văn Học` : 'Đang tải... - Dấu Ấn Văn Học'}</title>
</svelte:head>

{#if loading}
    <div class="loader-cover">
        <div class="spinner"></div>
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
                    <div class="player-section newsprint-card">
                        <div class="video-wrapper">
                            <video
                                use:usePlyr
                                src={video.video_url}
                                poster={video.cover_url}
                                class="main-video"
                                playsinline
                            >
                                <track kind="captions" />
                            </video>
                            {#if isBuffering}
                                <div class="buffering-overlay">
                                    <div class="spinner"></div>
                                    <p>Đang tải...</p>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="video-info-card newsprint-card">
                        <h1>{video.title}</h1>

                        <div class="channel-actions-bar">
                            <div class="author-profile">
                                <div class="author-avatar">
                                    {video.author ? video.author.charAt(0).toUpperCase() : "V"}
                                </div>
                                <div class="author-meta-info">
                                    <span class="author-name">{video.author || "Tác giả"}</span>
                                    <span class="subscriber-count">Tư liệu viên</span>
                                </div>
                                <button
                                    type="button"
                                    class="subscribe-btn {isSubscribed ? 'subscribed' : ''}"
                                    onclick={toggleSubscribe}
                                >
                                    {isSubscribed ? "Đã theo dõi" : "Theo dõi"}
                                </button>
                            </div>

                            <div class="actions-pill-group">
                                <button
                                    onclick={toggleBookmark}
                                    class="action-pill-btn {isBookmarked ? 'bookmarked' : ''}"
                                    title={isBookmarked ? "Đã lưu vào yêu thích" : "Thêm vào yêu thích"}
                                >
                                    <i class="bx {isBookmarked ? 'bxs-heart' : 'bx-heart'}"></i>
                                    <span>{isBookmarked ? "Yêu thích" : "Yêu thích"}</span>
                                </button>

                                <button
                                    type="button"
                                    class="action-pill-btn"
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
                                        class="action-pill-btn"
                                    >
                                        <i class="bx bx-download"></i>
                                        <span>Tải về</span>
                                    </a>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <div class="description-card newsprint-card" class:expanded={isExpanded}>
                        <div class="desc-stats-row">
                            <span class="stat-item"><i class="bx bx-show-alt"></i> {video.views + 1} lượt xem</span>
                            <span class="stat-item"><i class="bx bx-calendar"></i> {new Date(video.created_at).toLocaleDateString("vi-VN")}</span>
                            <span class="stat-tag">#dauandanvanhoc</span>
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

                    <div class="comments-section newsprint-card">
                        <h2>Bình luận ({comments.length})</h2>

                        <form onsubmit={postComment} class="comment-input-box">
                            <textarea
                                placeholder="Viết bình luận của bạn..."
                                bind:value={newCommentText}
                                rows="3"
                                class="comment-textarea"
                            ></textarea>
                            <div class="comment-submit-row">
                                <button type="submit" class="newsprint-btn newsprint-btn--primary">Gửi bình luận</button>
                            </div>
                        </form>

                        <div class="comments-list">
                            {#if loadingComments}
                                <p class="loading-comments font-mono">Đang tải bình luận...</p>
                            {:else if comments.length === 0}
                                <p class="empty-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                            {:else}
                                {#each comments as comment (comment.id)}
                                    <div class="comment-item">
                                        <div class="comment-avatar">
                                            {comment.username ? comment.username.charAt(0).toUpperCase() : "U"}
                                        </div>
                                        <div class="comment-content-box">
                                            <div class="comment-header">
                                                <span class="comment-author">{comment.name || comment.username}</span>
                                                <span class="comment-time">{new Date(comment.created_at).toLocaleDateString("vi-VN")}</span>
                                            </div>
                                            <p class="comment-body-text">{comment.content}</p>
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>

                <aside class="video-sidebar-column newsprint-card">
                    <div class="sidebar-header">
                        <h3>Nội dung liên quan</h3>
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
    <div class="loader-cover">
        <p>Không tìm thấy video</p>
    </div>
{/if}

<style>
    .loader-cover {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        background: var(--newsprint-bg);
        font-family: 'Space Grotesk', sans-serif;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--newsprint-divider);
        border-top-color: var(--newsprint-red);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .video-container {
        min-height: 100vh;
        background: transparent;
        padding-bottom: 120px;
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
        color: var(--newsprint-ink);
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--newsprint-red);
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
        gap: 20px;
    }

    .player-section {
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        overflow: hidden;
        position: relative;
        padding: 0;
    }

    .video-wrapper {
        width: 100%;
        background: #000;
        aspect-ratio: 16 / 9;
        position: relative;
        overflow: hidden;
    }

    .main-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        outline: none;
    }

    .buffering-overlay {
        position: absolute;
        inset: 0;
        background: rgba(30, 27, 24, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: white;
        z-index: 10;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
    }

    .video-info-card {
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        padding: 24px;
    }

    .video-info-card h1 {
        font-family: "Space Grotesk", sans-serif;
        font-size: 24px;
        font-weight: 800;
        line-height: 1.3;
        color: var(--newsprint-ink);
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

    .author-avatar {
        width: 44px;
        height: 44px;
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 900;
        font-size: 18px;
        border: 2px solid var(--newsprint-ink);
    }

    .author-meta-info {
        display: flex;
        flex-direction: column;
    }

    .author-name {
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: 15px;
        color: var(--newsprint-ink);
    }

    .subscriber-count {
        font-size: 11px;
        color: var(--newsprint-neutral-500);
        font-family: "JetBrains Mono", monospace;
    }

    .subscribe-btn {
        margin-left: 8px;
        padding: 8px 16px;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 12px;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        text-shadow: none;
    }

    .subscribe-btn:hover {
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
    }

    .subscribe-btn.subscribed {
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
    }

    .actions-pill-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .action-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 12px;
        color: var(--newsprint-ink);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        text-shadow: none;
    }

    .action-pill-btn:hover {
        transform: translateY(-2px);
        box-shadow: 3px 3px 0 var(--newsprint-ink);
    }

    .action-pill-btn.bookmarked {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-ink);
    }

    .description-card {
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        padding: 20px;
        position: relative;
        overflow: hidden;
        transition: max-height 0.3s ease;
        max-height: 160px;
    }

    .description-card.expanded {
        max-height: 2000px;
    }

    .desc-stats-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
        font-size: 13px;
        color: var(--newsprint-ink);
    }

    .stat-item i {
        color: var(--newsprint-red);
        margin-right: 4px;
    }

    .stat-tag {
        color: var(--newsprint-red);
        font-size: 12px;
    }

    .description-body {
        font-size: 14px;
        line-height: 1.7;
        color: var(--newsprint-neutral-700);
        font-family: 'Lora', serif;
    }

    .description-fade-overlay {
        position: absolute;
        bottom: 40px;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(transparent, var(--newsprint-surface));
        pointer-events: none;
    }

    .expand-toggle-btn {
        width: 100%;
        text-align: center;
        padding: 10px 0 0;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: 12px;
        color: var(--newsprint-ink);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-top: 1px dashed var(--newsprint-divider);
        margin-top: 12px;
        background: transparent;
        border-bottom: none;
        border-left: none;
        border-right: none;
    }

    .expand-toggle-btn:hover {
        color: var(--newsprint-red);
    }

    .comments-section {
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        padding: 24px;
        font-family: 'Space Grotesk', sans-serif;
    }

    .comments-section h2 {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 20px;
        color: var(--newsprint-ink);
    }

    .comment-input-box {
        margin-bottom: 30px;
    }

    .comment-textarea {
        width: 100%;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        padding: 12px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        resize: vertical;
        box-shadow: inset 2px 2px 0 rgba(0,0,0,0.05);
    }

    .comment-submit-row {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }

    .comments-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .loading-comments {
        text-align: center;
        color: var(--newsprint-neutral-500);
        font-size: 13px;
    }

    .empty-comments {
        text-align: center;
        color: var(--newsprint-neutral-500);
        font-size: 14px;
        padding: 20px 0;
    }

    .comment-item {
        display: flex;
        gap: 16px;
        border-bottom: 1px dashed var(--newsprint-divider);
        padding-bottom: 16px;
    }

    .comment-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .comment-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--newsprint-divider);
        border: 2px solid var(--newsprint-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        color: var(--newsprint-ink);
        flex-shrink: 0;
    }

    .comment-content-box {
        flex: 1;
    }

    .comment-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
    }

    .comment-author {
        font-weight: 700;
        font-size: 14px;
        color: var(--newsprint-ink);
    }

    .comment-time {
        font-size: 11px;
        color: var(--newsprint-neutral-500);
        font-family: 'JetBrains Mono', monospace;
    }

    .comment-body-text {
        font-size: 14px;
        line-height: 1.5;
        color: var(--newsprint-ink-soft);
        font-family: 'Lora', serif;
    }

    .video-sidebar-column {
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        padding: 20px;
    }

    .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--newsprint-ink);
        padding-bottom: 10px;
    }

    .sidebar-header h3 {
        font-family: "Space Grotesk", sans-serif;
        font-size: 16px;
        font-weight: 800;
        color: var(--newsprint-ink);
    }

    .pulse-indicator {
        width: 8px;
        height: 8px;
        background-color: var(--newsprint-red);
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(168, 50, 50, 0.7);
        animation: pulseAnimation 1.6s infinite;
    }

    @keyframes pulseAnimation {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 50, 50, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(168, 50, 50, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 50, 50, 0); }
    }

    .sidebar-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .empty-sidebar {
        text-align: center;
        color: var(--newsprint-neutral-500);
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
        border: 2px solid var(--newsprint-ink);
        overflow: hidden;
        flex-shrink: 0;
        background: var(--newsprint-bg);
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
        color: var(--newsprint-neutral-400);
    }

    .play-small-icon {
        position: absolute;
        inset: 0;
        background: rgba(30, 27, 24, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
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
        color: var(--newsprint-ink);
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
        color: var(--newsprint-neutral-600);
        margin-bottom: 2px;
    }

    .rec-views {
        font-size: 10px;
        color: var(--newsprint-red);
        font-family: "Space Grotesk", sans-serif;
        font-weight: 700;
    }

    :global(.plyr) {
        --plyr-color-main: var(--newsprint-red, #a83232);
        border: none;
        overflow: hidden;
        width: 100%;
        height: 100%;
    }
</style>
