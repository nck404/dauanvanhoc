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
    let newThreadContent = $state("");
    let selectedImageUrl = $state("");
    let uploadingFile = $state(false);
    let submitError = $state("");

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        uploadingFile = true;
        submitError = "";
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await apiFetch("/api/forum/upload", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                selectedImageUrl = data.url;
            } else {
                submitError = "Không thể tải lên hình ảnh này";
            }
        } catch (err) {
            submitError = "Lỗi kết nối khi tải ảnh";
            console.error(err);
        } finally {
            uploadingFile = false;
        }
    }

    function removeSelectedImage() {
        selectedImageUrl = "";
    }

    async function submitThread(e) {
        if (e) e.preventDefault();
        if (!newThreadContent.trim() && !selectedImageUrl) {
            submitError = "Nội dung bài viết không được để trống";
            return;
        }

        try {
            const res = await apiFetch("/api/forum/posts", {
                method: "POST",
                body: JSON.stringify({
                    content: newThreadContent,
                    media_url: selectedImageUrl || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newPost = {
                    id: data.id,
                    user_id: currentUser.id,
                    content: newThreadContent,
                    media_url: selectedImageUrl || null,
                    parent_id: null,
                    created_at: new Date().toISOString(),
                    username: currentUser.username,
                    name: currentUser.name || currentUser.username,
                    image: currentUser.image || null,
                    likes_count: 0,
                    replies_count: 0,
                    is_liked: 0
                };
                posts = [newPost, ...posts];
                newThreadContent = "";
                selectedImageUrl = "";
                submitError = "";
            } else {
                const data = await res.json();
                submitError = data.error || "Không thể đăng tải bài viết";
            }
        } catch (err) {
            submitError = "Lỗi kết nối";
            console.error(err);
        }
    }
</script>

<div class="forum-wrapper dot-grid-bg newsprint-texture">
    <div class="forum-container">
        <div class="forum-header newsprint-card hard-shadow-hover">
            <h1 class="font-serif gradient-text">DIỄN ĐÀN THẢO LUẬN</h1>
            <p class="subtitle font-body">Chia sẻ và thảo luận về các tác phẩm văn học địa phương</p>
            
            {#if currentUser}
                <a href="/forum/new" class="newsprint-btn newsprint-btn--primary">
                    <i class="bx bx-edit-alt"></i>
                    &nbsp; Viết bài mới
                </a>
            {:else}
                <a href="/login" class="newsprint-btn newsprint-btn--secondary">
                    <i class="bx bx-log-in"></i>
                    &nbsp; Đăng nhập để tham gia
                </a>
            {/if}
        </div>

        <div class="forum-content">
            {#if currentUser}
                <div class="composer-card newsprint-card hard-shadow-hover">
                    <form onsubmit={submitThread} class="composer-form">
                        <div class="composer-header">
                            <div class="user-avatar font-serif">{currentUser.username[0].toUpperCase()}</div>
                            <span class="username font-mono">@{currentUser.username}</span>
                        </div>
                        <textarea
                            bind:value={newThreadContent}
                            placeholder="Có gì mới hôm nay? Chia sẻ ngay..."
                            rows="3"
                            class="composer-textarea font-body"
                        ></textarea>
                        
                        {#if selectedImageUrl}
                            <div class="composer-media-preview">
                                <img src={selectedImageUrl} alt="attachment preview" />
                                <button type="button" class="remove-media-btn" onclick={removeSelectedImage}>
                                    <i class="bx bx-x"></i>
                                </button>
                            </div>
                        {/if}

                        {#if submitError}
                            <div class="error-text font-sans">{submitError}</div>
                        {/if}

                        <div class="composer-footer">
                            <label class="media-attach-label" class:disabled={uploadingFile}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onchange={handleImageUpload}
                                    style="display: none;"
                                    disabled={uploadingFile}
                                />
                                <i class="bx bx-image"></i>
                                <span class="font-mono">{uploadingFile ? "Đang tải..." : "Đính kèm ảnh"}</span>
                            </label>
                            <button type="submit" class="newsprint-btn newsprint-btn--primary font-sans" disabled={uploadingFile || (!newThreadContent.trim() && !selectedImageUrl)}>
                                Đăng bài
                            </button>
                        </div>
                    </form>
                </div>
            {/if}

            {#if posts.length > 0}
                <div class="posts-section">
                    <div class="section-header">
                        <h2 class="section-title font-serif">Những bài viết gần đây</h2>
                        <div class="section-divider"></div>
                    </div>
                    
                    <div class="posts-grid">
                        {#each posts as post (post.id)}
                            <div class="post-card newsprint-card hard-shadow-hover reveal visible" transition:fade>
                                <div class="post-header">
                                    <div class="author-info">
                                        <div class="user-avatar font-serif">{post.username[0].toUpperCase()}</div>
                                        <div class="author-details">
                                            <div class="author-name font-sans">{post.name || post.username}</div>
                                            <div class="meta-info font-mono">
                                                <span class="username">@{post.username}</span>
                                                <span class="separator">/</span>
                                                <span class="time">{formatDate(post.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {#if currentUser && (currentUser.id === post.user_id || currentUser.role === "admin")}
                                        <button class="delete-btn" onclick={() => deletePost(post.id)} aria-label="Xóa bài viết" title="Xóa bài viết">
                                            <i class="bx bx-x"></i>
                                        </button>
                                    {/if}
                                </div>

                                <div class="post-content">
                                    <div class="post-text font-body">
                                        {@html parseMarkdown(post.content)}
                                    </div>
                                    
                                    {#if post.media_url}
                                        <div class="post-media-container">
                                            <img src={post.media_url} alt="media content" class="post-media" />
                                        </div>
                                    {/if}
                                </div>

                                <div class="post-footer font-mono">
                                    <button 
                                        class="post-action-btn {post.is_liked ? 'liked' : ''}" 
                                        onclick={() => toggleLike(post.id)}
                                        disabled={!currentUser}
                                        title={currentUser ? "Thích" : "Vui lòng đăng nhập"}
                                    >
                                        <i class="bx {post.is_liked ? 'bxs-heart' : 'bx-heart'}"></i>
                                        <span>{post.likes_count}</span>
                                    </button>

                                    <a href="/forum/{post.id}" class="post-action-btn">
                                        <i class="bx bx-message-square-detail"></i>
                                        <span>{post.replies_count} phản hồi</span>
                                    </a>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="empty-state newsprint-card hard-shadow-hover">
                    <div class="empty-icon font-serif">!</div>
                    <h2 class="font-serif">Chưa có bài viết nào</h2>
                    <p class="font-body">Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!</p>
                    {#if currentUser}
                        <a href="/forum/new" class="newsprint-btn newsprint-btn--primary">Viết bài viết đầu tiên</a>
                    {:else}
                        <a href="/login" class="newsprint-btn newsprint-btn--secondary">Đăng nhập để bắt đầu</a>
                    {/if}
                </div>
            {/if}

            {#if page < totalPages}
                <div class="load-more-container">
                    <button 
                        class="newsprint-btn newsprint-btn--secondary" 
                        onclick={loadMore}
                        disabled={loading}
                    >
                        {loading ? "ĐANG TẢI..." : "XEM THÊM BÀI VIẾT"}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .forum-wrapper {
        min-height: 100vh;
        padding-top: var(--space-md);
        padding-bottom: var(--space-xl);
    }

    .forum-container {
        max-width: 800px;
        margin: 0 auto;
        margin-top: 70px;
        padding: 0 var(--space-sm);
    }

    .forum-header {
        text-align: center;
        padding: var(--space-xl) var(--space-md);
        margin-bottom: var(--space-lg);
        position: relative;
    }

    .forum-header::before {
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        right: 4px;
        bottom: 4px;
        border: 1px solid var(--newsprint-divider);
        pointer-events: none;
    }

    .forum-header h1 {
        font-size: 2.5rem;
        margin-bottom: var(--space-xs);
        letter-spacing: -0.02em;
    }

    .subtitle {
        color: var(--newsprint-neutral-600);
        font-size: 1.1rem;
        margin-bottom: var(--space-md);
        font-style: italic;
    }

    .forum-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-md);
    }

    .section-title {
        font-size: 1.5rem;
        color: var(--newsprint-ink);
        white-space: nowrap;
    }

    .section-divider {
        flex-grow: 1;
        height: 1px;
        background-color: var(--newsprint-ink);
    }

    .posts-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .post-card {
        padding: var(--space-md);
        position: relative;
    }

    .post-card::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        background: var(--newsprint-ink);
        clip-path: polygon(100% 0, 0 100%, 100% 100%);
    }

    .post-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--space-md);
        padding-bottom: var(--space-sm);
        border-bottom: 1px solid var(--newsprint-divider);
    }

    .author-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .user-avatar {
        width: 48px;
        height: 48px;
        background: var(--newsprint-ink);
        color: var(--newsprint-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        border-radius: 0;
        border: 1px solid var(--newsprint-ink);
    }

    .author-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .author-name {
        font-weight: 700;
        font-size: 1rem;
        color: var(--newsprint-ink);
    }

    .meta-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        color: var(--newsprint-neutral-500);
        text-transform: uppercase;
    }

    .delete-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        color: var(--newsprint-neutral-400);
        font-size: 1.2rem;
    }

    .delete-btn:hover {
        border-color: var(--newsprint-red);
        color: var(--newsprint-red);
        background: var(--newsprint-surface);
    }

    .post-content {
        margin-bottom: var(--space-md);
    }

    .post-text {
        font-size: 1.1rem;
        line-height: 1.7;
        color: var(--newsprint-ink-soft);
    }

    .post-text :global(strong) {
        font-weight: 700;
        color: var(--newsprint-ink);
    }

    .post-text :global(a) {
        color: var(--newsprint-red);
        text-decoration: none;
        border-bottom: 1px solid var(--newsprint-red);
        transition: all 0.2s;
    }

    .post-text :global(a:hover) {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
    }

    .post-text :global(code) {
        font-family: 'JetBrains Mono', monospace;
        background: var(--newsprint-surface);
        padding: 0.1em 0.3em;
        border: 1px solid var(--newsprint-divider);
        font-size: 0.9em;
    }

    .post-media-container {
        margin-top: var(--space-md);
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        padding: 4px;
    }

    .post-media {
        width: 100%;
        max-height: 500px;
        object-fit: contain;
        display: block;
        background: var(--newsprint-surface);
    }

    .post-footer {
        display: flex;
        gap: var(--space-md);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .post-action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: 1px solid transparent;
        color: var(--newsprint-neutral-600);
        font-weight: 600;
    }

    .post-action-btn:hover:not(:disabled) {
        border-color: var(--newsprint-ink);
        color: var(--newsprint-ink);
        background: var(--newsprint-surface);
    }

    .post-action-btn.liked {
        color: var(--newsprint-red);
    }

    .post-action-btn.liked:hover:not(:disabled) {
        border-color: var(--newsprint-red);
        background: var(--newsprint-surface);
    }

    .post-action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .post-action-btn i {
        font-size: 1.2rem;
    }

    .empty-state {
        text-align: center;
        padding: var(--space-xl) var(--space-md);
        background: var(--newsprint-surface);
    }

    .empty-icon {
        font-size: 4rem;
        font-weight: 700;
        color: var(--newsprint-red);
        margin-bottom: var(--space-sm);
        line-height: 1;
    }

    .empty-state h2 {
        font-size: 1.8rem;
        color: var(--newsprint-ink);
        margin-bottom: var(--space-xs);
    }

    .empty-state p {
        color: var(--newsprint-neutral-600);
        margin-bottom: var(--space-md);
        font-style: italic;
    }

    .load-more-container {
        display: flex;
        justify-content: center;
        margin-top: var(--space-md);
    }

    @media (max-width: 640px) {
        .forum-header {
            padding: var(--space-lg) var(--space-sm);
        }
        
        .forum-header h1 {
            font-size: 2rem;
        }

        .post-card {
            padding: var(--space-sm);
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
        }
    }

    .composer-card {
        padding: var(--space-md);
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        margin-bottom: var(--space-lg);
    }

    .composer-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .composer-header {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .composer-header .username {
        font-weight: 700;
        font-size: 14px;
        color: var(--newsprint-neutral-600);
    }

    .composer-textarea {
        width: 100%;
        border: 1px dashed var(--newsprint-divider);
        background: var(--newsprint-white);
        padding: 12px;
        font-size: 15px;
        font-family: inherit;
        outline: none;
        resize: vertical;
        box-shadow: inset 1px 1px 0 rgba(0,0,0,0.05);
    }

    .composer-media-preview {
        position: relative;
        border: 2px solid var(--newsprint-ink);
        max-height: 240px;
        overflow: hidden;
        margin-top: 8px;
    }

    .composer-media-preview img {
        width: 100%;
        height: auto;
        max-height: 240px;
        object-fit: cover;
        display: block;
    }

    .remove-media-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(30, 27, 24, 0.85);
        color: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .error-text {
        color: var(--newsprint-red);
        font-size: 13px;
        font-weight: 700;
    }

    .composer-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px dashed var(--newsprint-divider);
        padding-top: 12px;
    }

    .media-attach-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: var(--newsprint-neutral-600);
        cursor: pointer;
        font-weight: 700;
    }

    .media-attach-label i {
        font-size: 20px;
        color: var(--newsprint-red);
    }

    .media-attach-label:hover {
        color: var(--newsprint-ink);
    }
</style>
