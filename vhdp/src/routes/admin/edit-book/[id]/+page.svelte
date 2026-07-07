<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { apiFetch } from "$lib/api.js";

    let book = $state(null);
    let loading = $state(true);
    let errorMsg = $state("");
    let successMsg = $state("");

    let title = $state("");
    let author = $state("");
    let type = $state("text");
    let status = $state("ongoing");
    let category = $state("");
    let description = $state("");
    let coverUrl = $state("");

    let previewUrl = $state("");
    let coverFile = $state(null);

    function handleFileChange(e) {
        const file = e.currentTarget?.files?.[0];
        if (file) {
            coverFile = file;
            previewUrl = URL.createObjectURL(file);
        } else {
            coverFile = null;
            previewUrl = "";
        }
    }

    function coverSrc() {
        if (previewUrl) return previewUrl;
        if (coverUrl) return coverUrl;
        return "/default_cover.jpg";
    }

    async function loadBook() {
        try {
            const res = await apiFetch(`/api/books/${page.params.id}`);
            if (res.ok) {
                const data = await res.json();
                book = data.book;
                title = book.title || "";
                author = book.author || "";
                type = book.type || "text";
                status = book.status || "ongoing";
                category = book.category || "";
                description = book.description || "";
                coverUrl = book.cover_url || book.cover || "";
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadBook();
    });

    async function handleFormSubmit(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        let finalCoverUrl = coverUrl;

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
                    finalCoverUrl = uploadResult.url;
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
            const res = await apiFetch(`/api/books/${book.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title,
                    author,
                    type,
                    category,
                    description,
                    status,
                    cover_url: finalCoverUrl
                })
            });

            if (res.ok) {
                successMsg = "Đã cập nhật sách thành công";
                goto("/admin/manage-books");
            } else {
                const result = await res.json();
                errorMsg = result.error || "Có lỗi xảy ra khi cập nhật";
            }
        } catch (err) {
            errorMsg = "Lỗi kết nối máy chủ";
        } finally {
            loading = false;
        }
    }
</script>

<div class="admin-page">
    <header class="page-nav">
        <a href="/admin/manage-books" class="back-link">
            <i class="bx bx-left-arrow-alt"></i> Quay lại
        </a>
        <div class="title">
            <h2>Sửa truyện</h2>
            {#if book?.title}
                <p class="subtitle">#{book.id} • {book.title}</p>
            {/if}
        </div>
    </header>

    {#if !book}
        <div class="card">
            <p class="muted">
                Không tìm thấy truyện hoặc bạn không có quyền truy cập.
            </p>
            <a class="btn" href="/admin/manage-books">Về quản lý sách</a>
        </div>
    {:else}
        <div class="form-container">
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
                                id="title"
                                name="title"
                                type="text"
                                required
                                placeholder="Tên tác phẩm..."
                                bind:value={title}
                            />
                        </div>

                        <div class="field">
                            <label for="author">Tác giả</label>
                            <input
                                id="author"
                                name="author"
                                type="text"
                                required
                                placeholder="Tên tác giả..."
                                bind:value={author}
                            />
                        </div>
                    </div>

                    <div class="input-grid">
                        <div class="field">
                            <label for="type">Loại nội dung</label>
                            <select
                                id="type"
                                name="type"
                                bind:value={type}
                            >
                                <option value="text">Truyện chữ (Full Text)</option>
                                <option value="manga">Truyện tranh (Manga/Comic)</option>
                                <option value="video">Video</option>
                                <option value="audio">Audio</option>
                                <option value="vn">Visual Novel</option>
                            </select>
                        </div>

                        <div class="field">
                            <label for="status">Trạng thái</label>
                            <select
                                id="status"
                                name="status"
                                bind:value={status}
                            >
                                <option value="ongoing">Đang ra</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="hiatus">Tạm dừng</option>
                            </select>
                        </div>
                    </div>

                    <div class="field">
                        <label for="category">Thể loại</label>
                        <input
                            id="category"
                            name="category"
                            type="text"
                            placeholder="Ví dụ: Tiên hiệp, Đô thị..."
                            bind:value={category}
                        />
                    </div>

                    <div class="field cover-field">
                        <label for="cover_file">Thumbnail / Ảnh bìa</label>

                        <div class="cover-options">
                            <div class="upload-box">
                                <input
                                    type="file"
                                    id="cover_file"
                                    name="cover_file"
                                    accept="image/*"
                                    onchange={handleFileChange}
                                />

                                <img
                                    src={coverSrc()}
                                    alt="Cover preview"
                                    class="cover-preview"
                                />

                                <div class="upload-hint">
                                    <div class="hint-title">Chọn ảnh mới</div>
                                    <div class="hint-sub">PNG/JPG/WebP</div>
                                </div>
                            </div>

                            <div class="url-box">
                                <span>Hoặc dùng URL ảnh</span>
                                <input
                                    type="url"
                                    id="cover_url"
                                    name="cover_url"
                                    placeholder="https://..."
                                    bind:value={coverUrl}
                                />

                                <p class="muted">
                                    Nếu bạn upload file thì hệ thống sẽ ưu tiên
                                    file upload.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="field">
                        <label for="description">Mô tả</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="5"
                            placeholder="Viết vài dòng giới thiệu..."
                            bind:value={description}
                        ></textarea>
                    </div>
                </div>

                {#if errorMsg}
                    <div class="error-banner">{errorMsg}</div>
                {/if}

                {#if successMsg}
                    <div class="success-banner">{successMsg}</div>
                {/if}

                <div class="actions">
                    <a class="btn secondary" href="/admin/manage-books">Hủy</a>
                    <button
                        class="btn primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </div>
    {/if}
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
        gap: 18px;
        margin-bottom: 28px;
    }

    .back-link {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--newsprint-ink);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        padding: 8px 16px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        border-radius: 0px;
    }

    .back-link:hover {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .title h2 {
        margin: 0;
        font-family: 'Playfair Display', serif;
        font-size: 28px;
        font-weight: 900;
        color: var(--newsprint-ink);
    }

    .subtitle {
        margin: 4px 0 0 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--newsprint-muted);
    }

    .form-container {
        background: var(--newsprint-white);
        padding: 32px;
        border: 1px solid var(--newsprint-ink);
        box-shadow: var(--shadow-hard);
        border-radius: 0px;
    }

    .form-section h3 {
        font-family: 'Playfair Display', serif;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--newsprint-ink);
        color: var(--newsprint-red);
    }

    .input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .field {
        margin-bottom: 20px;
    }

    .field label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--newsprint-ink);
    }

    .field input,
    .field select,
    .field textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--newsprint-ink);
        border-radius: 0px;
        font-family: inherit;
        font-size: 15px;
        outline: none;
        transition: all 0.2s ease-out;
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
    }

    .field input:focus,
    .field select:focus,
    .field textarea:focus {
        background: var(--newsprint-surface);
        border-color: var(--newsprint-red);
    }

    .cover-options {
        display: flex;
        gap: 20px;
        align-items: flex-start;
    }

    .upload-box {
        position: relative;
        width: 150px;
        height: 210px;
        border-radius: 0px;
        overflow: hidden;
        border: 1px dashed var(--newsprint-ink);
        background: var(--newsprint-surface);
    }

    .upload-box input {
        position: absolute;
        inset: 0;
        opacity: 0;
        z-index: 2;
        cursor: pointer;
    }

    .cover-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: grayscale(100%);
        transition: all 0.2s ease-out;
    }

    .upload-box:hover .cover-preview {
        filter: grayscale(0%);
    }

    .upload-hint {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
        padding: 8px;
        background: rgba(30, 27, 24, 0.85);
        color: var(--newsprint-white);
        text-align: center;
    }

    .hint-title {
        font-weight: 700;
        font-size: 11px;
    }
    
    .hint-sub {
        font-size: 10px;
        opacity: 0.8;
    }

    .url-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .url-box span {
        font-size: 12px;
        color: var(--newsprint-muted);
        font-style: italic;
    }

    .muted {
        color: var(--newsprint-muted);
        font-size: 12px;
        margin: 0;
    }

    .error-banner {
        background: #fee2e2;
        color: #ef4444;
        border: 1px solid #ef4444;
        padding: 12px;
        border-radius: 0px;
        margin-top: 16px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
    }

    .success-banner {
        background: #dcfce7;
        color: #16a34a;
        border: 1px solid #16a34a;
        padding: 12px;
        border-radius: 0px;
        margin-top: 16px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 24px;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid var(--newsprint-ink);
        border-radius: 0px;
        cursor: pointer;
        transition: all 0.2s ease-out;
    }

    .btn.secondary {
        background: transparent;
        color: var(--newsprint-ink);
    }

    .btn.secondary:hover {
        background: var(--newsprint-muted-bg);
    }

    .btn.primary {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }

    .btn.primary:hover {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 700px) {
        .input-grid {
            grid-template-columns: 1fr;
        }
        .cover-options {
            flex-direction: column;
        }
        .upload-box {
            width: 100%;
            height: 240px;
        }
        .actions {
            flex-direction: column-reverse;
            align-items: stretch;
        }
    }
</style>
