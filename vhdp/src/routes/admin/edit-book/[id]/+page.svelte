<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { apiFetch } from "$lib/api.js";

    let book = $state(null);
    let loading = $state(true);
    let errorMsg = $state("");
    let successMsg = $state("");

    // Cover preview state
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
        if (book?.cover_url) return book.cover_url;
        if (book?.cover) return book.cover;
        return "/default_cover.jpg";
    }

    async function loadBook() {
        try {
            const res = await apiFetch(`/api/books/${page.params.id}`);
            if (res.ok) {
                const data = await res.json();
                book = data.book;
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
            const res = await apiFetch(`/api/books/${book.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title,
                    author,
                    type,
                    category,
                    description,
                    status,
                    cover_url
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
                <input type="hidden" name="id" value={book.id} />

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
                                value={book.title ?? ""}
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
                                value={book.author ?? ""}
                            />
                        </div>
                    </div>

                    <div class="input-grid">
                        <div class="field">
                            <label for="type">Loại nội dung</label>
                            <select
                                id="type"
                                name="type"
                                value={book.type ?? "text"}
                            >
                                <option value="text"
                                    >Truyện chữ (Full Text)</option
                                >
                                <option value="manga"
                                    >Truyện tranh (Manga/Comic)</option
                                >
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
                                value={book.status ?? "ongoing"}
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
                            value={book.category ?? ""}
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
                                    value={book.cover_url ?? ""}
                                />

                                <p class="muted">
                                    Nếu bạn upload file thì hệ thống sẽ ưu tiên
                                    file upload (tuỳ backend).
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
                            >{book.description ?? ""}</textarea
                        >
                    </div>
                </div>

                {#if errorMsg}
                    <div class="error-banner">{errorMsg}</div>
                {/if}

                {#if successMsg}
                    <div class="success-banner">{successMsg}</div>
                {/if}

                <div class="actions">
                    <a class="comic-btn comic-btn--ghost comic-btn--md btn secondary" href="/admin/manage-books">Hủy</a>
                    <button
                        class="comic-btn comic-btn--red comic-btn--md btn primary"
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
        color: var(--text-muted);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        text-decoration: none;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.03);
    }

    .title h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 900;
        color: var(--text-main);
    }

    .subtitle {
        margin: 3px 0 0 0;
        font-size: 13px;
        color: var(--text-muted);
    }

    .form-container,
    .card {
        background: white;
        padding: 32px;
        border-radius: 20px;
        border: 1px solid var(--accent-light);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
    }

    .form-section h3 {
        font-size: 16px;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--accent-light);
        color: var(--accent-dark);
    }

    .input-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
    }

    .field {
        margin-bottom: 18px;
    }

    .field label {
        display: block;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-main);
    }

    .field input,
    .field select,
    .field textarea {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid var(--accent-light);
        border-radius: 12px;
        font-family: inherit;
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s ease;
        background: #fff;
    }

    .field input:focus,
    .field select:focus,
    .field textarea:focus {
        border-color: var(--accent-dark);
    }

    .cover-options {
        display: flex;
        gap: 18px;
        align-items: flex-start;
    }

    .upload-box {
        position: relative;
        width: 160px;
        height: 220px;
        border-radius: 14px;
        overflow: hidden;
        border: 2px dashed var(--accent-light);
        background: #fafafa;
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
        filter: saturate(1.05);
    }

    .upload-hint {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 10px;
        z-index: 1;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.55);
        color: #fff;
        backdrop-filter: blur(6px);
    }

    .hint-title {
        font-weight: 800;
        font-size: 13px;
        line-height: 1.2;
    }
    .hint-sub {
        font-size: 12px;
        opacity: 0.9;
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

    .muted {
        color: var(--text-muted);
        font-size: 13px;
        margin: 0;
    }

    .error-banner {
        background: #fee2e2;
        color: #ef4444;
        padding: 12px 16px;
        border-radius: 12px;
        margin-top: 16px;
        font-weight: 700;
    }

    .success-banner {
        background: #dcfce7;
        color: #16a34a;
        padding: 12px 16px;
        border-radius: 12px;
        margin-top: 16px;
        font-weight: 800;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
        text-decoration: none;
        cursor: pointer;
        transition:
            box-shadow 0.15s ease,
            transform 0.15s ease,
            opacity 0.15s ease;
    }

    .btn.secondary {
        background: #fff;
        color: #1a1515;
    }

    .btn.primary {
        background: #e44232;
        color: #fff;
    }

    .btn:disabled {
        opacity: 0.55;
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
            height: 260px;
        }
        .actions {
            flex-direction: column-reverse;
            align-items: stretch;
        }
    }
</style>
