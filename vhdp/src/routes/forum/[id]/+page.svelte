<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { apiFetch, userStore } from "$lib/api.js";
    import { fade, slide } from "svelte/transition";

    let postId = $derived(parseInt(page.params.id));
    let currentUser = $state(null);
    userStore.subscribe(val => {
        currentUser = val;
    });

    let post = $state(null);
    let replies = $state([]);
    let loading = $state(true);
    let error = $state("");

    let replyContent = $state("");
    let uploadingFile = $state(false);
    let selectedImageUrl = $state("");
    let replyError = $state("");
    let showPreview = $state(false);

    async function loadPostDetail() {
        if (isNaN(postId)) {
            error = "ID bài viết không hợp lệ";
            loading = false;
            return;
        }
        loading = true;
        try {
            const res = await apiFetch(`/api/forum/posts/${postId}`);
            if (res.ok) {
                const data = await res.json();
                post = data.post;
                replies = data.replies;
                error = "";
            } else {
                const data = await res.json().catch(() => ({}));
                error = data.error || "Không tìm thấy bài viết";
            }
        } catch (err) {
            error = "Lỗi kết nối máy chủ";
            console.error(err);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadPostDetail();
    });

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        uploadingFile = true;
        replyError = "";
        
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
                replyError = "Không thể tải lên ảnh này";
            }
        } catch (err) {
            replyError = "Lỗi kết nối khi tải ảnh";
            console.error(err);
        } finally {
            uploadingFile = false;
        }
    }

    function removeSelectedImage() {
        selectedImageUrl = "";
    }

    async function submitReply() {
        if (!replyContent.trim() && !selectedImageUrl) {
            replyError = "Nội dung phản hồi không được để trống";
            return;
        }

        try {
            const res = await apiFetch("/api/forum/posts", {
                method: "POST",
                body: JSON.stringify({
                    content: replyContent,
                    media_url: selectedImageUrl || null,
                    parent_id: postId
                })
            });

            if (res.ok) {
                replyContent = "";
                selectedImageUrl = "";
                replyError = "";
                loadPostDetail();
            } else {
                const data = await res.json();
                replyError = data.error || "Không thể gửi phản hồi";
            }
        } catch (err) {
            replyError = "Lỗi kết nối";
            console.error(err);
        }
    }

    async function togglePostLike() {
        if (!currentUser || !post) return;
        
        const liked = !post.is_liked;
        post = {
            ...post,
            is_liked: liked,
            likes_count: liked ? post.likes_count + 1 : post.likes_count - 1
        };

        try {
            await apiFetch(`/api/forum/posts/${post.id}/like`, {
                method: "POST"
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function toggleReplyLike(replyId) {
        if (!currentUser) return;

        replies = replies.map(r => {
            if (r.id === replyId) {
                const liked = !r.is_liked;
                return {
                    ...r,
                    is_liked: liked,
                    likes_count: liked ? r.likes_count + 1 : r.likes_count - 1
                };
            }
            return r;
        });

        try {
            await apiFetch(`/api/forum/posts/${replyId}/like`, {
                method: "POST"
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function deletePostOrReply(id, isReply = false) {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

        try {
            const res = await apiFetch(`/api/forum/posts/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                if (isReply) {
                    replies = replies.filter(r => r.id !== id);
                } else {
                    window.location.href = "/forum";
                }
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
    <div class="back-navigation">
        <a href="/forum" class="back-link">
            <i class="bx bx-left-arrow-alt"></i>
            <span>Quay lại Diễn đàn</span>
        </a>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Đang tải bài viết...</p>
        </div>
    {:else if error}
        <div class="error-card">
            <p>{error}</p>
        </div>
    {:else if post}
        <div class="thread-item-card main-thread-card">
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
                            <button class="delete-btn" onclick={() => deletePostOrReply(post.id, false)} aria-label="Xóa bài viết">
                                <i class="bx bx-trash"></i>
                            </button>
                        {/if}
                    </div>
                    
                    <div class="thread-text main-text">
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
                            onclick={togglePostLike}
                            disabled={!currentUser}
                        >
                            <i class="bx {post.is_liked ? 'bxs-heart' : 'bx-heart'}"></i>
                            <span>{post.likes_count}</span>
                        </button>

                        <div class="action-btn">
                            <i class="bx bx-comment"></i>
                            <span>{post.replies_count} phản hồi</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="replies-section">
            <h2 class="replies-title pixel-font">Phản hồi</h2>
            
            {#each replies as reply (reply.id)}
                <div class="thread-item-card reply-card" transition:fade>
                    <div class="thread-structure">
                        <div class="avatar-col">
                            <div class="user-avatar">{reply.username[0].toUpperCase()}</div>
                            <div class="thread-vertical-line reply-line"></div>
                        </div>
                        <div class="content-col">
                            <div class="thread-header">
                                <span class="author-name">{reply.name || reply.username}</span>
                                <span class="author-username">@{reply.username}</span>
                                <span class="dot">•</span>
                                <span class="time">{formatDate(reply.created_at)}</span>

                                {#if currentUser && (currentUser.id === reply.user_id || currentUser.role === "admin")}
                                    <button class="delete-btn" onclick={() => deletePostOrReply(reply.id, true)} aria-label="Xóa phản hồi">
                                        <i class="bx bx-trash"></i>
                                    </button>
                                {/if}
                            </div>
                            
                            <div class="thread-text">
                                {@html parseMarkdown(reply.content)}
                            </div>

                            {#if reply.media_url}
                                <div class="thread-media-container">
                                    <img src={reply.media_url} alt="reply media" class="thread-media" />
                                </div>
                            {/if}

                            <div class="thread-actions">
                                <button 
                                    class="action-btn" 
                                    class:liked={reply.is_liked} 
                                    onclick={() => toggleReplyLike(reply.id)}
                                    disabled={!currentUser}
                                >
                                    <i class="bx {reply.is_liked ? 'bxs-heart' : 'bx-heart'}"></i>
                                    <span>{reply.likes_count}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="empty-replies">
                    <p>Chưa có phản hồi nào. Hãy bắt đầu cuộc thảo luận!</p>
                </div>
            {/each}
        </div>

        {#if currentUser}
            <div class="thread-item-card reply-composer-card">
                <div class="thread-structure">
                    <div class="avatar-col">
                        <div class="user-avatar">{currentUser.username[0].toUpperCase()}</div>
                        <div class="thread-vertical-line"></div>
                    </div>
                    <div class="content-col">
                        <div class="thread-header">
                            <span class="author-name">Phản hồi của bạn (@{currentUser.username})</span>
                        </div>

                        <textarea 
                            bind:value={replyContent} 
                            placeholder="Nhập phản hồi của bạn... (Hỗ trợ Markdown)"
                            rows="3"
                        ></textarea>

                        {#if selectedImageUrl}
                            <div class="attached-image-wrapper" transition:slide>
                                <img src={selectedImageUrl} alt="preview content" />
                                <button class="remove-img-btn" onclick={removeSelectedImage}>
                                    <i class="bx bx-x"></i>
                                </button>
                            </div>
                        {/if}

                        {#if replyError}
                            <div class="error-msg" transition:fade>{replyError}</div>
                        {/if}

                        <div class="composer-actions">
                            <div class="actions-left">
                                <label class="attachment-label" class:disabled={uploadingFile}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onchange={handleImageUpload} 
                                        style="display: none;" 
                                        disabled={uploadingFile}
                                    />
                                    <i class="bx bx-image"></i>
                                </label>

                                <button class="preview-toggle-btn" onclick={() => showPreview = !showPreview}>
                                    <i class="bx bx-show"></i>
                                    <span>{showPreview ? "Sửa" : "Xem trước"}</span>
                                </button>
                            </div>

                            <button 
                                class="submit-reply-btn pixel-font" 
                                onclick={submitReply}
                                disabled={uploadingFile || (!replyContent.trim() && !selectedImageUrl)}
                            >
                                Gửi
                            </button>
                        </div>

                        {#if showPreview && replyContent}
                            <div class="markdown-preview-box">
                                <div class="preview-tag">BẢN XEM TRƯỚC MARKDOWN</div>
                                <div class="preview-rendered">
                                    {@html parseMarkdown(replyContent)}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {:else}
            <div class="auth-prompt-card">
                <p>Vui lòng <a href="/login" class="auth-link">đăng nhập</a> để đăng phản hồi của bạn.</p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .forum-container {
        max-width: 620px;
        margin: 0 auto;
        padding: 24px 16px 80px;
    }

    .back-navigation {
        margin-bottom: 24px;
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        color: var(--text-muted);
        font-size: 14px;
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--ink);
    }

    .loading-state {
        text-align: center;
        padding: 48px;
        color: var(--text-muted);
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(0, 0, 0, 0.05);
        border-top-color: var(--accent-dark);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 12px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-card {
        background: var(--bg-wash);
        border: 1.5px solid var(--coral);
        color: var(--coral);
        font-weight: 700;
        text-align: center;
        border-radius: 12px;
        padding: 20px;
    }

    .thread-item-card {
        background: var(--bg-wash);
        border: 1.5px solid var(--line);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: var(--shadow);
    }

    .main-thread-card {
        margin-bottom: 32px;
    }

    .replies-section {
        margin-bottom: 32px;
    }

    .replies-title {
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1.5px solid var(--line);
        color: var(--ink);
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

    .reply-line {
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

    .main-text {
        font-size: 16px;
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
        margin-top: 10px;
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

    .empty-replies {
        text-align: center;
        padding: 32px;
        color: var(--text-muted);
        font-size: 14px;
    }

    .reply-composer-card {
        margin-top: 32px;
    }

    textarea {
        width: 100%;
        border: none;
        background: transparent;
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 14.5px;
        color: var(--ink-soft);
        line-height: 1.5;
        padding-top: 4px;
    }

    .attached-image-wrapper {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--line);
        margin-top: 8px;
        max-height: 240px;
    }

    .attached-image-wrapper img {
        width: 100%;
        height: auto;
        max-height: 240px;
        object-fit: cover;
        display: block;
    }

    .remove-img-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .error-msg {
        color: var(--coral);
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
    }

    .composer-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        border-top: 1px solid var(--line-faint);
        padding-top: 12px;
    }

    .actions-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .attachment-label {
        font-size: 20px;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
    }

    .attachment-label:hover {
        color: var(--accent-dark);
    }

    .preview-toggle-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 600;
    }

    .preview-toggle-btn:hover {
        color: var(--ink);
    }

    .submit-reply-btn {
        background: var(--accent-dark);
        color: white;
        border-radius: 9999px;
        padding: 5px 16px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .submit-reply-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .markdown-preview-box {
        background: rgba(0, 0, 0, 0.02);
        border: 1px dashed var(--line);
        border-radius: 8px;
        padding: 12px;
        margin-top: 12px;
    }

    .preview-tag {
        font-size: 9px;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        font-weight: 800;
        margin-bottom: 6px;
    }

    .preview-rendered {
        font-size: 13.5px;
        color: var(--ink-soft);
        line-height: 1.5;
    }

    .auth-prompt-card {
        text-align: center;
        padding: 20px;
        background: var(--bg-wash);
        border: 1.5px solid var(--line);
        border-radius: 12px;
        font-size: 14px;
        color: var(--text-muted);
        margin-top: 32px;
    }

    .auth-link {
        color: var(--accent-dark);
        font-weight: 700;
        text-decoration: underline;
    }
</style>
