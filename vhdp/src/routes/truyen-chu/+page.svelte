<script>
    import { onMount } from "svelte";
    import BookCard from "$lib/BookCard.svelte";
    import SkeletonCard from "$lib/components/SkeletonCard.svelte";
    import { apiFetch } from "$lib/api.js";

    let books = $state([]);
    let loaded = $state(false);
    let searchQuery = $state("");

    let filteredBooks = $derived(
        books.filter(
            (book) =>
                book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    onMount(async () => {
        document.body.classList.add("paper-theme");
        try {
            const res = await apiFetch("/api/books?type=" + encodeURIComponent("truyện chữ") + "&limit=999");
            if (res.ok) {
                const data = await res.json();
                books = data.books || [];
            }
        } catch (e) {
            console.error(e);
        }
        const timer = setTimeout(() => {
            loaded = true;
        }, 420);
        return () => {
            clearTimeout(timer);
            document.body.classList.remove("paper-theme");
        };
    });

    const SKELETON_COUNT = 8;
</script>

<svelte:head>
    <title>Truyện Chữ - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Truyện Chữ</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
</div>

<div class="page-container">
    <header class="page-header">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Truyện Chữ</span>
        </div>
        
        <h1 class="page-title">
            Kho tàng <em class="page-accent">truyện chữ</em> truyền bản<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Hàng ngàn tác phẩm văn học chữ, tiểu thuyết lịch sử và thơ ca truyền thống được lưu giữ nguyên vẹn bản điện tử.
        </p>

        <div class="editorial-search">
            <i class="bx bx-search editorial-search-icon"></i>
            <input
                type="text"
                placeholder="Tìm kiếm tác phẩm hoặc tác giả..."
                bind:value={searchQuery}
                class="editorial-search-input"
            />
            <button class="editorial-search-btn">Tìm kiếm</button>
        </div>
    </header>

    <section class="content-section">
        <div class="section-header">
            <div class="section-count">{filteredBooks.length} Tác phẩm</div>
            <div class="small-ornament">✧✧✧✧</div>
            <div class="section-updated">Cập nhật liên tục</div>
        </div>

        <div class="book-grid">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <SkeletonCard type="book" />
                {/each}
            {:else if filteredBooks.length === 0}
                <div class="empty empty--center">
                    <div class="empty-symbol">§</div>
                    <p>Không tìm thấy tác phẩm truyện chữ nào</p>
                </div>
            {:else}
                {#each filteredBooks as book}
                    <BookCard {book} />
                {/each}
            {/if}
        </div>
    </section>
</div>

<style>
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
    
    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 100px 24px 120px;
    }
    
    .page-header {
        padding: 60px 0 80px;
        border-bottom: 4px solid var(--newsprint-ink);
        margin-bottom: 30px;
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

    .search-wrapper {
        border: 2px solid var(--newsprint-ink);
    }
    
    .small-ornament {
        text-align: center;
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        letter-spacing: 0.1em;
        color: var(--newsprint-red);
        padding: 0;
        margin: 0;
    }

    .content-section {
        margin-top: 20px;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 16px;
        margin-bottom: 32px;
    }

    .section-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--newsprint-ink);
    }

    .section-updated {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
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
    
    @media (max-width: 1024px) {
        .book-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    
    @media (max-width: 768px) {
        .page-container {
            padding: 80px 24px 100px;
        }
        .side-rail {
            display: none;
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
</style>
