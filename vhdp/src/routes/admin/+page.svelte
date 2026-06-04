<script>
    import { userStore } from "$lib/api.js";
    let user = $state(null);
    userStore.subscribe(val => {
        user = val;
    });
</script>

<div class="admin-dashboard">
    <header class="admin-header">
        <h1>Bảng điều khiển Admin</h1>
        <p>
            Chào mừng {user?.username || ''}, quản lý kho tàng văn học của bạn tại đây.
        </p>
    </header>

    <div class="admin-grid">
        <a href="/admin/add-book" class="admin-card comic-card">
            <i class="bx bx-book-add"></i>
            <h3>Đăng sách / truyện mới</h3>
            <p>Truyện tranh, Truyện chữ, Visual Novel</p>
        </a>
        <a href="/admin/add-audio" class="admin-card comic-card">
            <i class="bx bx-podcast"></i>
            <h3>Đăng Audio / Podcast</h3>
            <p>Truyện đọc MP3, âm thanh nền</p>
        </a>
        <a href="/admin/add-video" class="admin-card comic-card">
            <i class="bx bx-video-plus"></i>
            <h3>Đăng Video / Phim</h3>
            <p>Video sự kiện, phim chuyển thể</p>
        </a>
        <a href="/admin/manage-books" class="admin-card comic-card">
            <i class="bx bx-list-ul"></i>
            <h3>Quản lý kho nội dung</h3>
            <p>Chỉnh sửa, xóa tài nguyên</p>
        </a>
        <a href="/admin/manage-users" class="admin-card comic-card">
            <i class="bx bx-group"></i>
            <h3>Quản lý người dùng</h3>
            <p>Xem danh sách và phân quyền</p>
        </a>
        <a href="/admin/stats" class="admin-card comic-card">
            <i class="bx bx-bar-chart-alt-2"></i>
            <h3>Thống kê</h3>
            <p>Lượt đọc, đánh giá, bookmark</p>
        </a>
    </div>
</div>

<style>
    .admin-dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    .admin-header {
        margin-bottom: 48px;
    }

    .admin-header h1 {
        font-size: 36px;
        color: var(--text-main);
    }

    .admin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
    }

    .admin-card {
        background: white;
        padding: 32px;
        display: flex;
        flex-direction: column;
        text-align: center;
        text-decoration: none;
        color: inherit;
    }

    .admin-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }

    .admin-card i {
        font-size: 48px;
        color: var(--accent-dark);
        margin-bottom: 16px;
    }

    .admin-card h3 {
        font-size: 20px;
        margin-bottom: 8px;
    }

    .admin-card p {
        color: var(--text-muted);
        font-size: 14px;
    }
</style>

