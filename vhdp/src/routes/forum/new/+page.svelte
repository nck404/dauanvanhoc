<script>
    import { apiFetch, userStore } from "$lib/api.js";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let currentUser = $state(null);
    userStore.subscribe(val => {
        currentUser = val;
    });

    let content = $state("");
    let uploadingFile = $state(false);
    let selectedImageUrl = $state("");
    let submitError = $state("");
    let showPreview = $state(false);

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

    async function submitThread() {
        if (!content.trim() && !selectedImageUrl) {
            submitError = "Nội dung bài viết không được để trống";
            return;
        }

        try {
            const res = await apiFetch("/api/forum/posts", {
                method: "POST",
                body: JSON.stringify({
                    content: content,
                    media_url: selectedImageUrl || null
                })
            });

            if (res.ok) {
                goto("/forum");
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

<div class="new-thread-container">
    <div class="header-bar">
        <a href="/forum" class="back-btn">
            <i class="bx bx-left-arrow-alt"></i>
            <span>Hủy</span>
        </a>
        <h1 class="pixel-font">Thread Mới</h1>
        <button 
            class="submit-btn pixel-font" 
            onclick={submitThread}
            disabled={uploadingFile || (!content.trim() && !selectedImageUrl)}
        >
            Đăng
        </button>
    </div>

    {#if currentUser}
        <div class="editor-card">
            <div class="thread-row">
                <div class="avatar-col">
                    <div class="user-avatar">{currentUser.username[0].toUpperCase()}</div>
                    <div class="vertical-line"></div>
                </div>

                <div class="editor-col">
                    <div class="author-info">
                        <span class="username">@{currentUser.username}</span>
                    </div>

                    <textarea
                        bind:value={content}
                        placeholder="Có gì mới? (Hỗ trợ Markdown **đậm**, *nghiêng*, `code`...)"
                        rows="6"
                    ></textarea>

                    {#if selectedImageUrl}
                        <div class="attached-image-wrapper">
                            <img src={selectedImageUrl} alt="attachment" />
                            <button class="remove-img-btn" onclick={removeSelectedImage}>
                                <i class="bx bx-x"></i>
                            </button>
                        </div>
                    {/if}

                    <div class="editor-footer">
                        <div class="footer-left">
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

                        {#if uploadingFile}
                            <span class="upload-status">Đang tải ảnh...</span>
                        {/if}
                    </div>

                    {#if showPreview && content}
                        <div class="markdown-preview-box">
                            <div class="preview-tag">BẢN XEM TRƯỚC MARKDOWN</div>
                            <div class="preview-rendered">
                                {@html parseMarkdown(content)}
                            </div>
                        </div>
                    {/if}

                    {#if submitError}
                        <div class="error-msg">{submitError}</div>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div class="auth-box">
            <p>Vui lòng đăng nhập trước khi tạo bài viết mới.</p>
            <a href="/login" class="login-btn">Đăng nhập</a>
        </div>
    {/if}
</div>

<style>
    .new-thread-container {
        max-width: 620px;
        margin: 0 auto;
        padding: 24px 16px;
        margin-top: 70px;
    }

    .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        border-bottom: 1.5px solid var(--line);
        padding-bottom: 16px;
    }

    .back-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 15px;
        color: var(--text-muted);
        font-weight: 600;
    }

    .header-bar h1 {
        font-size: 20px;
        color: var(--ink);
    }

    .submit-btn {
        background: var(--accent-dark);
        color: white;
        border-radius: 9999px;
        padding: 6px 18px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .submit-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .editor-card {
        background: var(--bg-wash);
        border: 1.5px solid var(--line);
        border-radius: 12px;
        padding: 20px;
        box-shadow: var(--shadow);
    }

    .thread-row {
        display: flex;
        gap: 16px;
    }

    .avatar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .user-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: var(--primary-gradient);
        border: 2px solid #ffffff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 16px;
    }

    .vertical-line {
        width: 2px;
        flex: 1;
        background: var(--line-faint);
        margin-top: 8px;
    }

    .editor-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .author-info .username {
        font-weight: 700;
        color: var(--ink);
        font-size: 15px;
    }

    textarea {
        width: 100%;
        border: none;
        background: transparent;
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 15px;
        color: var(--ink-soft);
        line-height: 1.5;
    }

    .attached-image-wrapper {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1.5px solid var(--line);
        max-height: 300px;
    }

    .attached-image-wrapper img {
        width: 100%;
        height: auto;
        max-height: 300px;
        object-fit: cover;
        display: block;
    }

    .remove-img-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .editor-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        border-top: 1px solid var(--line-faint);
        padding-top: 12px;
    }

    .footer-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .attachment-label {
        font-size: 22px;
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
        font-size: 13px;
        color: var(--text-muted);
        font-weight: 600;
    }

    .preview-toggle-btn:hover {
        color: var(--ink);
    }

    .upload-status {
        font-size: 12px;
        color: var(--text-muted);
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
        font-size: 14px;
        color: var(--ink-soft);
        line-height: 1.5;
    }

    .error-msg {
        color: var(--coral);
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
    }

    .auth-box {
        text-align: center;
        padding: 40px;
        border: 1.5px solid var(--line);
        background: var(--bg-wash);
        border-radius: 12px;
    }

    .login-btn {
        display: inline-block;
        margin-top: 16px;
        background: var(--accent-dark);
        color: white;
        padding: 10px 24px;
        border-radius: 9999px;
        font-weight: 700;
    }
</style>
