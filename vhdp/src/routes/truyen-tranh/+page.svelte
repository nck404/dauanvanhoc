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
            const res = await apiFetch("/api/books?type=" + encodeURIComponent("truyện tranh"));
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
    <title>Truyện Tranh - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Truyện Tranh</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
</div>

<div class="page-container">
    <header class="header-section">
        <span class="label">Ấn bản tranh ảnh</span>
        <h1>Kho tàng <em>truyện tranh</em> địa phương<span class="dot">.</span></h1>
        <p class="lead">Tuyển tập truyện tranh, ký họa và tranh dân gian đặc sắc được số hóa chất lượng cao.</p>

        <div class="search-bar">
            <i class="bx bx-search"></i>
            <input
                type="text"
                placeholder="Tìm kiếm tác phẩm hoặc tác giả..."
                bind:value={searchQuery}
            />
        </div>
    </header>

    <section class="content-section">
        <div class="book-grid">
            {#if !loaded}
                {#each Array(SKELETON_COUNT).fill(0) as _, i}
                    <SkeletonCard type="book" />
                {/each}
            {:else if filteredBooks.length === 0}
                <div class="empty">
                    Không tìm thấy tác phẩm truyện tranh nào.
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
        top: 0;
        bottom: 0;
        width: 40px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        border-right: 1px solid var(--line);
        pointer-events: none;
    }
    .side-rail.left {
        left: 0;
    }
    .side-rail.right {
        right: 0;
        border-right: none;
        border-left: 1px solid var(--line);
    }
    .rail-text {
        font-family: "Space Grotesk", sans-serif;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--ink-faint);
        transform: rotate(-90deg);
        white-space: nowrap;
    }
    .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 60px 100px;
    }
    .header-section {
        margin-bottom: 60px;
        position: relative;
    }
    .label {
        display: inline-block;
        font-family: "Space Grotesk", sans-serif;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--coral);
        margin-bottom: 12px;
        border-bottom: 2px solid var(--coral);
        padding-bottom: 4px;
    }
    .header-section h1 {
        font-size: clamp(32px, 5vw, 56px);
        font-weight: 800;
        color: var(--ink);
        line-height: 1.1;
        margin-bottom: 20px;
    }
    .header-section em {
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-weight: 400;
        color: var(--coral);
    }
    .dot {
        color: var(--coral);
    }
    .lead {
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-size: 18px;
        color: var(--ink-soft);
        max-width: 600px;
        margin-bottom: 40px;
        line-height: 1.6;
    }
    .search-bar {
        position: relative;
        max-width: 500px;
        display: flex;
        align-items: center;
    }
    .search-bar i {
        position: absolute;
        left: 20px;
        font-size: 20px;
        color: var(--ink-mute);
    }
    .search-bar input {
        width: 100%;
        padding: 16px 20px 16px 54px;
        font-size: 15px;
        border: 2px solid var(--line);
        background: rgba(255, 255, 255, 0.8);
        border-radius: 99px;
        outline: none;
        transition: all 0.3s;
    }
    .search-bar input:focus {
        border-color: var(--coral);
        background: #fff;
    }
    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 20px;
    }
    .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 80px 20px;
        font-family: "Playfair Display", serif;
        font-style: italic;
        font-size: 20px;
        color: var(--ink-soft);
        border: 2px dashed var(--line);
        border-radius: 12px;
    }
    @media (max-width: 768px) {
        .page-container {
            padding: 20px 30px;
        }
        .side-rail {
            display: none;
        }
    }
</style>
