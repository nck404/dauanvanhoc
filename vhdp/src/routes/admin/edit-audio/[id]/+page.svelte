<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { apiFetch } from "$lib/api.js";

    let audioItem = $state(null);
    let loading = $state(true);
    let errorMsg = $state("");
    let successMsg = $state("");

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
        if (audioItem?.cover_url) return audioItem.cover_url;
        if (audioItem?.cover) return audioItem.cover;
        return "/placeholder-book.jpg";
    }

    async function loadAudio() {
        try {
            const res = await apiFetch(`/api/audios/${page.params.id}`);
            if (res.ok) {
                const data = await res.json();
                audioItem = data.audio;
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadAudio();
    });

    async function handleFormSubmit(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title");
        const author = formData.get("author");
        const audio_url = formData.get("audio_url");
        const lyrics = formData.get("lyrics");
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
                    errorMsg = "Không thể tải ảnh bìa lên";
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
            const res = await apiFetch(`/api/audios/${audioItem.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title,
                    author,
                    cover_url,
                    audio_url,
                    lyrics
                })
            });

            if (res.ok) {
                successMsg = "Đã cập nhật audio thành công";
                goto("/admin/manage-books");
            } else {
                const result = await res.json();
                errorMsg = result.error || "Có lỗi xảy ra";
            }
        } catch (err) {
            errorMsg = "Lỗi kết nối máy chủ";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Sửa Audio - Admin Panel</title>
</svelte:head>

<div class="admin-page">
    <header class="page-nav">
        <a href="/admin/manage-books" class="back-link">
            <i class="bx bx-left-arrow-alt"></i> Quay lại
        </a>
        <div class="title">
            <h2>Sửa Audio</h2>
            {#if audioItem?.title}
                <p class="subtitle">#{audioItem.id} • {audioItem.title}</p>
            {/if}
        </div>
    </header>

    {#if !audioItem}
        <div class="card">
            <p class="muted">
                Không tìm thấy audio hoặc bạn không có quyền truy cập.
            </p>
        </div>
    {:else}
        <div class="form-container">
            <form onsubmit={handleFormSubmit} class="admin-form">
                <input type="hidden" name="id" value={audioItem.id} />

                <div class="form-left-col">
                    <div class="form-card cover-card">
                        <h3>Ảnh đại diện</h3>
                        <div class="preview-box">
                            <img src={coverSrc()} alt="Bìa" />
                        </div>
                        <label class="custom-file-upload">
                            <input type="file" onchange={handleFileChange} accept="image/*" />
                            Chọn tập tin ảnh mới
                        </label>
                        <div class="form-group margin-top">
                            <label for="cover_url">Hoặc điền URL ảnh</label>
                            <input type="text" id="cover_url" name="cover_url" bind:value={audioItem.cover_url} />
                        </div>
                    </div>
                </div>

                <div class="form-right-col">
                    <div class="form-card details-card">
                        <h3>Thông tin chi tiết</h3>

                        {#if errorMsg}
                            <div class="banner error">{errorMsg}</div>
                        {/if}
                        {#if successMsg}
                            <div class="banner success">{successMsg}</div>
                        {/if}

                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label for="title">Tiêu đề</label>
                                <input type="text" id="title" name="title" bind:value={audioItem.title} required />
                            </div>

                            <div class="form-group half-width">
                                <label for="author">Tác giả / Diễn đọc</label>
                                <input type="text" id="author" name="author" bind:value={audioItem.author} required />
                            </div>

                            <div class="form-group half-width">
                                <label for="audio_url">Đường dẫn File Audio (URL)</label>
                                <input type="text" id="audio_url" name="audio_url" bind:value={audioItem.audio_url} required />
                            </div>

                            <div class="form-group full-width">
                                <label for="lyrics">Lời thoại / Lyrics / Mô tả ngắn</label>
                                <textarea id="lyrics" name="lyrics" rows="8" bind:value={audioItem.lyrics}></textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="submit-btn" disabled={loading}>
                                {#if loading}
                                    <span class="spinner"></span> Đang lưu...
                                {:else}
                                    Lưu thay đổi
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    {/if}
</div>

<style>
    .admin-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }
    .page-nav {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 32px;
    }
    .back-link {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        background: white;
        border: 1px solid #e2e8f0;
        padding: 10px 16px;
        border-radius: 8px;
    }
    .title h2 {
        font-size: 28px;
        font-weight: 800;
        color: #1e293b;
    }
    .subtitle {
        font-size: 14px;
        color: #64748b;
    }
    .form-container form {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 32px;
    }
    .form-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .form-card h3 {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f1f5f9;
    }
    .cover-card {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .preview-box {
        width: 100%;
        aspect-ratio: 1;
        background: #f8fafc;
        border-radius: 8px;
        overflow: hidden;
        border: 2px dashed #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
    }
    .preview-box img {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
    }
    .custom-file-upload {
        display: inline-block;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        color: #3b4252;
        background-color: #e5e9f0;
        border-radius: 6px;
        cursor: pointer;
        text-align: center;
        width: 100%;
        border: 1px solid #d8dee9;
    }
    .custom-file-upload input {
        display: none;
    }
    .form-group {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .form-group label {
        font-size: 13px;
        font-weight: 700;
        color: #475569;
    }
    .form-group input, .form-group textarea {
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        outline: none;
        font-size: 14px;
        font-family: inherit;
    }
    .form-group input:focus, .form-group textarea:focus {
        border-color: #3b82f6;
    }
    .form-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }
    .full-width {
        width: 100%;
    }
    .half-width {
        width: calc(50% - 10px);
    }
    .form-actions {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
    }
    .submit-btn {
        background: #ef4444;
        color: white;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 8px;
        border: none;
        cursor: pointer;
    }
    .submit-btn:disabled {
        opacity: 0.7;
    }
    .banner {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 600;
    }
    .banner.error {
        background: #fee2e2;
        color: #ef4444;
    }
    .banner.success {
        background: #dcfce7;
        color: #15803d;
    }
    .margin-top {
        margin-top: 16px;
        width: 100%;
    }
</style>
