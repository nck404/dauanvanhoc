<script>
    import { onMount } from "svelte";
    import BookCard from "$lib/BookCard.svelte";
    import { apiFetch } from "$lib/api.js";

    let bookmarkedBooks = $state([]);
    let activeFilter = $state("all");
    let loading = $state(true);

    async function loadLibrary() {
        try {
            const res = await apiFetch("/api/library");
            if (res.ok) {
                const data = await res.json();
                bookmarkedBooks = data.bookmarkedBooks || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        document.body.classList.add("paper-theme");
        loadLibrary();
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });

    async function removeBookmark(bookId, e) {
        e.preventDefault();
        try {
            const res = await apiFetch("/api/library", {
                method: "DELETE",
                body: JSON.stringify({ bookId })
            });
            if (res.ok) {
                bookmarkedBooks = bookmarkedBooks.filter(b => b.id !== bookId);
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<svelte:head>
    <title>Thư viện của tôi - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Thư Viện</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
</div>

<div class="page-container">
    <header class="page-header">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Thư viện cá nhân</span>
        </div>
        
        <h1 class="page-title">
            Bộ sưu tập <em class="page-accent">tác phẩm</em> yêu thích<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Nơi lưu giữ những cuốn sách, truyện chữ và nội dung bạn đang theo dõi.
        </p>

        <div class="filters">
            <button
                class="filter-btn {activeFilter === 'all' ? 'active' : ''}"
                onclick={() => (activeFilter = "all")}
            >
                Tất cả ({bookmarkedBooks.length})
            </button>
        </div>
    </header>

    <section class="content-section">
        <div class="section-header">
            <div class="section-count">{bookmarkedBooks.length} Tác phẩm đã lưu</div>
            <div class="section-updated">Đồng bộ tự động</div>
        </div>

        <div class="book-grid">
            {#if loading}
                <div class="loading-state font-mono">Đang tải dữ liệu...</div>
            {:else if bookmarkedBooks.length === 0}
                <div class="empty empty--center">
                    <div class="empty-symbol">§</div>
                    <p>Thư viện của bạn đang trống. Hãy tìm cho mình một tác phẩm tâm đắc nhé.</p>
                    <a href="/" class="newsprint-btn newsprint-btn--primary mt-4">Khám phá ngay</a>
                </div>
            {:else}
                {#each bookmarkedBooks as book (book.id)}
                    <div class="book-item-wrapper newsprint-card hard-shadow-hover">
                        <div class="book-link-wrapper">
                            <BookCard {book} />
                        </div>

                        <form
                            onsubmit={(e) => removeBookmark(book.id, e)}
                            class="remove-form"
                        >
                            <button
                                type="submit"
                                class="remove-btn"
                                title="Xóa khỏi thư viện"
                            >
                                <i class="bx bx-x"></i>
                            </button>
                        </form>
                    </div>
                {/each}
            {/if}
        </div>
    </section>
</div>

<style>
    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 100px 24px 120px;
    }
    
    .page-header {
        padding: 60px 0 80px;
        border-bottom: 4px solid var(--newsprint-ink);
        margin-bottom: 60px;
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
        margin-bottom: 24px;
    }

    .header-label-bar {
        width: 48px;
        height: 2px;
        background: var(--newsprint-red);
    }

    .page-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: clamp(38px, 4.5vw, 64px);
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: var(--newsprint-ink);
        margin-bottom: 24px;
    }

    .page-title em {
        font-style: italic;
        color: var(--newsprint-red);
    }

    .page-dot {
        color: #cc0000;
    }

    .page-lead {
        font-family: 'Lora', serif;
        font-size: 16px;
        line-height: 1.6;
        color: var(--newsprint-neutral-600);
        max-width: 44ch;
        margin-bottom: 32px;
    }

    .filters {
        display: flex;
        gap: 12px;
    }

    .filter-btn {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 10px 20px;
        background: transparent;
        color: var(--newsprint-ink);
        border: 2px solid var(--newsprint-ink);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .filter-btn:hover {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .filter-btn.active {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
        box-shadow: 4px 4px 0 rgba(0,0,0,1);
        transform: translate(-2px, -2px);
    }

    .content-section {
        margin-top: 60px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 2px solid var(--newsprint-ink);
        padding-top: 16px;
        margin-bottom: 32px;
    }

    .section-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--newsprint-ink);
    }

    .section-updated {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-neutral-500);
    }
    
    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 24px;
    }
    
    .book-item-wrapper {
        position: relative;
        background: var(--newsprint-surface);
        display: flex;
        flex-direction: column;
    }

    .book-link-wrapper {
        flex: 1;
    }
    
    .book-item-wrapper :global(.book-card) {
        height: 100%;
        border: none;
        box-shadow: none;
    }

    .book-item-wrapper :global(.book-card:hover) {
        transform: none;
        box-shadow: none;
    }

    .remove-form {
        position: absolute;
        top: -12px;
        right: -12px;
        z-index: 10;
    }

    .remove-btn {
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--newsprint-ink);
        font-size: 20px;
        cursor: pointer;
        box-shadow: 2px 2px 0 rgba(0,0,0,1);
        transition: all 0.2s ease;
    }

    .remove-btn:hover {
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--newsprint-red);
        color: var(--newsprint-red);
        border-color: var(--newsprint-red);
    }

    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        border: 2px dashed var(--newsprint-divider);
        background: var(--newsprint-surface);
    }

    .empty--center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .empty-symbol {
        font-family: 'Playfair Display', serif;
        font-size: 64px;
        color: var(--newsprint-neutral-300);
        line-height: 1;
    }

    .empty p {
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        color: var(--newsprint-neutral-500);
    }
    
    .loading-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px;
        font-size: 14px;
        color: var(--newsprint-neutral-500);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    
    @media (max-width: 1024px) {
        .book-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    
    @media (max-width: 768px) {
        .page-container {
            padding: 80px 24px 100px;
        }
        
        .book-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        
        .page-title {
            font-size: 32px;
        }
    }
    
    @media (max-width: 480px) {
        .book-grid {
            grid-template-columns: 1fr;
        }
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
    
    .side-rail.left {
        left: 20px;
    }
    
    .side-rail.right {
        right: 20px;
    }
    
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
        .side-rail {
            display: none;
        }
    }
</style>

