<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { apiFetch, setToken, loadUser } from "$lib/api.js";

    let loading = $state(false);
    let username = $state("");
    let password = $state("");
    let showPassword = $state(false);
    let errorMsg = $state("");

    onMount(() => {
        const errorParam = page.url.searchParams.get("error");
        if (errorParam === "banned") {
            errorMsg = "Tài khoản của bạn đã bị khóa";
        }
    });

    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }

    async function handleLogin(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";

        try {
            const res = await apiFetch("/api/auth/sign-in/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: username.trim() + "@vhdp.local",
                    password
                })
            });

            if (!res.ok) {
                const data = await res.json();
                errorMsg = data.message || "Tên đăng nhập hoặc mật khẩu không đúng";
                loading = false;
                return;
            }

            const data = await res.json();
            const token = data.token;
            if (token) {
                setToken(token);
                const user = await loadUser();
                if (user) {
                    const callback = page.url.searchParams.get("callback") || "/";
                    goto(callback);
                } else {
                    errorMsg = "Không thể tải thông tin phiên đăng nhập";
                }
            } else {
                errorMsg = "Lỗi xác thực: không nhận được token";
            }
        } catch (err) {
            errorMsg = "Lỗi kết nối đến máy chủ";
        } finally {
            loading = false;
        }
    }
</script>

<div class="auth-page dot-grid-bg">
    <div class="auth-card">
        <div class="auth-header">
            <span class="label">
                <span class="label-bar"></span>
                Đăng nhập
            </span>
            <h1>
                Chào mừng trở lại<span class="accent">.</span>
            </h1>
            <p class="auth-subtitle">Đăng nhập để tiếp tục vào thư viện văn học</p>
        </div>

        <form onsubmit={handleLogin} class="auth-form">
            <div class="input-group mb-6">
                <label for="username" class="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-[#111111] block mb-3">
                    Tên đăng nhập
                </label>
                <input
                    type="text"
                    id="username"
                    placeholder="Nhập tên đăng nhập"
                    bind:value={username}
                    autocomplete="username"
                    disabled={loading}
                    class="newsprint-input w-full"
                />
            </div>

            <div class="input-group mb-6">
                <label for="password" class="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-[#111111] block mb-3">
                    Mật khẩu
                </label>
                <div class="password-field">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Nhập mật khẩu"
                        bind:value={password}
                        autocomplete="current-password"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        class="toggle-password"
                        onclick={togglePasswordVisibility}
                        disabled={loading}
                        aria-label="Hiển thị/Ẩn mật khẩu"
                    >
                        <i class={`bx ${showPassword ? "bx-hide" : "bx-show"}`}></i>
                    </button>
                </div>
            </div>

            {#if errorMsg}
                <div class="error-container mb-6 border-l-4 border-[#CC0000] bg-[#CC0000]/5 px-4 py-4">
                    <p class="error-msg font-sans text-sm text-[#CC0000] flex items-center gap-2">
                        <i class="bx bx-error-circle text-lg"></i>
                        <span>{errorMsg}</span>
                    </p>
                </div>
            {/if}

            <button type="submit" class="newsprint-btn newsprint-btn--primary w-full py-4 mt-6 text-sm" disabled={loading || !username.trim() || !password}>
                {#if loading}
                    <span class="loading-spinner inline-block w-4 h-4 border-2 border-[#F9F9F7]/30 border-t-[#F9F9F7] rounded-none animate-spin mr-2"></span>
                    Đang xử lý...
                {:else}
                    Đăng nhập
                {/if}
            </button>
        </form>

        <div class="auth-divider my-8 flex items-center gap-4">
            <span class="flex-1 h-[1px] bg-neutral-200"></span>
            <span class="font-mono text-xs uppercase tracking-widest text-neutral-400">hoặc</span>
            <span class="flex-1 h-[1px] bg-neutral-200"></span>
        </div>

        <p class="auth-footer text-center font-sans text-sm text-neutral-600">
            Chưa có tài khoản? <a href="/register" class="text-[#CC0000] font-bold hover:underline underline-offset-4 decoration-2">Đăng ký ngay</a>
        </p>
    </div>
</div>

<style>
    .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 80px 20px 20px 20px;
        position: relative;
    }

    .auth-card {
        width: 100%;
        max-width: 460px;
        padding: 48px;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 8px 8px 0px 0px var(--newsprint-ink);
        position: relative;
        overflow: hidden;
    }

    .auth-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--newsprint-red) 0%, var(--newsprint-red) 60%, var(--newsprint-ink) 60%, var(--newsprint-ink) 100%);
    }

    .auth-header {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 2px solid var(--newsprint-ink);
    }

    .auth-header .label {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.25em;
        color: var(--newsprint-red);
        margin-bottom: 16px;
    }

    .label-bar {
        width: 32px;
        height: 2px;
        background: var(--newsprint-red);
    }

    .auth-header h1 {
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: 36px;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--newsprint-ink);
        margin-bottom: 8px;
    }

    .auth-header .accent {
        color: var(--newsprint-red);
    }

    .auth-subtitle {
        font-family: 'Lora', serif;
        font-size: 14px;
        color: var(--newsprint-neutral-500);
        margin-top: 8px;
    }

    .auth-form {
        text-align: left;
    }

    .input-group {
        margin-bottom: 24px;
    }

    .input-group label {
        display: block;
        margin-bottom: 8px;
    }

    .newsprint-input {
        width: 100%;
        border: none;
        border-bottom: 2px solid var(--newsprint-ink);
        background: transparent;
        padding: 12px 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        color: var(--newsprint-ink);
        outline: none;
        transition: all 0.2s ease-out;
        border-radius: 0px;
    }

    .newsprint-input:focus {
        border-bottom-color: var(--newsprint-red);
        background: var(--newsprint-surface);
    }

    .newsprint-input::placeholder {
        color: var(--newsprint-neutral-400);
    }

    .newsprint-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .password-field {
        display: flex;
        align-items: stretch;
        border: 2px solid var(--newsprint-ink);
        background: var(--newsprint-white);
        transition: all 0.2s ease-out;
    }

    .password-field:focus-within {
        border-color: var(--newsprint-red);
        background: var(--newsprint-surface);
    }

    .password-field input {
        flex: 1;
        border: none;
        outline: none;
        padding: 14px 16px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        color: var(--newsprint-ink);
        background: transparent;
        min-width: 0;
    }

    .password-field input::placeholder {
        color: var(--newsprint-neutral-400);
    }

    .toggle-password {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        min-height: 48px;
        border: none;
        border-left: 1px solid var(--newsprint-divider);
        background: transparent;
        color: var(--newsprint-neutral-500);
        cursor: pointer;
        transition: all 0.2s ease-out;
        font-size: 20px;
    }

    .toggle-password:hover:not(:disabled) {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .toggle-password:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .auth-divider {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 32px 0;
    }

    .auth-divider span {
        flex: 1;
        height: 1px;
        background: var(--newsprint-divider);
    }

    .auth-footer {
        text-align: center;
        font-size: 14px;
        color: var(--newsprint-neutral-600);
    }

    .loading-spinner {
        animation: spin 0.8s linear infinite;
        border-radius: 0px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
        .auth-card {
            padding: 32px 24px;
            box-shadow: 4px 4px 0px 0px var(--newsprint-ink);
        }
    }
</style>
