<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import 'leaflet/dist/leaflet.css';

    let books = $state([]);
    let loading = $state(true);
    let mapElement = $state(null);

    const regions = [
        { id: 'lamdong', name: 'Dân tộc Mạ', province: 'Lâm Đồng', lat: 11.75, lng: 108.2, desc: 'Vùng đất của những bản trường ca, truyền thuyết độc đáo của người Mạ ở Lâm Đồng' },
        { id: 'daknong', name: 'Dân tộc M\'nông', province: 'Đắk Nông', lat: 12.0, lng: 107.7, desc: 'Nơi lưu giữ những áng sử thi Ot Ndrong cổ xưa của người M\'nông ở Đắk Nông' },
        { id: 'binhthuan', name: 'Dân tộc Chăm', province: 'Bình Thuận', lat: 11.1, lng: 108.1, desc: 'Cội nguồn văn hóa nghệ thuật và các truyền thuyết lễ hội truyền thống của người Chăm ở Bình Thuận' }
    ];

    let activeRegion = $state(regions[0]);

    const regionWorksNormalized = {
        lamdong: [
            "dedatdenguoi",
            "taoramuonvat",
            "kechuyenkbung",
            "kechuyenkmung",
            "luabapcaot",
            "nguoihoavoi",
            "concoctroi",
            "changkhi",
            "soden",
            "mocoivaluonthan"
        ],
        binhthuan: [
            "huyentichvelerijaprong",
            "chuyentichvelerijaprong",
            "tamuavatarai",
            "sutichthanluaraypokeydai",
            "truyenthuyetvelehoatang",
            "haianhemngheo",
            "binukriyahaydapnuoctuytinh",
            "visaonguoihoigiaokienganthitheovagiong",
            "bimbipsoroicay",
            "motansat",
            "daphamia"
        ],
        daknong: [
            "changkmbong",
            "changpienggietconrong",
            "sutichcayneuthan",
            "caubebungcholan",
            "chuyenthanlua",
            "convuonvathanlua",
            "sutichvenguongoccuanguoimnong",
            "truyenthuyetvenguongoccuanguoimnong",
            "sutichquabau",
            "bameke",
            "chuyenktarlutndur",
            "quabaume"
        ]
    };

    const normalize = (s) => {
        if (!s) return "";
        return s.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9]/g, "");
    };

    let relatedWorks = $derived.by(() => {
        if (!activeRegion) return [];
        const targetList = regionWorksNormalized[activeRegion.id] || [];
        const seen = new Set();
        return books.filter(book => {
            const norm = normalize(book.title);
            if (targetList.includes(norm)) {
                const key = `${norm}-${book.type}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    return true;
                }
            }
            return false;
        });
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
            
            if (!mapElement) return;
            
            const map = L.map(mapElement, {
                zoomControl: false
            }).setView([11.6, 108.0], 8);

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
                    map.flyTo([region.lat, region.lng], 9, { duration: 0.8 });
                    
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
                <div class="region-province" style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: bold; color: var(--newsprint-neutral-500); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">Địa bàn: {activeRegion.province}</div>
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
                                        <img src={work.cover_url} alt={work.title} loading="lazy" decoding="async" />
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
            gap: 16px;
        }
        .map-view {
            height: 420px;
        }
        .region-panel {
            height: auto;
            max-height: 450px;
        }
    }

    @media (max-width: 480px) {
        .map-view {
            height: 300px;
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
        filter: grayscale(0%);
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
