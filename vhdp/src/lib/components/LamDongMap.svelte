<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import 'leaflet/dist/leaflet.css';

    let books = $state([]);
    let loading = $state(true);
    let mapElement = $state(null);

    const regions = [
        { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lng: 108.4583, desc: 'Trung tâm văn hóa, lưu giữ nhiều tư liệu quý' },
        { id: 'lacduong', name: 'Lạc Dương', lat: 12.1158, lng: 108.4316, desc: 'Vùng đất của những bản trường ca K\'Ho' },
        { id: 'donduong', name: 'Đơn Dương', lat: 11.8020, lng: 108.5721, desc: 'Nơi giao thoa văn hóa các dân tộc bản địa' },
        { id: 'ductrong', name: 'Đức Trọng', lat: 11.7247, lng: 108.3664, desc: 'Kho tàng sử thi và truyền thuyết' },
        { id: 'lamha', name: 'Lâm Hà', lat: 11.8318, lng: 108.1965, desc: 'Những câu chuyện kể dân gian đặc sắc' },
        { id: 'damrong', name: 'Đam Rông', lat: 12.0163, lng: 108.1408, desc: 'Vùng đất của những huyền thoại núi rừng' },
        { id: 'dilinh', name: 'Di Linh', lat: 11.5833, lng: 108.0667, desc: 'Cội nguồn văn hóa K\'Ho, Mạ' },
        { id: 'baolam', name: 'Bảo Lâm', lat: 11.6601, lng: 107.7289, desc: 'Nghệ thuật diễn xướng dân gian' },
        { id: 'baoloc', name: 'Bảo Lộc', lat: 11.5471, lng: 107.8066, desc: 'Văn học dân gian' },
        { id: 'dahuoai', name: 'Đạ Huoai', lat: 11.4162, lng: 107.5670, desc: 'Truyền thuyết về cội nguồn' },
        { id: 'dateh', name: 'Đạ Tẻh', lat: 11.5583, lng: 107.5312, desc: 'Những câu hát giao duyên' },
        { id: 'cattien', name: 'Cát Tiên', lat: 11.5658, lng: 107.3888, desc: 'Di sản văn hóa Óc Eo và truyền thuyết Mạ' }
    ];

    let activeRegion = $state(regions[0]);

    let relatedWorks = $derived.by(() => {
        if (!activeRegion) return [];
        const seed = activeRegion.name.length;
        return books.filter((_, i) => i % 5 === seed % 5).slice(0, 4);
    });

    onMount(async () => {
        try {
            const res = await apiFetch("/api/books?limit=999");
            if (res.ok) {
                const data = await res.json();
                books = data.books || [];
            }
        } catch (e) {
            console.error(e);
        }
        loading = false;

        if (typeof window !== 'undefined') {
            const L = (await import('leaflet')).default;
            
            const map = L.map(mapElement, {
                zoomControl: false
            }).setView([11.75, 108.0], 9);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);
            
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="marker-dot"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const activeIcon = L.divIcon({
                className: 'custom-map-marker active',
                html: `<div class="marker-dot"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const markers = {};

            regions.forEach(region => {
                const marker = L.marker([region.lat, region.lng], { 
                    icon: region.id === activeRegion.id ? activeIcon : customIcon 
                }).addTo(map);
                
                marker.bindTooltip(region.name, {
                    permanent: false,
                    direction: 'top',
                    className: 'newsprint-tooltip',
                    offset: [0, -10]
                });

                marker.on('click', () => {
                    activeRegion = region;
                    map.flyTo([region.lat, region.lng], 10, { duration: 0.8 });
                    
                    Object.values(markers).forEach(m => m.setIcon(customIcon));
                    marker.setIcon(activeIcon);
                });
                
                markers[region.id] = marker;
            });
        }
    });
</script>

<div class="map-layout reveal">
    <div class="map-view newsprint-card">
        <div bind:this={mapElement} class="map-canvas"></div>
    </div>

    <div class="region-panel">
        {#if activeRegion}
            <div class="region-header">
                <h2 class="region-name">{activeRegion.name}</h2>
                <p class="region-desc">{activeRegion.desc}</p>
            </div>

            <div class="region-content">
                <div class="content-label">Tác phẩm tiêu biểu</div>
                {#if loading}
                    <div class="loading-state">Đang tải dữ liệu...</div>
                {:else if relatedWorks.length === 0}
                    <div class="empty-state">Chưa có tác phẩm nào được cập nhật cho khu vực này.</div>
                {:else}
                    <div class="works-list">
                        {#each relatedWorks as work}
                            <a href={(work.type === 'truyện tranh' || work.type === 'comic' || work.type === 'manga') ? `/read-comic/${work.id}` : `/read/${work.id}`} class="work-item">
                                <div class="work-cover">
                                    {#if work.cover_url}
                                        <img src={work.cover_url} alt={work.title} />
                                    {:else}
                                        <div class="work-placeholder">
                                            <i class="bx bx-book"></i>
                                        </div>
                                    {/if}
                                </div>
                                <div class="work-meta">
                                    <div class="work-type">{work.type || 'Văn học'}</div>
                                    <h3 class="work-title">{work.title}</h3>
                                    <div class="work-author">{work.author}</div>
                                </div>
                                <i class="bx bx-right-arrow-alt work-arrow"></i>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .map-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        margin-top: 24px;
        margin-bottom: 24px;
    }

    @media (max-width: 900px) {
        .map-layout {
            grid-template-columns: 1fr;
        }
    }

    .map-view {
        position: relative;
        background: var(--newsprint-surface);
        border: 2px solid var(--newsprint-ink);
        padding: 0;
        height: 600px;
        overflow: hidden;
        z-index: 1;
    }

    .map-canvas {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    /* Global Leaflet Customizations for Newsprint Theme */
    :global(.custom-map-marker) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :global(.marker-dot) {
        width: 12px;
        height: 12px;
        background: var(--newsprint-ink);
        border-radius: 50%;
        border: 2px solid var(--newsprint-white);
        box-shadow: 0 0 0 1px var(--newsprint-ink);
        transition: all 0.2s;
    }

    :global(.custom-map-marker:hover .marker-dot) {
        background: var(--newsprint-red);
        transform: scale(1.5);
        cursor: pointer;
    }

    :global(.custom-map-marker.active .marker-dot) {
        background: var(--newsprint-red);
        box-shadow: 0 0 0 4px rgba(204, 0, 0, 0.2), 0 0 0 1px var(--newsprint-red);
        transform: scale(1.5);
    }

    :global(.newsprint-tooltip) {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: var(--newsprint-ink);
        background: var(--newsprint-white);
        padding: 4px 8px;
        border: 1px solid var(--newsprint-ink);
        border-radius: 0;
        box-shadow: 2px 2px 0 var(--newsprint-ink);
        white-space: nowrap;
    }
    
    :global(.newsprint-tooltip::before) {
        display: none;
    }

    .region-panel {
        display: flex;
        flex-direction: column;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        height: 600px;
    }

    .region-header {
        padding: 32px 24px;
        border-bottom: 4px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
    }

    .region-name {
        font-family: 'PexelGrotesk', sans-serif;
        font-size: 36px;
        color: var(--newsprint-red);
        margin-bottom: 12px;
        line-height: 1.1;
        text-transform: uppercase;
    }

    .region-desc {
        font-family: 'Lora', serif;
        font-size: 15px;
        color: var(--newsprint-neutral-600);
        line-height: 1.5;
        font-style: italic;
    }

    .region-content {
        padding: 24px;
        flex: 1;
        overflow-y: auto;
    }

    .content-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: var(--newsprint-ink);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .content-label::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--newsprint-divider);
    }

    .works-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .work-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        text-decoration: none;
        border: 1px solid var(--newsprint-divider);
        background: var(--newsprint-white);
        transition: all 0.2s;
    }

    .work-item:hover {
        background: var(--newsprint-surface);
        border-color: var(--newsprint-ink);
        transform: translateX(4px);
        box-shadow: 2px 2px 0 var(--newsprint-ink);
    }

    .work-cover {
        width: 48px;
        height: 64px;
        flex-shrink: 0;
        border: 1px solid var(--newsprint-ink);
    }

    .work-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(100%);
    }

    .work-item:hover .work-cover img {
        filter: grayscale(100%) sepia(30%);
    }

    .work-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--newsprint-muted-bg);
        color: var(--newsprint-neutral-500);
    }

    .work-meta {
        flex: 1;
        min-width: 0;
    }

    .work-type {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        text-transform: uppercase;
        color: var(--newsprint-red);
        margin-bottom: 4px;
    }

    .work-title {
        font-family: 'Playfair Display', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--newsprint-ink);
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .work-author {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: var(--newsprint-neutral-500);
    }

    .work-arrow {
        font-size: 20px;
        color: var(--newsprint-neutral-400);
        transition: color 0.2s;
    }

    .work-item:hover .work-arrow {
        color: var(--newsprint-red);
    }

    .loading-state, .empty-state {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--newsprint-neutral-500);
        padding: 32px 0;
        text-align: center;
        border: 1px dashed var(--newsprint-divider);
    }
</style>
