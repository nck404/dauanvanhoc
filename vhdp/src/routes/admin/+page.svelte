<script>
    import { onMount } from "svelte";
    import { userStore } from "$lib/api.js";
    
    let user = $state(null);
    userStore.subscribe(val => {
        user = val;
    });

    onMount(() => {
        document.body.classList.add("paper-theme");
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });
</script>

<svelte:head>
    <title>Tòa Soạn - Bảng Điều Khiển Admin</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Dấu Ấn Văn Học — Tòa Soạn</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Hệ Thống Quản Trị Nội Dung</div>
</div>

<div class="page-container">
    <header class="page-header">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Không Gian Quản Trị</span>
        </div>
        
        <h1 class="page-title">
            Bảng điều khiển <em class="page-accent">Tòa soạn</em><span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Chào mừng {user?.username || 'Tổng Biên Tập'}, quản lý kho tàng ấn phẩm văn học của bạn tại đây.
        </p>
    </header>

    <div class="admin-grid">
        <a href="/admin/add-book" class="admin-card newsprint-card hard-shadow-hover">
            <div class="card-icon"><i class="bx bx-book-add"></i></div>
            <div class="card-info">
                <h3 class="font-serif">Phát hành Ấn phẩm</h3>
                <p class="font-mono">Truyện chữ, Manga, Visual Novel</p>
            </div>
            <div class="card-arrow"><i class="bx bx-right-arrow-alt"></i></div>
        </a>

        <a href="/admin/add-audio" class="admin-card newsprint-card hard-shadow-hover">
            <div class="card-icon"><i class="bx bx-podcast"></i></div>
            <div class="card-info">
                <h3 class="font-serif">Phát thanh Podcast</h3>
                <p class="font-mono">Truyện đọc MP3, Bản ghi âm</p>
            </div>
            <div class="card-arrow"><i class="bx bx-right-arrow-alt"></i></div>
        </a>

        <a href="/admin/add-video" class="admin-card newsprint-card hard-shadow-hover">
            <div class="card-icon"><i class="bx bx-video-plus"></i></div>
            <div class="card-info">
                <h3 class="font-serif">Trình chiếu Video</h3>
                <p class="font-mono">Phim chuyển thể, Sự kiện</p>
            </div>
            <div class="card-arrow"><i class="bx bx-right-arrow-alt"></i></div>
        </a>

        <a href="/admin/manage-books" class="admin-card newsprint-card hard-shadow-hover">
            <div class="card-icon"><i class="bx bx-list-ul"></i></div>
            <div class="card-info">
                <h3 class="font-serif">Quản lý Kho Lưu trữ</h3>
                <p class="font-mono">Chỉnh sửa, Thu hồi tài nguyên</p>
            </div>
            <div class="card-arrow"><i class="bx bx-right-arrow-alt"></i></div>
        </a>

        <a href="/admin/manage-users" class="admin-card newsprint-card hard-shadow-hover">
            <div class="card-icon"><i class="bx bx-group"></i></div>
            <div class="card-info">
                <h3 class="font-serif">Quản lý Độc giả</h3>
                <p class="font-mono">Xem danh sách, Phân quyền</p>
            </div>
            <div class="card-arrow"><i class="bx bx-right-arrow-alt"></i></div>
        </a>

        <a href="/admin/stats" class="admin-card newsprint-card hard-shadow-hover">
            <div class="card-icon"><i class="bx bx-bar-chart-alt-2"></i></div>
            <div class="card-info">
                <h3 class="font-serif">Báo cáo Thống kê</h3>
                <p class="font-mono">Lượt đọc, Bookmark, Tương tác</p>
            </div>
            <div class="card-arrow"><i class="bx bx-right-arrow-alt"></i></div>
        </a>
    </div>
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
    }

    .admin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 32px;
    }

    .admin-card {
        display: flex;
        align-items: center;
        padding: 32px 24px;
        text-decoration: none;
        color: var(--newsprint-ink);
        gap: 24px;
        transition: all 0.2s ease;
        position: relative;
    }

    .card-icon {
        font-size: 40px;
        color: var(--newsprint-red);
        width: 64px;
        height: 64px;
        border: 2px solid var(--newsprint-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: var(--newsprint-white);
        box-shadow: 2px 2px 0 var(--newsprint-ink);
    }

    .card-info {
        flex: 1;
    }

    .card-info h3 {
        font-size: 22px;
        font-weight: 800;
        margin-bottom: 6px;
        color: var(--newsprint-ink);
    }

    .card-info p {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--newsprint-neutral-600);
        margin: 0;
    }

    .card-arrow {
        font-size: 28px;
        color: var(--newsprint-neutral-400);
        transition: transform 0.2s, color 0.2s;
    }

    .admin-card:hover .card-arrow {
        transform: translateX(6px);
        color: var(--newsprint-red);
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
    .side-rail.right { right: 20px; }
    
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
        .side-rail { display: none; }
        .page-container { padding: 80px 24px 100px; }
        .admin-grid { grid-template-columns: 1fr; gap: 24px; }
        .page-title { font-size: 32px; }
    }
</style>

