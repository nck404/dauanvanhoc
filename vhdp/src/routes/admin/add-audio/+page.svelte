<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { apiFetch } from "$lib/api.js";

    let loading = $state(false);
    let errorMsg = $state("");
    let successMsg = $state("");

    let quill;
    let editorContainer;
    let lyricsField = $state('');

    onMount(async () => {
        if (typeof window !== "undefined") {
            const Quill = (await import("quill")).default;
            await import("quill/dist/quill.snow.css");

            quill = new Quill(editorContainer, {
                theme: "snow",
                placeholder: "Nhập lời truyện / lời bài hát / nội dung Text ở đây...",
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
                lyricsField = quill.root.innerHTML;
            });
        }
    });

    async function handleFormSubmit(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title");
        const author = formData.get("author");
        const cover_url = formData.get("cover_url");
        const audioFile = formData.get("audio_file");

        if (!audioFile || audioFile.size === 0) {
            errorMsg = "Vui lòng chọn file audio";
            loading = false;
            return;
        }

        let audio_url = "";
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", audioFile);

            const fileName = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const uploadRes = await apiFetch(`/uploads/audios/${fileName}`, {
                method: "POST",
                body: uploadFormData
            });

            if (uploadRes.ok) {
                const uploadResult = await uploadRes.json();
                audio_url = uploadResult.url;
            } else {
                errorMsg = "Không thể tải file audio lên hệ thống";
                loading = false;
                return;
            }
        } catch (err) {
            errorMsg = "Lỗi khi tải file audio";
            loading = false;
            return;
        }

        try {
            const res = await apiFetch("/api/audios", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    author,
                    cover_url,
                    audio_url,
                    lyrics: lyricsField
                })
            });

            if (res.ok) {
                successMsg = "Đăng audio thành công";
                goto("/admin");
            } else {
                const result = await res.json();
                errorMsg = result.error || "Có lỗi xảy ra khi đăng audio";
            }
        } catch (err) {
            errorMsg = "Lỗi kết nối máy chủ";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Thêm Audio Mới - Admin</title>
</svelte:head>

<div class="admin-container">
    <div class="content-wrapper">
        <div class="header">
            <a href="/admin" class="back-link"><i class="bx bx-arrow-back"></i> Quay lại Admin</a>
            <h1><i class="bx bx-podcast"></i> Thêm Audio / Truyện Đọc Mới</h1>
            <p>Upload File Mp3 và nhập nội dung chạy song song</p>
        </div>

        {#if errorMsg}
            <div class="alert error">{errorMsg}</div>
        {/if}

        {#if successMsg}
            <div class="alert success">{successMsg}</div>
        {/if}

        <form onsubmit={handleFormSubmit} class="add-form">
            <div class="form-grid">
                <div class="form-group">
                    <label for="title">Tựa đề Audio/Truyện *</label>
                    <input type="text" id="title" name="title" required placeholder="Ví dụ: Lão Hạc (Audio)" />
                </div>

                <div class="form-group">
                    <label for="author">Tác giả *</label>
                    <input type="text" id="author" name="author" required placeholder="Nam Cao..." />
                </div>

                <div class="form-group">
                    <label for="cover_url">Link Ảnh Bìa (URL) - Tùy chọn</label>
                    <input type="url" id="cover_url" name="cover_url" placeholder="https://..." />
                </div>

                <div class="form-group">
                    <label for="audio_file">Upload file MP3/WAV *</label>
                    <input type="file" id="audio_file" name="audio_file" accept="audio/*" required class="file-input" />
                </div>
            </div>

            <div class="form-group full-width">
                <label for="lyrics">Nội dung Lyrics / Truyện Chữ *</label>
                <!-- Hidden input for Quill content -->
                <input type="hidden" name="lyrics" bind:value={lyricsField} />
                <div class="editor-wrapper">
                    <div bind:this={editorContainer} class="quill-editor"></div>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="comic-btn comic-btn--red comic-btn--lg submit-btn"><i class="bx bx-upload"></i> Đăng Audio</button>
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
        border-bottom: 1px solid rgba(0,0,0,0.05);
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

    input[type="text"], input[type="url"], select {
        padding: 12px 16px;
        border: 2px solid rgba(0,0,0,0.1);
        border-radius: 10px;
        font-family: inherit;
        font-size: 15px;
        transition: all 0.3s;
    }

    input:focus, select:focus {
        outline: none;
        border-color: var(--accent-dark);
        box-shadow: 0 0 0 4px rgba(225, 91, 91, 0.1);
    }

    .file-input {
        padding: 10px;
        border: 2px dashed rgba(0,0,0,0.2);
        border-radius: 10px;
        width: 100%;
        cursor: pointer;
    }

    .editor-wrapper {
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid rgba(0,0,0,0.1);
    }

    .quill-editor {
        min-height: 400px;
        background: #fff;
    }

    .form-actions {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
    }

    .submit-btn {
        background: var(--primary-gradient);
        color: white;
        padding: 14px 32px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .submit-btn {
        padding: 14px 32px;
        display: flex;
        align-items: center;
        gap: 10px;
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

