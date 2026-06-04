<script>
    import { onMount } from "svelte";

    let { form } = $props();

    let quill;
    let editorContainer;
    let descriptionField = $state("");

    // Trạng thái upload
    let isUploading = $state(false);
    let uploadProgress = $state(0);
    let uploadMessage = $state({ type: "", text: "" });

    onMount(async () => {
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
        xhr.open("POST", `/uploads/videos/${videoFileName}`, true);
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
                            text: "Tải lên Video thành công!",
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
    <title>Thêm Video Mới - Admin</title>
</svelte:head>

<div class="admin-container">
    <div class="content-wrapper">
        <div class="header">
            <a href="/admin" class="back-link"
                ><i class="bx bx-arrow-back"></i> Quay lại Admin</a
            >
            <h1><i class="bx bx-video"></i> Thêm Video / Sự Kiện Mới</h1>
            <p>Upload File Video và viết bài giới thiệu</p>
        </div>

        {#if uploadMessage.text}
            <div class="alert {uploadMessage.type}">{uploadMessage.text}</div>
        {/if}

        <form
            onsubmit={handleSubmit}
            class="add-form"
        >
            <div class="form-grid">
                <div class="form-group">
                    <label for="title">Tựa đề Video *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={form?.title ?? ""}
                        required
                        placeholder="Ví dụ: Lão Hạc The Movie..."
                    />
                </div>

                <div class="form-group">
                    <label for="author">Tác giả / Nguồn *</label>
                    <input
                        type="text"
                        id="author"
                        name="author"
                        value={form?.author ?? ""}
                        required
                        placeholder="Sản xuất bởi..."
                    />
                </div>

                <div class="form-group">
                    <label for="thumbnail_file"
                        >Upload Ảnh Bìa (Thumbnail) - Tùy chọn</label
                    >
                    <input
                        type="file"
                        id="thumbnail_file"
                        name="thumbnail_file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        class="file-input"
                    />
                    <small class="hint-text"
                        >Định dạng: JPG, PNG, WebP, GIF. Kích thước tối đa: 10MB</small
                    >
                </div>

                <div class="form-group">
                    <label for="cover_url"
                        >Hoặc dán link ảnh bìa - Tùy chọn</label
                    >
                    <input
                        type="url"
                        id="cover_url"
                        name="cover_url"
                        value={form?.cover_url ?? ""}
                        placeholder="https://..."
                    />
                    <small class="hint-text"
                        >Chỉ dùng nếu không upload ảnh từ thiết bị</small
                    >
                </div>

                <div class="form-group full-width">
                    <label for="video_file">Upload file MP4/WebM *</label>
                    <input
                        type="file"
                        id="video_file"
                        name="video_file"
                        accept="video/*"
                        required
                        class="file-input video-input"
                    />
                    <small class="hint-text">Kích thước tối đa: 512MB</small>
                </div>
            </div>

            <div class="form-group full-width">
                <label for="description">Mô Tả / Bài Viết *</label>
                <!-- Hidden input for Quill content -->
                <input
                    type="hidden"
                    name="description"
                    bind:value={descriptionField}
                />
                <div class="editor-wrapper">
                    <div bind:this={editorContainer} class="quill-editor"></div>
                </div>
            </div>

            {#if isUploading || uploadProgress > 0}
                <div class="progress-section">
                    <div class="progress-info">
                        <span>Đang tải lên dữ liệu...</span>
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
                <button type="submit" class="comic-btn comic-btn--red comic-btn--lg submit-btn" disabled={isUploading}>
                    {#if isUploading}
                        <i class="bx bx-loader-alt bx-spin"></i> Đang xử lý...
                    {:else}
                        <i class="bx bx-upload"></i> Đăng Video
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .admin-container {
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
    }

    .content-wrapper {
        background: #fff;
        border-radius: 20px;
        box-shadow: var(--shadow);
        padding: 40px;
    }

    .header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .header h1 {
        font-size: 28px;
        color: var(--accent-dark);
        margin: 10px 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .header p {
        color: var(--text-muted);
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--text-muted);
        font-weight: 600;
        margin-bottom: 15px;
    }

    .back-link:hover {
        color: var(--accent-dark);
    }

    .alert {
        padding: 15px 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-weight: 600;
    }

    .alert.error {
        background: rgba(225, 91, 91, 0.1);
        color: var(--accent-dark);
        border: 1px solid rgba(225, 91, 91, 0.2);
    }

    .alert.success {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
        border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
        margin-bottom: 25px;
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
        font-weight: 600;
        font-size: 14px;
        color: var(--text-main);
    }

    input[type="text"],
    input[type="url"],
    select {
        padding: 12px 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        font-family: inherit;
        font-size: 15px;
        transition: all 0.3s;
    }

    input:focus,
    select:focus {
        outline: none;
        border-color: var(--accent-dark);
        box-shadow: 0 0 0 4px rgba(225, 91, 91, 0.1);
    }

    .file-input {
        padding: 10px;
        border: 2px dashed rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        width: 100%;
        cursor: pointer;
        transition: all 0.3s;
    }

    .file-input:hover {
        border-color: var(--accent-dark);
        background: rgba(225, 91, 91, 0.05);
    }

    .file-input:focus {
        outline: none;
        border-color: var(--accent-dark);
        box-shadow: 0 0 0 4px rgba(225, 91, 91, 0.1);
    }

    .video-input {
        border-color: rgba(0, 0, 0, 0.3);
        background: #f8fafc;
    }

    .hint-text {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 2px;
    }

    .editor-wrapper {
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid rgba(0, 0, 0, 0.1);
    }

    .quill-editor {
        min-height: 400px;
        background: #fff;
    }

    .progress-section {
        margin-top: 30px;
        background: #f8fafc;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-weight: 600;
        color: var(--text-main);
    }

    .progress-container {
        height: 12px;
        background: #e2e8f0;
        border-radius: 20px;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background: var(--primary-gradient);
        transition: width 0.3s ease;
    }

    .form-actions {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
    }

    .submit-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 32px;
        font-size: 16px;
    }

    .submit-btn:hover:not(:disabled) {
        box-shadow: 2px 2px 0px #1a1515;
        transform: translate(2px, 2px);
    }

    .submit-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
</style>

