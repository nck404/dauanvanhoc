<script>
    import { onMount, onDestroy } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let truyenChu = $state([]);
    let truyenTranh = $state([]);
    let audios = $state([]);
    let videos = $state([]);
    let searchQuery = $state("");
    let searchInput = $state(null);
    let isOpen = $state(false);
    let activeFilter = $state("all");

    export function openSearchModal() {
        isOpen = true;
        requestAnimationFrame(() => {
            searchInput?.focus();
            searchInput?.select?.();
        });
        document.body.classList.add("search-open");
    }

    export function closeSearchModal() {
        isOpen = false;
        searchQuery = "";
        document.body.classList.remove("search-open");
    }

    onMount(async () => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeSearchModal();
            }
        };

        const handleOpenSearch = () => {
            if (!isOpen) {
                openSearchModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-search', handleOpenSearch);

        try {
            const [booksRes, audiosRes, videosRes] = await Promise.all([
                apiFetch("/api/books?limit=999"),
                apiFetch("/api/audios"),
                apiFetch("/api/videos")
            ]);
            
            if (booksRes.ok) {
                const data = await booksRes.json();
                const allBooks = data.books || [];
                truyenChu = allBooks.filter(b => b.type === 'truyện chữ' || b.type === 'text' || !b.type);
                truyenTranh = allBooks.filter(b => b.type === 'truyện tranh' || b.type === 'comic' || b.type === 'manga');
            }
            if (audiosRes.ok) {
                const data = await audiosRes.json();
                audios = data.audios || [];
            }
            if (videosRes.ok) {
                const data = await videosRes.json();
                videos = data.videos || [];
            }
        } catch (e) {
            console.error(e);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-search', handleOpenSearch);
            document.body.classList.remove("search-open");
        };
    });
</script>

{#if isOpen}
    <div class="search-open-global-blur" aria-hidden="true"></div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="spotlight-overlay" onclick={closeSearchModal}>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
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
            
            <div class="search-filters">
                <button class="search-filter" class:active={activeFilter === 'all'} onclick={() => activeFilter = 'all'}>Tất cả</button>
                <button class="search-filter" class:active={activeFilter === 'truyen-chu'} onclick={() => activeFilter = 'truyen-chu'}>Truyện chữ</button>
                <button class="search-filter" class:active={activeFilter === 'truyen-tranh'} onclick={() => activeFilter = 'truyen-tranh'}>Truyện tranh</button>
                <button class="search-filter" class:active={activeFilter === 'audio'} onclick={() => activeFilter = 'audio'}>Audio</button>
                <button class="search-filter" class:active={activeFilter === 'video'} onclick={() => activeFilter = 'video'}>Video</button>
            </div>
            
            <div class="spotlight-results">
                {#if searchQuery.trim() !== ""}
                    {@const showChu = activeFilter === 'all' || activeFilter === 'truyen-chu'}
                    {@const showTranh = activeFilter === 'all' || activeFilter === 'truyen-tranh'}
                    {@const showAudio = activeFilter === 'all' || activeFilter === 'audio'}
                    {@const showVideo = activeFilter === 'all' || activeFilter === 'video'}
                    
                    {@const filteredTruyenChu = truyenChu.filter(b => 
                        (b.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (b.author || "").toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    {@const filteredTruyenTranh = truyenTranh.filter(b => 
                        (b.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (b.author || "").toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    {@const filteredAudios = audios.filter(a => 
                        (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (a.author || "").toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    {@const filteredVideos = videos.filter(v => 
                        (v.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (v.author || "").toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    
                    {@const noResults = (!showChu || filteredTruyenChu.length === 0) && (!showTranh || filteredTruyenTranh.length === 0) && (!showAudio || filteredAudios.length === 0) && (!showVideo || filteredVideos.length === 0)}
                    
                    {#if noResults}
                        <div class="no-results">
                            <div class="empty-symbol">§</div>
                            <p>Không tìm thấy kết quả phù hợp</p>
                        </div>
                    {:else}
                        {#if showChu && filteredTruyenChu.length > 0}
                            <div class="result-section">
                                <div class="result-section-header">
                                    <span>Truyện chữ</span>
                                </div>
                                <div class="result-items">
                                    {#each filteredTruyenChu as book}
                                        <a href={(book.type === 'truyện tranh' || book.type === 'comic' || book.type === 'manga') ? `/read-comic/${book.id}` : `/read/${book.id}`} class="result-item" onclick={closeSearchModal}>
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
                        {#if showTranh && filteredTruyenTranh.length > 0}
                            <div class="result-section">
                                <div class="result-section-header">
                                    <span>Truyện tranh</span>
                                </div>
                                <div class="result-items">
                                    {#each filteredTruyenTranh as book}
                                        <a href={(book.type === 'truyện tranh' || book.type === 'comic' || book.type === 'manga') ? `/read-comic/${book.id}` : `/read/${book.id}`} class="result-item" onclick={closeSearchModal}>
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
                        {#if showAudio && filteredAudios.length > 0}
                            <div class="result-section">
                                <div class="result-section-header">
                                    <span>Audio</span>
                                </div>
                                <div class="result-items">
                                    {#each filteredAudios as audio}
                                        <a href={`/audio/${audio.id}`} class="result-item" onclick={closeSearchModal}>
                                            {#if audio.cover_url}
                                                <img src={audio.cover_url} alt={audio.title} class="result-cover" />
                                            {:else}
                                                <div class="result-cover media-placeholder">
                                                    <i class="bx bx-headphone"></i>
                                                </div>
                                            {/if}
                                            <div class="item-info">
                                                <span class="item-title">{audio.title}</span>
                                                <span class="item-author">{audio.author}</span>
                                            </div>
                                            <span class="result-arrow">→</span>
                                        </a>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        {#if showVideo && filteredVideos.length > 0}
                            <div class="result-section">
                                <div class="result-section-header">
                                    <span>Video</span>
                                </div>
                                <div class="result-items">
                                    {#each filteredVideos as video}
                                        <a href={`/video/${video.id}`} class="result-item" onclick={closeSearchModal}>
                                            {#if video.cover_url}
                                                <img src={video.cover_url} alt={video.title} class="result-cover" />
                                            {:else}
                                                <div class="result-cover media-placeholder">
                                                    <i class="bx bx-video"></i>
                                                </div>
                                            {/if}
                                            <div class="item-info">
                                                <span class="item-title">{video.title}</span>
                                                <span class="item-author">{video.author}</span>
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
    /* Global search overlay styles moved to layout.css or handled globally */
    .spotlight-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 14, 12, 0.4);
        backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 15vh;
    }

    .spotlight-panel {
        background: var(--newsprint-bg);
        width: 100%;
        max-width: 640px;
        border-radius: 12px;
        border: 2px solid var(--newsprint-ink);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15),
                    0 0 0 8px rgba(255, 255, 255, 0.5);
        overflow: hidden;
        animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .spotlight-search {
        display: flex;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 2px solid var(--newsprint-ink);
        background: #fff;
    }

    .spotlight-search i {
        font-size: 24px;
        color: var(--newsprint-ink);
    }

    .spotlight-search input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0 16px;
        font-family: 'Playfair Display', serif;
        font-size: 20px;
        font-weight: 600;
        color: var(--newsprint-ink);
        outline: none;
    }

    .spotlight-search input::placeholder {
        color: var(--newsprint-neutral-400);
        font-weight: 400;
    }

    .spotlight-kbd {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        color: var(--newsprint-neutral-500);
        background: var(--newsprint-neutral-200);
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid var(--newsprint-neutral-300);
    }

    .search-filters {
        display: flex;
        gap: 8px;
        padding: 12px 24px;
        border-bottom: 2px solid var(--newsprint-neutral-200);
        overflow-x: auto;
        scrollbar-width: none; /* Firefox */
    }
    .search-filters::-webkit-scrollbar {
        display: none; /* Chrome/Safari */
    }

    .search-filter {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 6px 12px;
        border: 1px solid var(--newsprint-neutral-300);
        background: transparent;
        color: var(--newsprint-ink);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }

    .search-filter:hover {
        background: var(--newsprint-neutral-200);
    }

    .search-filter.active {
        background: var(--newsprint-red);
        color: white;
        border-color: var(--newsprint-red);
        box-shadow: 2px 2px 0 rgba(0,0,0,1);
        transform: translate(-1px, -1px);
    }

    .spotlight-results {
        max-height: 60vh;
        overflow-y: auto;
        padding: 12px 0;
    }

    .search-helper, .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: var(--newsprint-neutral-500);
    }

    .search-helper i {
        font-size: 40px;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .search-helper p, .no-results p {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        margin: 0;
    }

    .empty-symbol {
        font-size: 32px;
        color: var(--newsprint-red);
        margin-bottom: 16px;
    }

    .result-section {
        margin-bottom: 16px;
    }

    .result-section-header {
        padding: 8px 24px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--newsprint-red);
    }

    .result-item {
        display: flex;
        align-items: center;
        padding: 12px 24px;
        gap: 16px;
        text-decoration: none;
        transition: background 0.2s;
    }

    .result-item:hover {
        background: rgba(0, 0, 0, 0.03);
    }

    .result-item:hover .result-arrow {
        transform: translateX(4px);
        color: var(--newsprint-red);
    }

    .result-cover {
        width: 40px;
        height: 56px;
        object-fit: cover;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-neutral-200);
    }

    .media-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: var(--newsprint-neutral-500);
        background: var(--newsprint-neutral-200);
    }

    .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .item-title {
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--newsprint-ink);
        line-height: 1.2;
    }

    .item-author {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--newsprint-neutral-500);
    }

    .result-arrow {
        font-size: 18px;
        color: var(--newsprint-neutral-400);
        transition: all 0.2s;
    }
</style>
