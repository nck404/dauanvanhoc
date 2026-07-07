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
        background: var(--newsprint-white);
        padding: 40px;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--newsprint-ink);
        box-shadow: var(--shadow-hard);
        border-radius: 0px;
    }

    .header {
        margin-bottom: 32px;
        border-bottom: 2px solid var(--newsprint-ink);
        padding-bottom: 24px;
    }

    .header h1 {
        font-family: 'Playfair Display', serif;
        font-size: 32px;
        color: var(--newsprint-ink);
        margin: 12px 0 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 900;
    }

    .header p {
        color: var(--newsprint-neutral-600);
        font-family: 'Lora', serif;
        font-style: italic;
    }

    .back-link {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--newsprint-ink);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        padding: 8px 16px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        border-radius: 0px;
    }

    .back-link:hover {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .alert {
        padding: 16px 20px;
        border-radius: 0px;
        margin-bottom: 24px;
        font-weight: 600;
        border: 1px solid var(--newsprint-ink);
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
    }

    .alert.error {
        background: var(--newsprint-white);
        color: var(--newsprint-red);
        border-color: var(--newsprint-red);
        box-shadow: 2px 2px 0 var(--newsprint-red);
    }

    .alert.success {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        border-color: var(--newsprint-ink);
        box-shadow: 2px 2px 0 var(--newsprint-ink);
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
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
        border: 1px solid var(--newsprint-ink);
        font-weight: 700;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .user-table td {
        padding: 16px;
        border: 1px solid var(--newsprint-ink);
        vertical-align: middle;
        background: var(--newsprint-white);
        color: var(--newsprint-ink-soft);
    }

    .username {
        font-weight: 700;
        color: var(--newsprint-ink);
    }

    .role-badge {
        padding: 4px 12px;
        border-radius: 0px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        border: 1px solid var(--newsprint-ink);
        display: inline-block;
        font-family: 'JetBrains Mono', monospace;
    }

    .role-badge.admin {
        background: var(--newsprint-red);
        color: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }

    .role-badge.user {
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
    }

    .role-badge.banned {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .action-group {
        display: flex;
        gap: 8px;
    }

    .role-select {
        padding: 8px 12px;
        border-radius: 0px;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-surface);
        color: var(--newsprint-ink);
        font-family: inherit;
        font-size: 14px;
        outline: none;
    }

    .role-select:focus {
        background: var(--newsprint-white);
        border-color: var(--newsprint-red);
    }

    .save-btn {
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid var(--newsprint-ink);
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
        border-radius: 0px;
        cursor: pointer;
        transition: all 0.2s ease-out;
    }

    .save-btn:hover {
        background: var(--newsprint-white);
        color: var(--newsprint-ink);
    }

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
