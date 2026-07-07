<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { apiFetch } from "$lib/api.js";

    let loading = $state(false);
    let errorMsg = $state("");
    let successMsg = $state("");

    let coverFile = $state(null);
    let previewUrl = $state("");
    
    let pageFiles = $state([]);
    let pagePreviews = $state([]);

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            coverFile = file;
            previewUrl = URL.createObjectURL(file);
        }
    }

    function handlePagesChange(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            pageFiles = [...pageFiles, ...files];
            const newPreviews = files.map(f => URL.createObjectURL(f));
            pagePreviews = [...pagePreviews, ...newPreviews];
        }
    }
    
    function removePage(index) {
        pageFiles = pageFiles.filter((_, i) => i !== index);
        pagePreviews = pagePreviews.filter((_, i) => i !== index);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title");
        const author = formData.get("author");
        const category = formData.get("category");
        const description = formData.get("description");
        const status = formData.get("status");

        let cover_url = "";
        
        if (!coverFile) {
            errorMsg = "Vui lòng chọn ảnh bìa";
            loading = false;
            return;
        }
        if (pageFiles.length === 0) {
            errorMsg = "Vui lòng chọn ít nhất 1 trang truyện";
            loading = false;
            return;
        }

        try {
            // 1. Upload Cover
            const uploadFormData = new FormData();
            uploadFormData.append("file", coverFile);
            const fileName = `${Date.now()}-cover-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            
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

            // 2. Upload Pages
            let uploadedUrls = [];
            for (let i = 0; i < pageFiles.length; i++) {
                const pFile = pageFiles[i];
                const pFormData = new FormData();
                pFormData.append("file", pFile);
                const pFileName = `${Date.now()}-page-${i}-${pFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                const pUploadRes = await apiFetch(`/uploads/pages/${pFileName}`, {
                    method: "POST",
                    body: pFormData
                });
                if (pUploadRes.ok) {
                    const resJson = await pUploadRes.json();
                    uploadedUrls.push(resJson.url);
                } else {
                    errorMsg = `Lỗi tải trang ${i + 1}`;
                    loading = false;
                    return;
                }
            }

            // Generate content HTML
            let contentHtml = '<div class="image-viewer" style="display:flex;flex-direction:column;gap:1rem;">';
            uploadedUrls.forEach((url, idx) => {
                contentHtml += `<div class="image-container" style="text-align:center;"><img src="${url}" alt="Page ${idx + 1}" style="max-width:100%;height:auto;" /></div>`;
            });
            contentHtml += "</div>";

            // 3. Create Book
            const res = await apiFetch("/api/books", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    author,
                    type: "truyện tranh",
                    category,
                    description,
                    status,
                    cover_url,
                    content: contentHtml
                })
            });

            if (res.ok) {
                successMsg = "Đã đăng truyện tranh thành công";
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
</script>

<div class="admin-page">
    <header class="page-nav">
        <a href="/admin/manage-books" class="back-link">
            <i class="bx bx-left-arrow-alt"></i> Quay lại
        </a>
        <h2>Đăng truyện tranh mới</h2>
    </header>

    <div class="form-container">
        <form onsubmit={handleFormSubmit} class="admin-form">
            <div class="form-grid">
                <!-- Left Column -->
                <div class="form-column">
                    <div class="form-group">
                        <label for="title">Tên truyện tranh <span class="required">*</span></label>
                        <input type="text" id="title" name="title" required placeholder="Nhập tên truyện..." />
                    </div>

                    <div class="form-group">
                        <label for="author">Tác giả <span class="required">*</span></label>
                        <input type="text" id="author" name="author" required placeholder="Nhập tên tác giả..." value="Dân tộc M'Nông" />
                    </div>

                    <div class="form-group">
                        <label for="category">Thể loại</label>
                        <input type="text" id="category" name="category" placeholder="Ví dụ: truyện tranh, sử thi..." value="truyện tranh" />
                    </div>

                    <div class="form-group">
                        <label for="status">Trạng thái</label>
                        <select id="status" name="status">
                            <option value="ongoing">Đang tiến hành (Ongoing)</option>
                            <option value="completed">Đã hoàn thành (Completed)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="description">Giới thiệu ngắn</label>
                        <textarea id="description" name="description" rows="3" placeholder="Nhập tóm tắt nội dung..."></textarea>
                    </div>
                </div>

                <!-- Right Column (Cover & Pages) -->
                <div class="form-column">
                    <div class="form-group">
                        <label>Ảnh bìa <span class="required">*</span></label>
                        <div class="cover-upload-area">
                            {#if previewUrl}
                                <div class="cover-preview">
                                    <img src={previewUrl} alt="Cover preview" />
                                </div>
                            {/if}
                            <input type="file" id="cover_file" accept="image/*" onchange={handleFileChange} class="file-input" required />
                            <label for="cover_file" class="file-label">
                                <i class="bx bx-upload"></i> Chọn ảnh bìa từ máy
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Các trang truyện (Chương 1) <span class="required">*</span></label>
                        <div class="pages-upload-area">
                            <input type="file" id="pages_file" accept="image/*" multiple onchange={handlePagesChange} class="file-input" />
                            <label for="pages_file" class="file-label">
                                <i class="bx bx-images"></i> Chọn nhiều ảnh trang truyện
                            </label>
                            
                            {#if pagePreviews.length > 0}
                                <div class="page-previews">
                                    <p class="muted">Đã chọn {pagePreviews.length} trang:</p>
                                    <div class="preview-grid">
                                        {#each pagePreviews as preview, i}
                                            <div class="preview-item">
                                                <img src={preview} alt="Page {i+1}" />
                                                <span class="page-num">{i + 1}</span>
                                                <button type="button" class="remove-btn" onclick={() => removePage(i)}>
                                                    <i class="bx bx-x"></i>
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            {#if errorMsg}
                <div class="message error">
                    <i class="bx bx-error-circle"></i> {errorMsg}
                </div>
            {/if}
            {#if successMsg}
                <div class="message success">
                    <i class="bx bx-check-circle"></i> {successMsg}
                </div>
            {/if}

            <div class="form-actions">
                <button type="submit" class="btn submit-btn" disabled={loading}>
                    {#if loading}
                        <i class="bx bx-loader-alt bx-spin"></i> Đang đăng...
                    {:else}
                        <i class="bx bx-check"></i> Đăng truyện tranh
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .admin-page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 60px 24px 120px;
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
    .page-nav h2 {
        margin: 0;
        font-family: 'Playfair Display', serif;
        font-size: 28px;
        font-weight: 900;
        color: var(--newsprint-ink);
    }
    .form-container {
        background: var(--newsprint-white);
        padding: 32px;
        border: 1px solid var(--newsprint-ink);
        box-shadow: var(--shadow-hard);
        border-radius: 0px;
    }
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }
    .form-group {
        margin-bottom: 20px;
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
    .required {
        color: var(--newsprint-red);
    }
    input[type="text"], select, textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--newsprint-ink);
        border-radius: 0px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        outline: none;
        transition: all 0.2s ease-out;
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
    }
    input[type="text"]:focus, select:focus, textarea:focus {
        background: var(--newsprint-white);
        border-color: var(--newsprint-red);
        box-shadow: 4px 4px 0 var(--newsprint-ink);
        transform: translate(-2px, -2px);
    }
    .file-input {
        display: none;
    }
    .file-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--newsprint-surface);
        border: 1px dashed var(--newsprint-ink);
        border-radius: 0px;
        cursor: pointer;
        transition: all 0.2s ease-out;
        font-weight: 600;
        width: 100%;
        justify-content: center;
        color: var(--newsprint-ink);
        font-size: 13px;
    }
    .file-label:hover {
        background: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }
    .cover-preview {
        margin-bottom: 1rem;
        text-align: center;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        padding: 10px;
    }
    .cover-preview img {
        max-width: 200px;
        max-height: 280px;
        object-fit: cover;
        display: block;
        margin: 0 auto;
    }
    
    .page-previews {
        margin-top: 1rem;
    }
    .preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 0.75rem;
        margin-top: 0.5rem;
    }
    .preview-item {
        position: relative;
        aspect-ratio: 2/3;
        border-radius: 0px;
        overflow: hidden;
        border: 1px solid var(--newsprint-ink);
    }
    .preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .preview-item .page-num {
        position: absolute;
        bottom: 2px;
        left: 2px;
        background: rgba(30, 27, 24, 0.85);
        color: var(--newsprint-white);
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 0px;
    }
    .remove-btn {
        position: absolute;
        top: 2px;
        right: 2px;
        background: var(--newsprint-red);
        color: white;
        border: 1px solid var(--newsprint-ink);
        border-radius: 0px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
    }
    .remove-btn:hover {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
    }

    .message {
        padding: 12px 16px;
        border: 1px solid var(--newsprint-ink);
        border-radius: 0px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
    }
    .message.error {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
        border-color: var(--newsprint-red);
        box-shadow: 2px 2px 0 var(--newsprint-red);
    }
    .message.success {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        border-color: var(--newsprint-ink);
        box-shadow: 2px 2px 0 var(--newsprint-ink);
    }
    .form-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 1.5rem;
        border-top: 1px solid var(--newsprint-divider);
    }
    .submit-btn {
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
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }
    .submit-btn:hover:not(:disabled) {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
    }
    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
    }
</style>
