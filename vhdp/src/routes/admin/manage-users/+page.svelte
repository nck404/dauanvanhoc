<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api.js";

    let users = $state([]);
    let loading = $state(true);
    let message = $state("");
    let success = $state(false);

    async function loadUsers() {
        try {
            const res = await apiFetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                users = data.users || [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadUsers();
    });

    async function updateRole(userId, role) {
        try {
            const res = await apiFetch("/api/admin/users/role", {
                method: "POST",
                body: JSON.stringify({ userId, role })
            });
            if (res.ok) {
                message = "Cập nhật quyền thành công";
                success = true;
                await loadUsers();
            } else {
                message = "Lỗi khi cập nhật quyền";
                success = false;
            }
        } catch (e) {
            message = "Lỗi hệ thống";
            success = false;
        }
    }

    async function toggleBan(userId, currentBanned) {
        try {
            const res = await apiFetch("/api/admin/users/ban", {
                method: "POST",
                body: JSON.stringify({ userId, banned: !currentBanned })
            });
            if (res.ok) {
                message = currentBanned ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản";
                success = true;
                await loadUsers();
            } else {
                message = "Lỗi khi thay đổi trạng thái khóa";
                success = false;
            }
        } catch (e) {
            message = "Lỗi hệ thống";
            success = false;
        }
    }
</script>

<svelte:head>
    <title>Quản lý người dùng - Admin</title>
</svelte:head>

<div class="admin-container">
    <div class="content-wrapper">
        <div class="header">
            <a href="/admin" class="back-link"
                ><i class="bx bx-arrow-back"></i> Quay lại Admin</a
            >
            <h1><i class="bx bx-group"></i> Quản lý người dùng</h1>
            <p>Phân quyền Admin hoặc User cho các thành viên.</p>
        </div>

        {#if message}
            <div class="alert {success ? 'success' : 'error'}">
                {message}
            </div>
        {/if}

        <div class="table-responsive">
            <table class="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Quyền hiện tại</th>
                        <th>Trạng thái</th>
                        <th>Thay đổi quyền</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {#each users as user}
                        <tr>
                            <td>#{user.id.substring(0, 8)}</td>
                            <td class="username">{user.username}</td>
                            <td>
                                <span class="role-badge {user.role}">
                                    {user.role === "admin"
                                        ? "Quản trị viên"
                                        : "Thành viên"}
                                </span>
                            </td>
                            <td>
                                <span class="role-badge {user.banned ? 'banned' : 'user'}">
                                    {user.banned ? "Bị khóa" : "Hoạt động"}
                                </span>
                            </td>
                            <td>
                                <form
                                    onsubmit={(e) => {
                                        e.preventDefault();
                                        const role = e.target.role.value;
                                        updateRole(user.id, role);
                                    }}
                                >
                                    <div class="action-group">
                                        <select name="role" class="role-select">
                                            <option
                                                value="user"
                                                selected={user.role === "user"}
                                                >User</option
                                            >
                                            <option
                                                value="admin"
                                                selected={user.role === "admin"}
                                                >Admin</option
                                            >
                                        </select>
                                        <button type="submit" class="comic-btn comic-btn--blue comic-btn--sm save-btn">
                                            <i class="bx bx-save"></i> Lưu
                                        </button>
                                    </div>
                                </form>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    class="comic-btn {user.banned ? 'comic-btn--green' : 'comic-btn--red'} comic-btn--sm"
                                    onclick={() => toggleBan(user.id, user.banned)}
                                >
                                    {user.banned ? "Mở khóa" : "Khóa"}
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
    .admin-container {
        padding: 40px 20px;
        max-width: 1000px;
        margin: 0 auto;
    }

    .content-wrapper {
        background: #fff;
        padding: 40px;
        display: flex;
        flex-direction: column;
    }

    .header {
        margin-bottom: 32px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        padding-bottom: 24px;
    }

    .header h1 {
        font-size: 32px;
        color: var(--text-main);
        margin: 12px 0 8px;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .header p {
        color: var(--text-muted);
    }

    .back-link {
        color: var(--text-muted);
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .back-link:hover {
        color: var(--accent-dark);
    }

    .alert {
        padding: 16px 20px;
        border-radius: 12px;
        margin-bottom: 24px;
        font-weight: 600;
    }

    .alert.error {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fee2e2;
    }

    .alert.success {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #dcfce7;
    }

    .table-responsive {
        overflow-x: auto;
    }

    .user-table {
        width: 100%;
        border-collapse: collapse;
    }

    .user-table th {
        text-align: left;
        padding: 16px;
        background: #f8fafc;
        color: var(--text-muted);
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .user-table td {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
    }

    .username {
        font-weight: 700;
        color: var(--text-main);
    }

    .role-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
    }

    .role-badge.admin {
        background: #fee2e2;
        color: #ef4444;
    }

    .role-badge.user {
        background: #f1f5f9;
        color: #64748b;
    }

    .role-badge.banned {
        background: #7f1d1d;
        color: #fca5a5;
    }


    .action-group {
        display: flex;
        gap: 8px;
    }

    .role-select {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        font-family: inherit;
        font-size: 14px;
        outline: none;
    }

    .role-select:focus {
        border-color: var(--accent-dark);
    }

    .save-btn { padding: 8px 14px; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; box-shadow: 3px 3px 0px #1a1515; border-radius: 4px; font-family: "Space Grotesk", sans-serif; }
    .save-btn:hover { box-shadow: 2px 2px 0px #1a1515; transform: translate(1px, 1px); background: #1d4ed8; }

    @media (max-width: 640px) {
        .content-wrapper {
            padding: 20px;
        }

        .header h1 {
            font-size: 24px;
        }

        .action-group {
            flex-direction: column;
        }
    }
</style>

