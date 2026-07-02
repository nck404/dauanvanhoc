<script>
    import { onMount } from "svelte";
    import { apiFetch, userStore } from "$lib/api.js";
    import { fade } from "svelte/transition";

    let currentUser = $state(null);
    userStore.subscribe(val => {
        currentUser = val;
    });

    let posts = $state([]);
    let page = $state(1);
    let totalPages = $state(1);
    let loading = $state(false);

    async function loadPosts(pageNum = 1, append = false) {
        if (loading) return;
        loading = true;
        try {
            const res = await apiFetch(`/api/forum/posts?page=${pageNum}&limit=15`);
            if (res.ok) {
                const data = await res.json();
                if (append) {
                    posts = [...posts, ...data.posts];
                } else {
                    posts = data.posts;
                }
                totalPages = data.pages;
                page = pageNum;
            }
        } catch (err) {
            console.error(err);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadPosts(1, false);
    });

    function loadMore() {
        if (page < totalPages) {
            loadPosts(page + 1, true);
        }
    }

    async function toggleLike(postId) {
        if (!currentUser) return;
        
        posts = posts.map(p => {
            if (p.id === postId) {
                const liked = !p.is_liked;
                return {
                    ...p,
                    is_liked: liked,
                    likes_count: liked ? p.likes_count + 1 : p.likes_count - 1
                };
            }
            return p;
        });

        try {
            await apiFetch(`/api/forum/posts/${postId}/like`, {
                method: "POST"
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function deletePost(postId) {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

        try {
            const res = await apiFetch(`/api/forum/posts/${postId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                posts = posts.filter(p => p.id !== postId);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit"
        });
    }

    function parseMarkdown(text) {
        if (!text) return "";
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
        html = html.replace(/`(.*?)`/g, "<code>$1</code>");
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent-dark); text-decoration: underline;">$1</a>');
        html = html.replace(/\n/g, "<br>");
        return html;
    }
</script>

<div class="forum-container">
    <div class="forum-header">
        <h1 class="pixel-font">DIỄN ĐÀN THẢO LUẬN</h1>
        <p class="subtitle">Chia sẻ và thảo luận về các tác phẩm văn học địa phương</p>
    </div>

    {#if currentUser}
        <div class="quick-post-bar-wrapper">
            <a href="/forum/new" class="quick-post-bar">
                <div class="user-avatar-sm">{currentUser.username[0].toUpperCase()}</div>
                <span class="prompt-text">Hôm nay bạn muốn chia sẻ điều gì?</span>
                <span class="action-trigger pixel-font">Đăng</span>
            </a>
        </div>
    {:else}
        <div class="auth-prompt-card">
            <p>Vui lòng <a href="/login" class="auth-link">đăng nhập</a> để tham gia thảo luận và chia sẻ bài viết mới.</p>
        </div>
    {/if}

    <div class="threads-list">
        {#each posts as post (post.id)}
            <div class="thread-item-card" transition:fade>
                <div class="thread-structure">
                    <div class="avatar-col">
                        <div class="user-avatar">{post.username[0].toUpperCase()}</div>
                        <div class="thread-vertical-line"></div>
                    </div>
                    <div class="content-col">
                        <div class="thread-header">
                            <span class="author-name">{post.name || post.username}</span>
                            <span class="author-username">@{post.username}</span>
                            <span class="dot">•</span>
                            <span class="time">{formatDate(post.created_at)}</span>

                            {#if currentUser && (currentUser.id === post.user_id || currentUser.role === "admin")}
                                <button class="delete-btn" onclick={() => deletePost(post.id)} aria-label="Xóa bài viết">
                                    <i class="bx bx-trash"></i>
                                </button>
                            {/if}
                        </div>
                        
                        <div class="thread-text">
                            {@html parseMarkdown(post.content)}
                        </div>
                        
                        {#if post.media_url}
                            <div class="thread-media-container">
                                <img src={post.media_url} alt="media content" class="thread-media" />
                            </div>
                        {/if}

                        <div class="thread-actions">
                            <button 
                                class="action-btn" 
                                class:liked={post.is_liked} 
                                onclick={() => toggleLike(post.id)}
                                disabled={!currentUser}
                            >
                                <i class="bx {post.is_liked ? 'bxs-heart' : 'bx-heart'}"></i>
                                <span>{post.likes_count}</span>
                            </button>

                            <a href="/forum/{post.id}" class="action-btn">
                                <i class="bx bx-comment"></i>
                                <span>{post.replies_count}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="empty-state">
                <i class="bx bx-chat"></i>
                <p>Chưa có bài viết nào được chia sẻ. Hãy là người đầu tiên!</p>
            </div>
        {/each}
    </div>

    {#if page < totalPages}
        <div class="load-more-container">
            <button 
                class="load-more-btn pixel-font" 
                onclick={loadMore}
                disabled={loading}
            >
                {loading ? "Đang tải..." : "Xem thêm"}
            </button>
        </div>
    {/if}

    {#if currentUser}
        <a href="/forum/new" class="floating-fab-btn" aria-label="Đăng thread mới">
            <i class="bx bx-plus"></i>
        </a>
    {/if}
</div>

<style>
    .forum-container {
        max-width: 620px;
        margin: 0 auto;
        padding: 24px 16px 100px;
        position: relative;
    }

    .forum-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .forum-header h1 {
        font-size: 28px;
        color: var(--ink);
        margin-bottom: 8px;
    }

    .subtitle {
        color: var(--text-muted);
        font-size: 14px;
    }

    .quick-post-bar-wrapper {
        margin-bottom: 24px;
    }

    .quick-post-bar {
        display: flex;
        align-items: center;
        gap: 14px;
        background: var(--bg-wash);
        border: 1.5px solid var(--line);
        border-radius: 9999px;
        padding: 8px 16px;
        text-decoration: none;
        box-shadow: var(--shadow);
        transition: border-color 0.2s;
    }

    .quick-post-bar:hover {
        border-color: var(--accent-dark);
    }

    .user-avatar-sm {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary-gradient);
        border: 1.5px solid #ffffff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
    }

    .prompt-text {
        color: var(--text-muted);
        font-size: 14px;
        flex: 1;
    }

    .action-trigger {
        background: var(--accent-dark);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 9999px;
    }

    .auth-prompt-card {
        text-align: center;
        padding: 20px;
        background: var(--bg-wash);
        border: 1.5px solid var(--line);
        border-radius: 12px;
        font-size: 14px;
        color: var(--text-muted);
        margin-bottom: 24px;
    }

    .auth-link {
        color: var(--accent-dark);
        font-weight: 700;
        text-decoration: underline;
    }

    .thread-item-card {
        background: var(--bg-wash);
        border: 1.5px solid var(--line);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: var(--shadow);
        transition: border-color 0.2s;
    }

    .thread-item-card:hover {
        border-color: var(--accent-dark);
    }

    .thread-structure {
        display: flex;
        gap: 14px;
    }

    .avatar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-gradient);
        border: 2px solid #ffffff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 15px;
    }

    .thread-vertical-line {
        width: 2px;
        flex: 1;
        background: var(--line-faint);
        margin-top: 8px;
        margin-bottom: -16px;
    }

    .content-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .thread-header {
        display: flex;
        align-items: center;
        font-size: 13px;
        position: relative;
    }

    .author-name {
        font-weight: 700;
        color: var(--ink);
    }

    .author-username {
        color: var(--text-muted);
        margin-left: 6px;
    }

    .dot {
        color: var(--text-muted);
        margin: 0 4px;
    }

    .time {
        color: var(--text-muted);
    }

    .delete-btn {
        margin-left: auto;
        color: var(--text-muted);
        font-size: 15px;
    }

    .delete-btn:hover {
        color: var(--coral);
    }

    .thread-text {
        font-size: 14.5px;
        color: var(--ink-soft);
        line-height: 1.5;
        word-break: break-word;
    }

    .thread-media-container {
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--line);
        margin-top: 8px;
        max-height: 340px;
    }

    .thread-media {
        width: 100%;
        height: auto;
        max-height: 340px;
        object-fit: cover;
        display: block;
    }

    .thread-actions {
        display: flex;
        gap: 20px;
        margin-top: 8px;
    }

    .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-muted);
        font-weight: 600;
    }

    .action-btn:hover {
        color: var(--ink);
    }

    .action-btn.liked {
        color: var(--coral);
    }

    .action-btn i {
        font-size: 18px;
    }

    .empty-state {
        text-align: center;
        padding: 48px;
        color: var(--text-muted);
    }

    .empty-state i {
        font-size: 40px;
        margin-bottom: 8px;
    }

    .load-more-container {
        display: flex;
        justify-content: center;
        margin-top: 24px;
    }

    .load-more-btn {
        background: var(--bone);
        border: 1.5px solid var(--line);
        color: var(--ink-soft);
        font-size: 12px;
        font-weight: 700;
        padding: 8px 20px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: var(--shadow);
    }

    .load-more-btn:hover {
        border-color: var(--accent-dark);
        color: var(--accent-dark);
    }

    .floating-fab-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--accent-dark);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(225, 59, 59, 0.3);
        z-index: 99;
        font-size: 28px;
        transition: transform 0.2s;
    }

    .floating-fab-btn:hover {
        transform: scale(1.1);
    }
</style>
