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
        document.body.classList.add("paper-theme");
        
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
        
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });

    async function handleFormSubmit(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title");
        const author = formData.get("author");
        const audioFile = formData.get("audio_file");
        const coverFile = formData.get("cover_file");

        if (!audioFile || audioFile.size === 0) {
            errorMsg = "Vui lòng chọn file audio";
            loading = false;
            return;
        }

        let audio_url = "";
        let cover_url = "";

        // Upload cover if exists
        if (coverFile && coverFile.size > 0) {
            try {
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
                }
            } catch (err) {
                console.error("Cover upload error", err);
            }
        }
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
    <title>Thêm Audio Mới - Tòa Soạn</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Tòa Soạn — Audio / Podcast</div>
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
                Phát thanh <em class="page-accent">Audio mới</em><span class="page-dot">.</span>
            </h1>
            
            <p class="page-lead">
                Tải lên bản ghi âm (MP3) và nhập nội dung văn bản để hệ thống có thể đồng bộ khi phát.
            </p>
        </header>

        {#if errorMsg}
            <div class="alert error font-mono">{errorMsg}</div>
        {/if}

        {#if successMsg}
            <div class="alert success font-mono">{successMsg}</div>
        {/if}

        <form onsubmit={handleFormSubmit} class="add-form">
            <div class="form-grid">
                <div class="form-group">
                    <label for="title" class="font-mono">Tựa đề Audio/Truyện *</label>
                    <input type="text" id="title" name="title" required placeholder="Ví dụ: Lão Hạc (Audio)" class="newsprint-input" />
                </div>

                <div class="form-group">
                    <label for="author" class="font-mono">Tác giả / Diễn đọc *</label>
                    <input type="text" id="author" name="author" required placeholder="Ví dụ: Nam Cao" class="newsprint-input" />
                </div>

                <div class="form-group">
                    <label for="cover_file" class="font-mono">Ảnh bìa (Tùy chọn)</label>
                    <input type="file" id="cover_file" name="cover_file" accept="image/*" class="newsprint-input file-input" />
                </div>

                <div class="form-group">
                    <label for="audio_file" class="font-mono">Tệp MP3/WAV *</label>
                    <input type="file" id="audio_file" name="audio_file" accept="audio/*" required class="newsprint-input file-input" />
                </div>
            </div>

            <div class="form-group full-width">
                <label for="lyrics" class="font-mono">Nội dung Văn bản / Lời bài hát *</label>
                <input type="hidden" name="lyrics" bind:value={lyricsField} />
                <div class="editor-wrapper">
                    <div bind:this={editorContainer} class="quill-editor font-serif"></div>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="newsprint-btn newsprint-btn--primary" disabled={loading}>
                    <i class="bx bx-upload"></i> {loading ? 'Đang tải lên...' : 'Phát Hành Audio'}
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
        .form-grid { grid-template-columns: 1fr; }
        .content-wrapper { padding: 24px; }
        .side-rail { display: none; }
        .page-title { font-size: 32px; }
    }
</style>

