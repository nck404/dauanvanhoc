<script>
    import { onMount } from "svelte";
    import BookCard from "$lib/BookCard.svelte";
    import SkeletonCard from "$lib/components/SkeletonCard.svelte";
    import { fade, slide } from "svelte/transition";
    import { apiFetch } from "$lib/api.js";

    let truyenChu = $state([]);
    let truyenTranh = $state([]);
    let audios = $state([]);
    let videos = $state([]);
    let loaded = $state(false);
    let searchQuery = $state("");
    let isSearchModalOpen = $state(false);
    let searchInput = $state(null);

    onMount(async () => {
        document.body.classList.add("paper-theme");

        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (!isSearchModalOpen) {
                    openSearchModal();
                }
            }
            if (e.key === 'Escape' && isSearchModalOpen) {
                closeSearchModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        try {
            const res = await apiFetch("/api/homepage");
            if (res.ok) {
                const data = await res.json();
                truyenChu = data.truyenChu || [];
                truyenTranh = data.truyenTranh || [];
                audios = data.audios || [];
                videos = data.videos || [];
            }
        } catch (e) {
            console.error(e);
        }
        
        const t = setTimeout(() => { loaded = true; }, 420);
        return () => {
            clearTimeout(t);
            window.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove("paper-theme");
        };
    });

    function openSearchModal() {
        isSearchModalOpen = true;
        requestAnimationFrame(() => {
            searchInput?.focus();
            searchInput?.select?.();
        });
        document.body.classList.add("search-open");
    }

    function closeSearchModal() {
        isSearchModalOpen = false;
        searchQuery = "";
        document.body.classList.remove("search-open");
    }

    const SKELETON_COUNT = 3;
    
    // Featured works - top 3 from each category
    let featuredTruyenChu = $derived(truyenChu.slice(0, 3));
    let featuredTruyenTranh = $derived(truyenTranh.slice(0, 3));
    let totalWorks = $derived(truyenChu.length + truyenTranh.length + audios.length + videos.length);
    let mediaTypeSummaries = $derived([
        { label: "Chữ", count: truyenChu.length },
        { label: "Manga", count: truyenTranh.length },
        { label: "Audio", count: audios.length },
        { label: "Video", count: videos.length }
    ]);
</script>

<div class="side-rail left">
        <div class="rail-text">Thư viện văn học số — Lâm Đồng</div>
    </div>
    <div class="side-rail right">
        <div class="rail-text">Vol. 01 / Số Nº 01 — MMXXVI</div>
    </div>

    <div class="page-container">
    <!-- Hero Section -->
    <header class="hero-section">
        <div class="hero-grid">
            <div class="hero-copy">
                <div class="hero-label">
                    <span class="hero-label-bar"></span>
                    <span>Thư viện văn học số</span>
                </div>
                
                <h1 class="hero-title">
                    Kho lưu trữ<br/>
                    <em class="hero-accent">văn học</em> địa phương
                    <span class="hero-location">Lâm Đồng<span class="hero-dot">.</span></span>
                </h1>
                
                <p class="hero-lead">
                    Bảo tồn, lưu giữ và phát huy giá trị văn hóa nghệ thuật của địa phương qua kho tàng tác phẩm số hóa chất lượng cao.
                </p>

                <div class="media-tags">
                    {#each mediaTypeSummaries as item}
                        <span class="media-tag">
                            <span class="media-tag-accent">{item.label}</span>
                            <span class="media-tag-count">{item.count}</span>
                        </span>
                    {/each}
                </div>

                <button type="button" class="search-cta" onclick={openSearchModal}>
                    <i class="bx bx-search"></i>
                    <span>Khám phá tác phẩm</span>
                </button>
            </div>
            
            <div class="hero-visual">
                <div class="edition-box">
                    <div class="edition-header">
                        <div class="edition-vol">Vol. 01 / Số Nº 01</div>
                        <div class="edition-title">Tây Nguyên<br/>Lâm Đồng.</div>
                    </div>
                    
                    <div class="edition-content">
                        <img src="/images/texture-lab-1783009070437.png" alt="Văn học địa phương" class="edition-image" />
                        
                        <div class="edition-toc">
                            <div class="toc-label">Mục lục</div>
                            <div class="toc-list">
                                <div class="toc-item">
                                    <span class="toc-num">I.</span>
                                    <span class="toc-text">Truyện Chữ</span>
                                </div>
                                <div class="toc-item">
                                    <span class="toc-num">II.</span>
                                    <span class="toc-text">Truyện Tranh</span>
                                </div>
                                <div class="toc-item">
                                    <span class="toc-num">III.</span>
                                    <span class="toc-text">Audio & Video</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Featured Works Section -->
    <section class="featured-section">
        <div class="section-header section-header--center">
            <div class="section-ornament">&#x2727; &#x2727; &#x2727; &#x2727;</div>
            <div class="section-tag">Nổi bật</div>
            <h2 class="section-title">
                Tác phẩm <em class="section-accent">nổi bật</em>
            </h2>
        </div>

        <!-- Truyện Chữ Featured -->
        <div class="featured-category">
            <div class="category-header">
                <div class="category-header-main">
                    <span class="category-number">I.</span>
                    <h3 class="category-title">Truyện Chữ</h3>
                </div>
                <a href="/truyen-chu" class="view-all-link">
                    <span>Xem tất cả</span>
                    <i class="bx bx-right-arrow-alt"></i>
                </a>
            </div>
            
            <div class="book-grid">
                {#if !loaded}
                    {#each Array(SKELETON_COUNT).fill(0) as _}
                        <SkeletonCard type="book" />
                    {/each}
                {:else if featuredTruyenChu.length === 0}
                    <div class="empty-state">
                        <div class="empty-symbol">§</div>
                        <p>Chưa có truyện chữ nổi bật</p>
                    </div>
                {:else}
                    {#each featuredTruyenChu as book}
                        <BookCard {book} />
                    {/each}
                {/if}
            </div>
        </div>

        <!-- Truyện Tranh Featured -->
        <div class="featured-category">
            <div class="category-header">
                <div class="category-header-main">
                    <span class="category-number">II.</span>
                    <h3 class="category-title">Truyện Tranh</h3>
                </div>
                <a href="/truyen-tranh" class="view-all-link">
                    <span>Xem tất cả</span>
                    <i class="bx bx-right-arrow-alt"></i>
                </a>
            </div>
            
            <div class="book-grid">
                {#if !loaded}
                    {#each Array(SKELETON_COUNT).fill(0) as _}
                        <SkeletonCard type="book" />
                    {/each}
                {:else if featuredTruyenTranh.length === 0}
                    <div class="empty-state">
                        <div class="empty-symbol">§</div>
                        <p>Chưa có truyện tranh nổi bật</p>
                    </div>
                {:else}
                    {#each featuredTruyenTranh as book}
                        <BookCard {book} />
                    {/each}
                {/if}
            </div>
        </div>
    </section>

    <!-- Media Section -->
    <section class="media-section">
        <div class="section-header">
            <div class="section-tag">Đa phương tiện</div>
            <h2 class="section-title">Audio & Video</h2>
        </div>

        <div class="media-grid">
            <!-- Audio -->
            <div class="media-category">
                <div class="category-header">
                    <div class="category-header-main">
                        <span class="category-number category-number--media">III.</span>
                        <h3 class="category-title category-title--media">Audio Sách</h3>
                    </div>
                    <a href="/audio" class="view-all-link view-all-link--media">
                        Xem tất cả →
                    </a>
                </div>
                
                <div class="media-list">
                    {#if !loaded}
                        {#each Array(3).fill(0) as _}
                            <SkeletonCard type="audio" />
                        {/each}
                    {:else if audios.length === 0}
                        <div class="empty-state empty-state--media">
                            <div class="empty-symbol">§</div>
                            <p>Chưa có audio</p>
                        </div>
                    {:else}
                        {#each audios.slice(0, 3) as audio}
                            <a href="/audio/{audio.id}" class="media-item">
                                <div class="media-icon">
                                    <i class="bx bx-music"></i>
                                </div>
                                <div class="media-info">
                                    <h4>{audio.title}</h4>
                                    <p>{audio.author}</p>
                                </div>
                                <i class="bx bx-play-circle media-play-icon"></i>
                            </a>
                        {/each}
                    {/if}
                </div>
            </div>

            <!-- Video -->
            <div class="media-category">
                <div class="category-header">
                    <div class="category-header-main">
                        <span class="category-number category-number--media">IV.</span>
                        <h3 class="category-title category-title--media">Video Tư Liệu</h3>
                    </div>
                    <a href="/video" class="view-all-link view-all-link--media">
                        Xem tất cả →
                    </a>
                </div>
                
                <div class="media-list">
                    {#if !loaded}
                        {#each Array(3).fill(0) as _}
                            <SkeletonCard type="video" />
                        {/each}
                    {:else if videos.length === 0}
                        <div class="empty-state empty-state--media">
                            <div class="empty-symbol">§</div>
                            <p>Chưa có video</p>
                        </div>
                    {:else}
                        {#each videos.slice(0, 3) as video}
                            <a href="/video/{video.id}" class="media-item">
                                <div class="media-icon">
                                    <i class="bx bx-video"></i>
                                </div>
                                <div class="media-info">
                                    <h4>{video.title}</h4>
                                    <p>{video.author}</p>
                                </div>
                                <i class="bx bx-play-circle media-play-icon"></i>
                            </a>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </section>

    <!-- Ornamental Divider -->
    <div class="ornament-divider">
        &#x2727; &#x2727; &#x2727; &#x2727;
    </div>
</div>

<!-- Search Modal -->
{#if isSearchModalOpen}
    <div class="search-open-global-blur" aria-hidden="true"></div>
    <div class="spotlight-overlay" onclick={closeSearchModal}>
        <div class="spotlight-panel" onclick={(e) => e.stopPropagation()}>
            <div class="spotlight-search">
                <i class="bx bx-search"></i>
                <input
                    type="text"
                    placeholder="Tìm kiếm tác phẩm hoặc tác giả..."
                    bind:value={searchQuery}
                    bind:this={searchInput}
                    autofocus
                />
                <kbd class="spotlight-kbd">ESC</kbd>
            </div>
            
            <div class="spotlight-results">
                {#if searchQuery.trim() !== ""}
                    {@const filteredTruyenChu = truyenChu.filter(b => 
                        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        b.author?.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    {@const filteredTruyenTranh = truyenTranh.filter(b => 
                        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        b.author?.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    {#if filteredTruyenChu.length === 0 && filteredTruyenTranh.length === 0}
                        <div class="no-results">
                            <div class="empty-symbol">§</div>
                            <p>Không tìm thấy kết quả phù hợp</p>
                        </div>
                    {:else}
                        {#if filteredTruyenChu.length > 0}
                            <div class="result-section">
                                <div class="result-section-header">
                                    <span>Truyện chữ</span>
                                </div>
                                <div class="result-items">
                                    {#each filteredTruyenChu as book}
                                        <a href="/read/{book.id}" class="result-item" onclick={closeSearchModal}>
                                            <img src={book.cover_url} alt={book.title} class="result-cover" />
                                            <div class="item-info">
                                                <span class="item-title">{book.title}</span>
                                                <span class="item-author">{book.author}</span>
                                            </div>
                                            <span class="result-arrow">→</span>
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        {#if filteredTruyenTranh.length > 0}
                            <div class="result-section">
                                <div class="result-section-header">
                                    <span>Truyện tranh</span>
                                </div>
                                <div class="result-items">
                                    {#each filteredTruyenTranh as book}
                                        <a href="/read/{book.id}" class="result-item" onclick={closeSearchModal}>
                                            <img src={book.cover_url} alt={book.title} class="result-cover" />
                                            <div class="item-info">
                                                <span class="item-title">{book.title}</span>
                                                <span class="item-author">{book.author}</span>
                                            </div>
                                            <span class="result-arrow">→</span>
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {/if}
                {:else}
                    <div class="search-helper">
                        <i class="bx bx-search"></i>
                        <p>Nhập từ khóa để bắt đầu tìm kiếm</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    /* Global search overlay - must sit above navbar area when search open */
    .search-open-global-blur {
        display: none;
    }

    body.search-open .search-open-global-blur,
    body.search-open .spotlight-overlay {
        display: flex;
    }

    body.search-open .masthead {
        filter: blur(6px);
        pointer-events: none;
    }

    body.search-open .page-container {
        filter: blur(1px);
    }
    .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 60px 40px 100px;
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

    /* Hero Section */
    .hero-section {
        padding: 60px 0 80px;
        /* border-bottom: 4px solid var(--newsprint-ink); */
        margin-bottom: 60px;
    }

    .hero-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 60px;
        align-items: start;
    }

    .hero-copy {
        max-width: 900px;
    }

    .hero-label {
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

    .hero-label-bar {
        width: 48px;
        height: 2px;
        background: var(--newsprint-red);
    }

    .hero-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: clamp(44px, 5vw, 72px);
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--newsprint-ink);
        margin-bottom: 24px;
    }

    .hero-title em {
        font-style: italic;
        color: var(--newsprint-red);
    }

    .hero-location {
        color: #b30000;
        white-space: nowrap;
        font-weight: 900;
    }

    .hero-dot {
        color: #cc0000;
    }

    .hero-lead {
        font-family: 'Lora', serif;
        font-size: 18px;
        line-height: 1.6;
        color: var(--newsprint-neutral-600);
        max-width: 48ch;
        margin-bottom: 32px;
    }

    .media-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
    }

    .media-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .media-tag-accent {
        color: var(--newsprint-red);
    }

    .media-tag-count {
        color: var(--newsprint-ink);
    }

    .search-cta {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 12px 24px;
        min-height: 44px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-ink);
        color: var(--newsprint-bg);
        cursor: pointer;
        transition: all 0.2s ease-out;
        margin-top: 40px;
    }

    .search-cta:hover {
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
    }

    .search-cta i {
        font-size: 20px;
    }

    .hero-visual {
        position: relative;
    }

    .edition-box {
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-bg);
        padding: 24px;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .edition-header {
        padding-bottom: 16px;
        margin-bottom: 24px;
        border-bottom: 2px solid var(--newsprint-ink);
    }

    .edition-vol {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--newsprint-neutral-500);
        margin-bottom: 8px;
    }

    .edition-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: 28px;
        line-height: 1.2;
        color: var(--newsprint-ink);
    }

    .edition-content {
        display: flex;
        flex-direction: column;
    }

    .edition-image {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border: 1px solid var(--newsprint-ink);
        margin-bottom: 20px;
    }

    .edition-toc {
        border-top: 2px solid var(--newsprint-ink);
        padding-top: 20px;
        margin-top: auto;
    }

    .toc-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-neutral-500);
        margin-bottom: 12px;
    }

    .toc-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .toc-item {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .toc-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        color: var(--newsprint-red);
    }

    .toc-text {
        font-family: 'Playfair Display', serif;
        font-size: 14px;
        color: var(--newsprint-ink);
    }

    @media (max-width: 1024px) {
        .hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
        }

        .hero-visual {
            max-width: 500px;
            margin: 0 auto;
        }
    }

    @media (max-width: 768px) {
        .page-container {
            padding: 24px 20px 80px;
        }

        .side-rail {
            display: none;
        }

        .hero-section {
            padding: 40px 0 60px;
            margin-bottom: 40px;
        }

        .hero-title {
            font-size: 32px;
        }
    }

    /* Featured Section */
    .featured-section {
        margin-bottom: 60px;
    }

    .section-header {
        margin-bottom: 40px;
        text-align: center;
    }

    .section-header--center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding-top: 32px;
        border-top: 3px solid var(--newsprint-ink);
        position: relative;
    }

    .section-ornament {
        font-size: 14px;
        color: var(--newsprint-red);
        letter-spacing: 0.5em;
        line-height: 1;
    }

    .section-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.35em;
        color: var(--newsprint-red);
        position: relative;
        display: inline-block;
    }

    .section-tag::before,
    .section-tag::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 24px;
        height: 1px;
        background: var(--newsprint-ink);
    }

    .section-tag::before {
        right: calc(100% + 10px);
    }

    .section-tag::after {
        left: calc(100% + 10px);
    }

    .section-title {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: clamp(32px, 4vw, 48px);
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--newsprint-ink);
    }

    .section-accent {
        font-style: italic;
        color: var(--newsprint-red);
    }

    .featured-category {
        margin-bottom: 60px;
    }

    .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--newsprint-ink);
        gap: 12px;
        flex-wrap: nowrap;
    }

    .category-header-main {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
    }

    .category-number {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 24px;
        color: var(--newsprint-red);
    }

    .category-number--media {
        font-size: 20px;
    }

    .category-header h3,
    .category-title {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--newsprint-ink);
    }

    .category-title--media {
        font-size: 11px;
        letter-spacing: 0.15em;
    }

    .view-all-link {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--newsprint-neutral-500);
        text-decoration: none;
        transition: color 0.2s ease-out;
    }

    .view-all-link:hover {
        color: var(--newsprint-red);
    }

    /* Book Grid */
    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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

    /* Media Section */
    .media-section {
        margin-top: 60px;
    }

    .media-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: start;
    }

    .media-category {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
    }

    .media-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .media-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        text-decoration: none;
        color: inherit;
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-ink);
        border-radius: 0;
        transition: all 0.2s ease-out;
    }

    .media-item:hover {
        background: var(--newsprint-surface);
        box-shadow: var(--shadow-hard);
        transform: translate(-2px, -2px);
    }

    .media-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--newsprint-ink);
    }

    .media-info {
        flex: 1;
        min-width: 0;
    }

    .media-info h4 {
        font-family: 'Playfair Display', serif;
        font-size: 14px;
        font-weight: 700;
        color: var(--newsprint-ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
        line-height: 1.3;
    }

    .media-info p {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 12px;
        color: var(--newsprint-neutral-500);
        line-height: 1.4;
    }

    /* Ornament */
    .ornament-divider {
        padding: 40px 0;
        text-align: center;
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        color: var(--newsprint-neutral-300);
        letter-spacing: 0.8em;
    }

    /* Responsive */
    @media (max-width: 1024px) {
        .hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
        }

        .hero-visual {
            max-width: 500px;
            margin: 0 auto;
        }
    }

    @media (max-width: 768px) {
        .page-container {
            padding: 24px 20px 80px;
        }

        .hero-section {
            padding: 40px 0 60px;
            margin-bottom: 40px;
        }
        
        .book-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }

        .featured-category {
            margin-bottom: 40px;
        }

        .category-header {
            gap: 8px;
            padding-bottom: 12px;
        }

        .category-header .flex {
            gap: 8px;
        }

        .category-header h3 {
            font-size: 11px;
            letter-spacing: 0.12em;
        }
    }

    @media (max-width: 480px) {
        .book-grid {
            grid-template-columns: 1fr;
        }

        .hero-title {
            font-size: 36px;
        }
    }

    /* Spotlight Search Modal - macOS style */
    .spotlight-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 15vh 20px 20px;
    }

    .search-open-global-blur {
        display: none;
    }

    body.search-open .search-open-global-blur {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 30;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        pointer-events: none;
    }

    body:not(.search-open) .spotlight-overlay {
        display: none;
    }

    .spotlight-panel {
        width: 100%;
        max-width: 500px;
        background: var(--newsprint-white);
        border: 1px solid var(--newsprint-divider);
        border-radius: 12px;
        box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.25);
        animation: spotlightIn 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    }

@keyframes spotlightIn {
        from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .spotlight-search {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--newsprint-divider);
    }

    .spotlight-search i {
        font-size: 20px;
        color: var(--newsprint-neutral-400);
    }

    .spotlight-search input {
        flex: 1;
        border: none;
        outline: none;
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        color: var(--newsprint-ink);
        background: transparent;
    }

    .spotlight-search input::placeholder {
        color: var(--newsprint-neutral-400);
    }

    .spotlight-kbd {
        padding: 4px 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--newsprint-neutral-500);
        border: 1px solid var(--newsprint-divider);
        background: var(--newsprint-surface);
        border-radius: 4px;
    }

    .spotlight-results {
        max-height: 60vh;
        overflow-y: auto;
    }

    .spotlight-results::-webkit-scrollbar {
        width: 6px;
    }

    .spotlight-results::-webkit-scrollbar-track {
        background: transparent;
    }

    .spotlight-results::-webkit-scrollbar-thumb {
        background: var(--newsprint-divider);
        border-radius: 3px;
    }

    .result-section-header {
        padding: 10px 20px;
        background: var(--newsprint-surface);
        border-bottom: 1px solid var(--newsprint-divider);
    }

    .result-section-header span {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--newsprint-neutral-500);
    }

    .result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        text-decoration: none;
        color: inherit;
        transition: background 0.15s ease-out;
    }

    .result-item:hover {
        background: var(--newsprint-surface);
    }

    .result-cover {
        width: 40px;
        height: 56px;
        object-fit: cover;
        border: 1px solid var(--newsprint-divider);
        background: var(--newsprint-bg);
    }

    .item-info {
        flex: 1;
        min-width: 0;
    }

    .item-title {
        font-family: 'Playfair Display', serif;
        font-weight: 700;
        font-size: 14px;
        color: var(--newsprint-ink);
        margin-bottom: 2px;
    }

    .item-author {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 12px;
        color: var(--newsprint-neutral-500);
    }

    .result-arrow {
        color: var(--newsprint-neutral-400);
    }

    .no-results,
    .search-helper {
        padding: 48px 20px;
        text-align: center;
    }

    .no-results .empty-symbol,
    .search-helper i {
        font-size: 48px;
        color: var(--newsprint-neutral-300);
        margin-bottom: 12px;
    }

    .no-results p,
    .search-helper p {
        font-family: 'Playfair Display', serif;
        font-size: 14px;
        color: var(--newsprint-neutral-500);
    }
</style>
