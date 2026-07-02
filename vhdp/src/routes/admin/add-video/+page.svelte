<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import { goto } from "$app/navigation";

    let { form } = $props();

    let quill;
    let editorContainer;
    let descriptionField = $state("");

    // Trạng thái upload
    let isUploading = $state(false);
    let uploadProgress = $state(0);
    let uploadMessage = $state({ type: "", text: "" });

    onMount(async () => {
        document.body.classList.add("paper-theme");
        
        if (typeof window !== "undefined") {
            const Quill = (await import("quill")).default;
            await import("quill/dist/quill.snow.css");

            quill = new Quill(editorContainer, {
                theme: "snow",
                placeholder: "Nhập mô tả, lời thoại nội dung video ở đây...",
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["image", "link"],
                        ["clean"],
                    ],
                },
            });

            quill.on("text-change", () => {
                descriptionField = quill.root.innerHTML;
            });

        }
        
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });

    async function handleSubmit(event) {
        event.preventDefault();

        const formEl = event.target;
        const formData = new FormData(formEl);

        const title = formData.get("title");
        const author = formData.get("author");
        const cover_url_input = formData.get("cover_url");
        const thumbnailFile = formData.get("thumbnail_file");
        const videoFile = formData.get("video_file");

        if (videoFile && videoFile.size > 512 * 1024 * 1024) {
            uploadMessage = {
                type: "error",
                text: "Lỗi: File Video quá lớn. Tối đa 512MB.",
            };
            return;
        }

        if (!videoFile || videoFile.size === 0) {
            uploadMessage = {
                type: "error",
                text: "Vui lòng chọn file video.",
            };
            return;
        }

        isUploading = true;
        uploadProgress = 0;
        uploadMessage = { type: "", text: "" };

        let cover_url = cover_url_input;

        if (thumbnailFile && thumbnailFile.size > 0) {
            try {
                const thumbFormData = new FormData();
                thumbFormData.append("file", thumbnailFile);
                const thumbFileName = `${Date.now()}-${thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                const thumbRes = await apiFetch(`/uploads/covers/${thumbFileName}`, {
                    method: "POST",
                    body: thumbFormData
                });
                if (thumbRes.ok) {
                    const thumbResult = await thumbRes.json();
                    cover_url = thumbResult.url;
                }
            } catch (err) {
                console.error(err);
            }
        }

        const xhr = new XMLHttpRequest();
        const videoFileName = `${Date.now()}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const API_BASE = "https://vhdp-worker.frenda.workers.dev";
        xhr.open("POST", `${API_BASE}/uploads/videos/${videoFileName}`, true);
        const token = localStorage.getItem("vhdp_token");
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                uploadProgress = Math.round((e.loaded / e.total) * 100);
            }
        });

        xhr.addEventListener("load", async () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                try {
                    const uploadResult = JSON.parse(xhr.responseText);
                    const video_url = uploadResult.url;

                    const res = await apiFetch("/api/videos", {
                        method: "POST",
                        body: JSON.stringify({
                            title,
                            author,
                            cover_url,
                            video_url,
                            description: descriptionField
                        })
                    });

                    if (res.ok) {
                        uploadMessage = {
                            type: "success",
                            text: "Trình chiếu Video thành công!",
                        };
                        formEl.reset();
                        if (quill) quill.root.innerHTML = "";
                        uploadProgress = 0;
                        descriptionField = "";
                        setTimeout(() => {
                            goto("/admin");
                        }, 1000);
                    } else {
                        const result = await res.json();
                        uploadMessage = {
                            type: "error",
                            text: result.error || "Có lỗi xảy ra khi lưu thông tin video.",
                        };
                    }
                } catch (err) {
                    uploadMessage = {
                        type: "error",
                        text: "Lỗi xử lý phản hồi từ server.",
                    };
                }
            } else {
                uploadMessage = {
                    type: "error",
                    text: `Đã xảy ra lỗi máy chủ (Mã lỗi: ${xhr.status}). Vui lòng thử lại.`,
                };
            }
            isUploading = false;
        });

        xhr.addEventListener("error", () => {
            isUploading = false;
            uploadMessage = {
                type: "error",
                text: "Mất kết nối với máy chủ. Vui lòng kiểm tra lại mạng hoặc dung lượng file.",
            };
        });

        const uploadFormData = new FormData();
        uploadFormData.append("file", videoFile);
        xhr.send(uploadFormData);
    }
</script>

<svelte:head>
    <title>Thêm Video Mới - Tòa Soạn</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Tòa Soạn — Video / Phim</div>
</div>

<div class="page-container">
    <div class="header-action-row">
        <a href="/admin" class="back-navigation-btn font-mono">
            <i class="bx bx-left-arrow-alt"></i> Quay lại Tòa Soạn
        </a>
    </div>

    <div class="content-wrapper newsprint-card hard-shadow">
        <header class="form-header">
            <div class="header-label">
                <span class="header-label-bar"></span>
                <span>Biên tập Nội dung</span>
            </div>
            
            <h1 class="page-title">
                Trình chiếu <em class="page-accent">Video mới</em><span class="page-dot">.</span>
            </h1>
            
            <p class="page-lead">
                Đăng tải phim chuyển thể, video sự kiện, hoặc phóng sự liên quan đến tác phẩm văn học.
            </p>
        </header>

        {#if uploadMessage.text}
            <div class="alert {uploadMessage.type} font-mono">{uploadMessage.text}</div>
        {/if}

        <form onsubmit={handleSubmit} class="add-form">
            <div class="form-grid">
                <div class="form-group">
                    <label for="title" class="font-mono">Tựa đề Video *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={form?.title ?? ""}
                        required
                        placeholder="Ví dụ: Phim Ngắn Lão Hạc"
                        class="newsprint-input"
                    />
                </div>

                <div class="form-group">
                    <label for="author" class="font-mono">Sản xuất bởi / Nguồn *</label>
                    <input
                        type="text"
                        id="author"
                        name="author"
                        value={form?.author ?? ""}
                        required
                        placeholder="Ví dụ: VTV, Nhóm Lục Mạch"
                        class="newsprint-input"
                    />
                </div>

                <div class="form-group">
                    <label for="thumbnail_file" class="font-mono">Ảnh bìa (Thumbnail) - Tùy chọn</label>
                    <input
                        type="file"
                        id="thumbnail_file"
                        name="thumbnail_file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        class="newsprint-input file-input"
                    />
                    <small class="hint-text font-mono">JPG, PNG, WebP. Tối đa: 10MB</small>
                </div>

                <div class="form-group">
                    <label for="cover_url" class="font-mono">Hoặc liên kết ảnh tĩnh (URL)</label>
                    <input
                        type="url"
                        id="cover_url"
                        name="cover_url"
                        value={form?.cover_url ?? ""}
                        placeholder="https://..."
                        class="newsprint-input"
                    />
                    <small class="hint-text font-mono">Dùng khi không tải tệp lên</small>
                </div>

                <div class="form-group full-width">
                    <label for="video_file" class="font-mono">Tệp trình chiếu (MP4/WebM) *</label>
                    <input
                        type="file"
                        id="video_file"
                        name="video_file"
                        accept="video/*"
                        required
                        class="newsprint-input file-input video-input"
                    />
                    <small class="hint-text font-mono">Kích thước tối đa cho phép: 512MB</small>
                </div>
            </div>

            <div class="form-group full-width">
                <label for="description" class="font-mono">Mô tả chi tiết / Nội dung *</label>
                <!-- Hidden input for Quill content -->
                <input
                    type="hidden"
                    name="description"
                    bind:value={descriptionField}
                />
                <div class="editor-wrapper">
                    <div bind:this={editorContainer} class="quill-editor font-serif"></div>
                </div>
            </div>

            {#if isUploading || uploadProgress > 0}
                <div class="progress-section">
                    <div class="progress-info font-mono">
                        <span>Đang tải lên hệ thống lưu trữ...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div class="progress-container">
                        <div
                            class="progress-bar"
                            style="width: {uploadProgress}%"
                        ></div>
                    </div>
                </div>
            {/if}

            <div class="form-actions">
                <button type="submit" class="newsprint-btn newsprint-btn--primary" disabled={isUploading}>
                    {#if isUploading}
                        <i class="bx bx-loader-alt bx-spin"></i> Đang xử lý...
                    {:else}
                        <i class="bx bx-video-plus"></i> Phát Hành Video
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .page-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 60px 24px 120px;
    }

    .header-action-row {
        margin-bottom: 24px;
    }

    .back-navigation-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        color: var(--newsprint-ink);
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.1em;
        text-decoration: none;
    }

    .back-navigation-btn:hover {
        color: var(--newsprint-red);
    }

    .content-wrapper {
        padding: 40px 48px;
        background: var(--newsprint-white);
    }

    .form-header {
        margin-bottom: 40px;
        border-bottom: 2px solid var(--newsprint-ink);
        padding-bottom: 30px;
    }

    .header-label {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.25em;
        color: var(--newsprint-red);
        margin-bottom: 16px;
    }

    .header-label-bar {
        width: 32px;
        height: 2px;
        background: var(--newsprint-red);
    }

    .page-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: 42px;
        line-height: 1.1;
        color: var(--newsprint-ink);
        margin-bottom: 12px;
    }

    .page-title em {
        font-style: italic;
        color: var(--newsprint-red);
    }

    .page-dot {
        color: var(--newsprint-red);
    }

    .page-lead {
        font-family: 'Lora', serif;
        font-size: 15px;
        color: var(--newsprint-neutral-600);
        max-width: 60ch;
    }

    .alert {
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 24px;
        border: 2px solid var(--newsprint-ink);
    }

    .alert.error {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
        border-color: var(--newsprint-red);
        box-shadow: 4px 4px 0 var(--newsprint-red);
    }

    .alert.success {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        border-color: var(--newsprint-ink);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        margin-bottom: 24px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-group.full-width {
        grid-column: 1 / -1;
    }

    label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--newsprint-ink);
    }

    .newsprint-input {
        padding: 12px 16px;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        color: var(--newsprint-ink);
        transition: all 0.2s;
        width: 100%;
    }

    .newsprint-input:focus {
        outline: none;
        background: var(--newsprint-white);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        transform: translate(-2px, -2px);
    }

    .file-input {
        padding: 9px;
        cursor: pointer;
    }
    
    .video-input {
        border-style: dashed;
        background: var(--newsprint-white);
    }

    .hint-text {
        font-size: 10px;
        color: var(--newsprint-neutral-600);
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .editor-wrapper {
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-white);
    }

    .quill-editor {
        min-height: 400px;
        font-size: 16px;
    }
    
    :global(.ql-toolbar.ql-snow) {
        border: none !important;
        border-bottom: 2px solid var(--newsprint-ink) !important;
        font-family: 'JetBrains Mono', monospace;
    }
    
    :global(.ql-container.ql-snow) {
        border: none !important;
    }

    .progress-section {
        margin-top: 32px;
        background: var(--newsprint-surface);
        padding: 24px;
        border: 2px solid var(--newsprint-ink);
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--newsprint-ink);
    }

    .progress-container {
        height: 8px;
        background: var(--newsprint-neutral-200);
        overflow: hidden;
        border: 1px solid var(--newsprint-ink);
    }

    .progress-bar {
        height: 100%;
        background: var(--newsprint-red);
        transition: width 0.3s ease;
    }

    .form-actions {
        margin-top: 32px;
        display: flex;
        justify-content: flex-end;
        border-top: 2px solid var(--newsprint-divider);
        padding-top: 24px;
    }

    .side-rail {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: auto;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        pointer-events: none;
    }
    
    .side-rail.left { left: 20px; }
    
    .rail-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: var(--newsprint-neutral-400);
        transform: rotate(-90deg);
        white-space: nowrap;
    }

    @media (max-width: 768px) {
        .form-grid { grid-template-columns: 1fr; }
        .content-wrapper { padding: 24px; }
        .side-rail { display: none; }
        .page-title { font-size: 32px; }
    }
</style>

