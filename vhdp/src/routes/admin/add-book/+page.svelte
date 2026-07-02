<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { apiFetch } from "$lib/api.js";

    let loading = $state(false);
    let bookType = $state("text");
    let errorMsg = $state("");
    let successMsg = $state("");

    let editorContainer;
    let quill;
    let contentHtml = $state("");

    let coverFile = $state(null);
    let previewUrl = $state("");

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            coverFile = file;
            previewUrl = URL.createObjectURL(file);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title");
        const author = formData.get("author");
        const type = formData.get("type");
        const category = formData.get("category");
        const description = formData.get("description");
        const status = formData.get("status");
        const cover_url_input = formData.get("cover_url");

        let cover_url = cover_url_input;

        if (coverFile) {
            try {
                const uploadFormData = new FormData();
                uploadFormData.append("file", coverFile);

                const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                const uploadRes = await apiFetch(`/uploads/covers/${fileName}`, {
                    method: "POST",
                    body: uploadFormData
                });

                if (uploadRes.ok) {
                    const uploadResult = await uploadRes.json();
                    cover_url = uploadResult.url;
                } else {
                    errorMsg = "Không thể tải ảnh bìa lên hệ thống";
                    loading = false;
                    return;
                }
            } catch (err) {
                errorMsg = "Lỗi khi tải ảnh bìa";
                loading = false;
                return;
            }
        }

        try {
            const res = await apiFetch("/api/books", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    author,
                    type,
                    category,
                    description,
                    status,
                    cover_url,
                    content: contentHtml
                })
            });

            if (res.ok) {
                successMsg = "Đã đăng sách thành công";
                goto("/admin/manage-books");
            } else {
                const result = await res.json();
                errorMsg = result.error || "Có lỗi xảy ra khi tạo sách";
            }
        } catch (err) {
            errorMsg = "Lỗi kết nối máy chủ";
        } finally {
            loading = false;
        }
    }

    onMount(async () => {
        document.body.classList.add("paper-theme");
        
        const loadScript = (src) =>
            new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = src;
                script.onload = resolve;
                document.head.appendChild(script);
            });

        if (!window.Quill) {
            await loadScript("https://cdn.quilljs.com/1.3.6/quill.min.js");
        }

        quill = new window.Quill(editorContainer, {
            theme: "snow",
            placeholder: "Viết nội dung hoặc chèn ảnh...",
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    ["blockquote", "image", "video"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ align: [] }],
                    ["clean"],
                ],
            },
        });

        quill.on("text-change", () => {
            contentHtml = quill.root.innerHTML;
        });
        
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });
</script>

<svelte:head>
    <title>Thêm Ấn Phẩm Mới - Tòa Soạn</title>
    <link
        href="https://cdn.quilljs.com/1.3.6/quill.snow.css"
        rel="stylesheet"
    />
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Tòa Soạn — Ấn Phẩm</div>
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
                Phát hành <em class="page-accent">Ấn phẩm mới</em><span class="page-dot">.</span>
            </h1>
            
            <p class="page-lead">
                Cập nhật tác phẩm văn học mới nhất vào kho dữ liệu, phục vụ độc giả đam mê truyện chữ và truyện tranh.
            </p>
        </header>

        {#if errorMsg}
            <div class="alert error font-mono">{errorMsg}</div>
        {/if}

        {#if successMsg}
            <div class="alert success font-mono">{successMsg}</div>
        {/if}

        <form
            onsubmit={handleFormSubmit}
            class="admin-form"
        >
            <div class="form-section">
                <h3 class="font-serif section-title">Thông tin cơ bản</h3>
                <div class="input-grid">
                    <div class="field">
                        <label for="title" class="font-mono">Tên tác phẩm *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            placeholder="Ví dụ: Số Đỏ"
                            class="newsprint-input"
                        />
                    </div>
                    <div class="field">
                        <label for="author" class="font-mono">Tác giả *</label>
                        <input
                            type="text"
                            id="author"
                            name="author"
                            required
                            placeholder="Ví dụ: Vũ Trọng Phụng"
                            class="newsprint-input"
                        />
                    </div>
                </div>

                <div class="field">
                    <label for="type" class="font-mono">Loại nội dung *</label>
                    <select id="type" name="type" bind:value={bookType} class="newsprint-input">
                        <option value="text">Truyện chữ (Full Text)</option>
                        <option value="manga">Truyện tranh (Manga/Comic)</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="vn">Visual Novel</option>
                    </select>
                </div>

                <div class="field">
                    <label for="category" class="font-mono">Thể loại</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        placeholder="Ví dụ: Hiện thực phê phán, Xã hội..."
                        class="newsprint-input"
                    />
                </div>

                <div class="field cover-field">
                    <label class="font-mono">Ảnh bìa (Thumbnail)</label>
                    <div class="cover-options">
                        <div class="upload-box">
                            <input
                                type="file"
                                id="cover_file"
                                name="cover_file"
                                accept="image/*"
                                onchange={handleFileChange}
                            />
                            {#if previewUrl}
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    class="cover-preview"
                                />
                            {:else}
                                <div class="upload-placeholder font-mono">
                                    <i class="bx bx-cloud-upload"></i>
                                    <span>Tải ảnh lên</span>
                                </div>
                            {/if}
                        </div>
                        <div class="url-box">
                            <span class="font-mono">Hoặc sử dụng liên kết ảnh tĩnh (URL)</span>
                            <input
                                type="url"
                                id="cover_url"
                                name="cover_url"
                                placeholder="https://..."
                                class="newsprint-input"
                            />
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label for="description" class="font-mono">Tóm tắt / Lời tựa</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        placeholder="Viết vài dòng giới thiệu về tác phẩm..."
                        class="newsprint-input"
                    ></textarea>
                </div>

                <div class="field" style="margin-bottom: 60px;">
                    <label class="font-mono">Nội dung Văn bản (Chương 1) *</label>
                    <div class="editor-wrapper">
                        <div bind:this={editorContainer} class="quill-editor font-serif"></div>
                    </div>
                    <input
                        type="hidden"
                        name="content"
                        bind:value={contentHtml}
                    />
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="newsprint-btn newsprint-btn--primary" disabled={loading}>
                    <i class="bx bx-book-add"></i> {loading ? "Đang xuất bản..." : "Xuất bản Tác phẩm"}
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
    
    .section-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--newsprint-ink);
        margin-bottom: 24px;
        border-left: 4px solid var(--newsprint-red);
        padding-left: 12px;
    }

    .input-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
        margin-bottom: 24px;
    }

    .field {
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
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

    /* Cover Styling */
    .cover-options {
        display: flex;
        gap: 24px;
        align-items: flex-start;
    }

    .upload-box {
        position: relative;
        width: 140px;
        height: 200px;
        border: 2px dashed var(--newsprint-ink);
        background: var(--newsprint-surface);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .upload-box:hover {
        background: var(--newsprint-white);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        transform: translate(-2px, -2px);
    }

    .upload-box input {
        position: absolute;
        inset: 0;
        opacity: 0;
        z-index: 2;
        cursor: pointer;
    }

    .upload-placeholder {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--newsprint-neutral-400);
        gap: 8px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .upload-placeholder i {
        font-size: 32px;
        color: var(--newsprint-red);
    }

    .cover-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .url-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .url-box span {
        font-size: 11px;
        color: var(--newsprint-neutral-600);
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
        .input-grid { grid-template-columns: 1fr; }
        .cover-options { flex-direction: column; }
        .upload-box { width: 100%; height: 250px; }
        .content-wrapper { padding: 24px; }
        .side-rail { display: none; }
        .page-title { font-size: 32px; }
    }
</style>

