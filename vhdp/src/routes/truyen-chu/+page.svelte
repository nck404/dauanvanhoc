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
            const res = await apiFetch("/api/books?type=" + encodeURIComponent("truyện chữ"));
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
    <header class="header-section">
        <div class="header-meta font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6 pb-3 border-b border-neutral-200">
            <span>Section I</span>
            <span class="mx-3">|</span>
            <span>Truyện Chữ</span>
        </div>
        
        <h1 class="font-serif font-black text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tighter text-[#111111] mb-6">
            Kho tàng <span class="italic text-[#CC0000]">truyện chữ</span> truyền bản<span class="text-[#CC0000]">.</span>
        </h1>
        
        <p class="lead font-body text-base sm:text-lg leading-relaxed text-neutral-600 max-w-[55ch] mb-8">
            Hàng ngàn tác phẩm văn học chữ, tiểu thuyết lịch sử và thơ ca truyền thống được lưu giữ nguyên vẹn bản điện tử.
        </p>

        <div class="search-bar flex items-center gap-3 border-b-2 border-[#111111] pb-3 max-w-[600px]">
            <i class="bx bx-search text-[#CC0000] text-xl"></i>
            <input
                type="text"
                placeholder="Tìm kiếm tác phẩm hoặc tác giả..."
                bind:value={searchQuery}
                class="newsprint-input"
            />
        </div>
    </header>

    <section class="content-section">
        <div class="section-header flex items-center justify-between border-t-2 border-[#111111] pt-4 mb-8">
            <div class="font-mono text-xs uppercase tracking-[0.18em] font-bold text-[#111111]">
                {filteredBooks.length} Tác phẩm
            </div>
            <div class="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Cập nhật liên tục
            </div>
        </div>

        <div class="book-grid">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <SkeletonCard type="book" />
                {/each}
            {:else if filteredBooks.length === 0}
                <div class="empty-state">
                    <div class="font-serif text-5xl text-neutral-200 mb-3">§</div>
                    <p class="font-serif text-base text-neutral-400">Không tìm thấy tác phẩm truyện chữ nào</p>
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
    
    .header-section {
        margin-bottom: 60px;
        position: relative;
    }
    
    .header-meta {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--newsprint-neutral-500);
        border-bottom: 1px solid var(--newsprint-divider);
        padding-bottom: 12px;
        margin-bottom: 24px;
    }
    
    .header-section h1 {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        color: var(--newsprint-ink);
        line-height: 1.1;
        margin-bottom: 20px;
    }
    
    .lead {
        font-family: 'Lora', serif;
        font-style: normal;
        font-size: 18px;
        color: var(--newsprint-neutral-600);
        max-width: 600px;
        margin-bottom: 32px;
        line-height: 1.625;
    }
    
    .search-bar {
        position: relative;
        max-width: 600px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 2px solid var(--newsprint-ink);
        padding-bottom: 12px;
    }
    
    .search-bar i {
        color: var(--newsprint-red);
        font-size: 20px;
    }
    
    .search-bar input {
        width: 100%;
        padding: 12px 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        color: var(--newsprint-ink);
        background: transparent;
        border: none;
        outline: none;
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
    
    .section-header > div {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--newsprint-ink);
    }
    
    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 24px;
    }
    
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        border: 2px dashed var(--newsprint-divider);
        background: var(--newsprint-surface);
    }
    
    .empty-state p {
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        color: var(--newsprint-neutral-400);
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
        
        .header-section h1 {
            font-size: 32px;
        }
    }
    
    @media (max-width: 480px) {
        .book-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
