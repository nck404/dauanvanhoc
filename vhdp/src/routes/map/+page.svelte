<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let mapContainer;
    const titleText = "Bản đồ Văn học Đắk Nông Địa lý";
    let map;
    let selectedDistrict = $state(null);
    let books = $state([]);
    let filteredBooks = $state([]);
    let markers = [];

    const districts = [
        {
            id: "gianghia",
            name: "Thành phố Gia Nghĩa",
            lat: 12.0000,
            lng: 107.6833,
            color: "#ef4444",
            desc: "Thành phố trung tâm hành chính, kinh tế, văn hóa của tỉnh Đắk Nông, phố thị hoa vàng trên cao nguyên lộng gió.",
            heritage: "Thơ ca về Gia Nghĩa phố thị hoa vàng"
        },
        {
            id: "cujut",
            name: "Huyện Cư Jút",
            lat: 12.5833,
            lng: 107.8333,
            color: "#3b82f6",
            desc: "Nằm ở phía bắc tỉnh Đắk Nông, nổi tiếng với danh lam thắng cảnh Thác Trinh Nữ và bề dày truyền thống văn hóa của các dân tộc Êđê, M'nông.",
            heritage: "Sử thi Êđê, Truyền thuyết dòng sông Sêrêpốk"
        },
        {
            id: "dakmil",
            name: "Huyện Đắk Mil",
            lat: 12.4500,
            lng: 107.6333,
            color: "#10b981",
            desc: "Huyện biên giới phía tây bắc, trung tâm cà phê lớn của tỉnh, nổi tiếng với Hồ Tây thơ mộng và các di tích lịch sử cách mạng.",
            heritage: "Ký sự lịch sử Hồ Tây Đắk Mil, Văn học dân gia M'nông"
        },
        {
            id: "krongno",
            name: "Huyện Krông Nô",
            lat: 12.4333,
            lng: 107.9667,
            color: "#f59e0b",
            desc: "Vùng đất huyền thoại với Hệ thống hang động núi lửa Krông Nô (Công viên địa chất toàn cầu) và các sử thi truyền miệng đặc sắc.",
            heritage: "Truyền thuyết Hang động núi lửa Chư Bluk, Dân ca M'nông"
        },
        {
            id: "daksong",
            name: "Huyện Đắk Song",
            lat: 12.2667,
            lng: 107.6000,
            color: "#8b5cf6",
            desc: "Nằm ở trung tâm tỉnh Đắk Nông trên cao nguyên M'nông, khí hậu mát mẻ quanh năm và nổi tiếng với những đồi thông thơ mộng.",
            heritage: "Hồn thơ đại ngàn Đắk Song"
        },
        {
            id: "tuyduc",
            name: "Huyện Tuy Đức",
            lat: 12.0833,
            lng: 107.3500,
            color: "#ec4899",
            desc: "Huyện biên giới phía tây, giàu tiềm năng phát triển nông nghiệp công nghệ cao và bảo tồn văn hóa cồng chiêng độc đáo.",
            heritage: "Tiếng hát cồng chiêng Tuy Đức"
        },
        {
            id: "dakrlap",
            name: "Huyện Đắk R'lấp",
            lat: 11.9167,
            lng: 107.4167,
            color: "#06b6d4",
            desc: "Cửa ngõ phía nam của tỉnh kết nối với vùng Đông Nam Bộ, nơi hội tụ nền ẩm thực đặc sản và truyền thống sử thi phong phú.",
            heritage: "Truyện cổ các dân tộc Đắk R'lấp"
        },
        {
            id: "dakglong",
            name: "Huyện Đắk Glong",
            lat: 11.9667,
            lng: 108.0000,
            color: "#14b8a6",
            desc: "Huyện có diện tích lớn nhất tỉnh Đắk Nông, nơi có hồ Tà Đùng - được mệnh danh là 'Vịnh Hạ Long của Tây Nguyên'.",
            heritage: "Sử thi Tà Đùng huyền thoại, Nhạc cụ đàn đá Đắk Glong"
        }
    ];

    async function loadWorks() {
        try {
            const res = await apiFetch("/api/books?limit=100");
            if (res.ok) {
                const data = await res.json();
                books = data.books || [];
            }
        } catch (e) {
            console.error(e);
        }
    }

    function selectDistrict(dist) {
        selectedDistrict = dist;
        if (!dist) {
            filteredBooks = [];
            return;
        }
        filteredBooks = books.filter(b => {
            const content = `${b.title} ${b.description} ${b.category} ${b.author}`.toLowerCase();
            const keyword = dist.name.toLowerCase().replace("huyện ", "").replace("thành phố ", "");
            return content.includes(keyword) || content.includes(dist.id);
        });

        if (map) {
            map.flyTo([dist.lat, dist.lng], 11, {
                animate: true,
                duration: 1.5
            });
        }
    }

    function getDistrictWorksCount(dist) {
        return books.filter(b => {
            const content = `${b.title} ${b.description} ${b.category} ${b.author}`.toLowerCase();
            const keyword = dist.name.toLowerCase().replace("huyện ", "").replace("thành phố ", "");
            return content.includes(keyword) || content.includes(dist.id);
        }).length;
    }

    onMount(async () => {
        await loadWorks();

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });

        const L = window.L;

        map = L.map(mapContainer, {
            center: [12.25, 107.68],
            zoom: 10,
            zoomControl: false
        });

        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        districts.forEach(dist => {
            const count = getDistrictWorksCount(dist);
            
            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `
                    <div class="marker-pulse" style="background-color: ${dist.color}; box-shadow: 0 0 0 4px ${dist.color}44;">
                        ${count > 0 ? `<span class="marker-count">${count}</span>` : ''}
                    </div>
                    <div class="marker-label">${dist.name}</div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([dist.lat, dist.lng], { icon: customIcon })
                .addTo(map)
                .on('click', () => {
                    selectDistrict(dist);
                });
            
            markers.push(marker);
        });

        if (districts.length > 0) {
            selectDistrict(districts[0]);
        }

        return () => {
            if (map) {
                map.remove();
            }
        };
    });
</script>

<div class="map-page-container">
    <div class="map-header">
        <h1 class="fancy-title">
            {#each titleText.split("") as char, i}
                <span style="animation-delay: {i * 0.04}s">{char === " " ? "\u00A0" : char}</span>
            {/each}
        </h1>
        <p>Bản đồ thực tế tích hợp dữ liệu địa lý. Chọn các địa điểm của Đắk Nông để xem di sản và tác phẩm văn học liên quan.</p>
    </div>

    <div class="map-content">
        <div class="map-visual-pane" bind:this={mapContainer}></div>

        <div class="info-sidebar">
            <div class="quick-nav-districts">
                <h3>Chọn nhanh khu vực</h3>
                <div class="district-chips">
                    {#each districts as dist}
                        <button
                            type="button"
                            class="district-chip"
                            class:active={selectedDistrict?.id === dist.id}
                            style="--chip-color: ${dist.color}"
                            onclick={() => selectDistrict(dist)}
                        >
                            {dist.name.replace("Thành phố ", "").replace("Huyện ", "")}
                        </button>
                    {/each}
                </div>
            </div>

            {#if selectedDistrict}
                <div class="district-detail-card">
                    <div class="district-title-row" style="--accent: {selectedDistrict.color}">
                        <span class="color-dot"></span>
                        <h2>{selectedDistrict.name}</h2>
                    </div>

                    <p class="description">{selectedDistrict.desc}</p>

                    <div class="heritage-section">
                        <h3>Di sản văn hóa địa phương</h3>
                        <p>{selectedDistrict.heritage}</p>
                    </div>

                    <div class="works-section">
                        <h3>Các tác phẩm liên quan ({filteredBooks.length})</h3>
                        {#if filteredBooks.length > 0}
                            <div class="works-list">
                                {#each filteredBooks as book}
                                    <a href={`/read/${book.id}`} class="work-item-link">
                                        <img
                                            src={book.cover_url || "/placeholder-book.jpg"}
                                            alt={book.title}
                                            class="work-cover"
                                        />
                                        <div class="work-info">
                                            <h4>{book.title}</h4>
                                            <span class="work-author">{book.author}</span>
                                            <span class="work-category">{book.category || "Văn học"}</span>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {:else}
                            <div class="empty-works">
                                <i class="bx bx-folder-open"></i>
                                <p>Chưa có tác phẩm chính thức cho vùng này. Hệ thống hiển thị các di sản truyền khẩu dân gian.</p>
                            </div>
                        {/if}
                    </div>
                </div>
            {:else}
                <div class="no-selection">
                    <i class="bx bx-map-alt"></i>
                    <p>Vui lòng chọn một khu vực trên bản đồ Đắk Nông để xem chi tiết.</p>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .map-page-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 80px);
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
        box-sizing: border-box;
        gap: 20px;
    }

    .fancy-title {
        display: inline-flex;
        flex-wrap: wrap;
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 6px 0;
        letter-spacing: 0.5px;
    }

    .fancy-title span {
        display: inline-block;
        opacity: 0;
        transform: translateY(20px) scale(0.6);
        filter: blur(4px);
        color: var(--text-main);
        animation: letterFlyIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards, letterFloat 3s ease-in-out infinite alternate;
    }

    @keyframes letterFlyIn {
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
        }
    }

    @keyframes letterFloat {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-4px);
        }
    }

    .map-header p {
        margin: 0;
        font-size: 14px;
        color: #64748b;
    }

    .map-content {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 24px;
        flex: 1;
        min-height: 0;
    }

    .map-visual-pane {
        background: #f8fafc;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        min-height: 400px;
        z-index: 5;
    }

    .info-sidebar {
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        overflow-y: auto;
        padding: 24px;
        box-sizing: border-box;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .quick-nav-districts h3 {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #94a3b8;
        margin: 0 0 12px 0;
        font-weight: 700;
    }

    .district-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .district-chip {
        border: 1px solid #e2e8f0;
        background: #ffffff;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .district-chip:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
    }

    .district-chip.active {
        background: var(--chip-color, #3b82f6);
        color: #ffffff;
        border-color: var(--chip-color, #3b82f6);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .district-detail-card {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .district-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: var(--accent, #3b82f6);
        box-shadow: 0 0 10px var(--accent);
    }

    .district-title-row h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
    }

    .description {
        font-size: 14px;
        line-height: 1.6;
        color: #475569;
        margin: 0;
    }

    .heritage-section h3, .works-section h3 {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #94a3b8;
        margin: 0 0 10px 0;
        font-weight: 700;
    }

    .heritage-section p {
        margin: 0;
        font-size: 14px;
        color: #334155;
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #64748b;
    }

    .works-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .work-item-link {
        display: flex;
        gap: 12px;
        text-decoration: none;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .work-item-link:hover {
        transform: translateY(-2px);
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .work-cover {
        width: 45px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .work-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .work-info h4 {
        margin: 0 0 2px 0;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
    }

    .work-author {
        font-size: 12px;
        color: #64748b;
    }

    .work-category {
        font-size: 10px;
        background: #e2e8f0;
        color: #475569;
        padding: 2px 6px;
        border-radius: 4px;
        align-self: flex-start;
        margin-top: 4px;
        font-weight: 600;
    }

    .empty-works {
        text-align: center;
        padding: 24px;
        color: #94a3b8;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px dashed #e2e8f0;
    }

    .empty-works i {
        font-size: 28px;
        margin-bottom: 6px;
    }

    .empty-works p {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
    }

    .no-selection {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        text-align: center;
    }

    .no-selection i {
        font-size: 48px;
        margin-bottom: 12px;
    }

    .no-selection p {
        margin: 0;
        font-size: 14px;
    }

    :global(.custom-map-marker) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    :global(.marker-pulse) {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        position: relative;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    :global(.custom-map-marker:hover .marker-pulse) {
        transform: scale(1.3);
    }

    :global(.marker-count) {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        font-size: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid white;
    }

    :global(.marker-label) {
        margin-top: 4px;
        font-size: 10px;
        font-weight: 700;
        color: #0f172a;
        text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
        white-space: nowrap;
        pointer-events: none;
    }

    @media (max-width: 900px) {
        .map-content {
            grid-template-columns: 1fr;
            grid-template-rows: 450px 1fr;
        }

        .map-page-container {
            height: auto;
        }
    }
</style>
