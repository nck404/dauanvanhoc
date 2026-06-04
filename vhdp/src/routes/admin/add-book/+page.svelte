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
    });
</script>

<svelte:head>
    <link
        href="https://cdn.quilljs.com/1.3.6/quill.snow.css"
        rel="stylesheet"
    />
</svelte:head>

<div class="admin-page">
    <header class="page-nav">
        <a href="/admin" class="back-link"
            ><i class="bx bx-left-arrow-alt"></i> Quay lại</a
        >
        <h2>Đăng nội dung mới</h2>
    </header>

    <div class="form-container">
        {#if errorMsg}
            <div class="error-banner" style="margin-bottom: 20px; padding: 12px; background: #fee2e2; color: #ef4444; border-radius: 8px;">{errorMsg}</div>
        {/if}
        {#if successMsg}
            <div class="success-banner" style="margin-bottom: 20px; padding: 12px; background: #dcfce7; color: #16a34a; border-radius: 8px;">{successMsg}</div>
        {/if}

        <form
            onsubmit={handleFormSubmit}
            class="admin-form"
        >
            <div class="form-section">
                <h3>Thông tin cơ bản</h3>
                <div class="input-grid">
                    <div class="field">
                        <label for="title">Tiêu đề</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            placeholder="Tên tác phẩm..."
                        />
                    </div>
                    <div class="field">
                        <label for="author">Tác giả</label>
                        <input
                            type="text"
                            id="author"
                            name="author"
                            required
                            placeholder="Tên tác giả..."
                        />
                    </div>
                </div>

                <div class="field">
                    <label for="type">Loại nội dung</label>
                    <select id="type" name="type" bind:value={bookType}>
                        <option value="text">Truyện chữ (Full Text)</option>
                        <option value="manga">Truyện tranh (Manga/Comic)</option
                        >
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="vn">Visual Novel</option>
                    </select>
                </div>

                <div class="field">
                    <label for="category">Thể loại</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        placeholder="Ví dụ: Tiên hiệp, Đô thị, Hành động..."
                    />
                </div>

                <div class="field cover-field">
                    <label>Ảnh bìa</label>
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
                                <div class="upload-placeholder">
                                    <i class="bx bx-cloud-upload"></i>
                                    <span>Tải ảnh lên</span>
                                </div>
                            {/if}
                        </div>
                        <div class="url-box">
                            <span>Hoặc dùng URL ảnh</span>
                            <input
                                type="url"
                                id="cover_url"
                                name="cover_url"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label for="description">Mô tả tóm tắt</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        placeholder="Viết vài dòng giới thiệu..."
                    ></textarea>
                </div>

                <div class="field" style="margin-bottom: 60px;">
                    <label>Nội dung (Chương 1)</label>
                    <div bind:this={editorContainer} class="editor-wrap"></div>
                    <input
                        type="hidden"
                        name="content"
                        bind:value={contentHtml}
                    />
                </div>
            </div>

            {#if errorMsg}
                <p class="error">{errorMsg}</p>
            {/if}

            <button type="submit" class="comic-btn comic-btn--red comic-btn--lg submit-btn" disabled={loading}>
                {loading ? "Đang đăng..." : "Tạo tác phẩm"}
            </button>
        </form>
    </div>
</div>

<style>
    .admin-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    .page-nav {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 32px;
    }

    .back-link {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        text-decoration: none;
    }

    .form-container {
        background: white;
        padding: 40px;
    }

    .form-section h3 {
        font-size: 18px;
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--accent-light);
        color: var(--accent-dark);
    }

    .input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .field {
        margin-bottom: 24px;
    }

    .field label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-main);
    }

    .field input,
    .field select,
    .field textarea {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--accent-light);
        border-radius: 12px;
        font-family: inherit;
        font-size: 15px;
        outline: none;
        transition: border-color 0.3s ease;
    }

    .field input:focus,
    .field select:focus,
    .field textarea:focus {
        border-color: var(--accent-dark);
    }

    /* Cover Styling */
    .cover-options {
        display: flex;
        gap: 20px;
        align-items: flex-start;
    }

    .upload-box {
        position: relative;
        width: 140px;
        height: 200px;
        border: 2px dashed var(--accent-light);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
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
        color: var(--text-muted);
        gap: 8px;
    }

    .upload-placeholder i {
        font-size: 32px;
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
        gap: 8px;
    }

    .url-box span {
        font-size: 13px;
        color: var(--text-muted);
        font-style: italic;
    }

    .editor-wrap {
        height: 400px;
        background: white;
        border-radius: 0 0 12px 12px;
        border-color: var(--accent-light);
    }

    /* Style for Quill Editor inside Svelte */
    :global(.ql-toolbar) {
        border-radius: 12px 12px 0 0 !important;
        border-color: var(--accent-light) !important;
        background: #fafafa;
    }
    :global(.ql-container) {
        border-radius: 0 0 12px 12px !important;
        border-color: var(--accent-light) !important;
        font-size: 16px !important;
        font-family: inherit !important;
    }
    :global(.ql-editor) {
        min-height: 350px;
    }

    .submit-btn {
        width: 100%;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 16px;
    }

    .submit-btn:hover:not(:disabled) {
        box-shadow: 2px 2px 0px #1a1515;
        transform: translate(2px, 2px);
    }

    .submit-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .error {
        color: #e15b5b;
        margin-top: 16px;
        font-weight: 600;
        text-align: center;
    }

    @media (max-width: 600px) {
        .input-grid {
            grid-template-columns: 1fr;
        }
        .cover-options {
            flex-direction: column;
        }
        .upload-box {
            width: 100%;
            height: 250px;
        }
    }
</style>

