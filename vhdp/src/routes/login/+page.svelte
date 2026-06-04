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

<div class="auth-page">
    <div class="stars-container">
        <div class="star s" style="top: 10%; left: 15%;"></div>
        <div class="star m" style="top: 25%; left: 85%;"></div>
        <div class="star l" style="top: 60%; left: 5%;"></div>
    </div>

    <div class="auth-card">
        <h1 class="gradient-text">Chào mừng trở lại</h1>
        <p class="subtitle">Tiếp tục hành trình văn học của bạn ✨</p>

        <form onsubmit={handleLogin} class="auth-form">
            <div class="input-group">
                <label for="username">Tên đăng nhập</label>
                <div class="input-wrapper">
                    <i class="bx bx-user"></i>
                    <input
                        type="text"
                        id="username"
                        placeholder="Nhập tên đăng nhập"
                        bind:value={username}
                        autocomplete="username"
                        disabled={loading}
                    />
                </div>
            </div>

            <div class="input-group">
                <label for="password">Mật khẩu</label>
                <div class="input-wrapper">
                    <i class="bx bx-lock-alt"></i>
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
                <div class="error-container">
                    <p class="error-msg">
                        <i class="bx bx-error-circle"></i>
                        <span>{errorMsg}</span>
                    </p>
                </div>
            {/if}

            <button type="submit" class="comic-btn comic-btn--red comic-btn--lg auth-submit" disabled={loading || !username.trim() || !password}>
                {#if loading}
                    <span class="loading-spinner"></span>
                    Đang xử lý...
                {:else}
                    Đăng nhập
                {/if}
            </button>
        </form>

        <p class="auth-footer">
            Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
        </p>

        <p class="forgot-password">
            <a href="#forgot">Quên mật khẩu?</a>
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
        background: linear-gradient(
            135deg,
            rgba(225, 91, 91, 0.08) 0%,
            rgba(225, 91, 91, 0.02) 100%
        );
    }

    .auth-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        width: 100%;
        max-width: 420px;
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(225, 91, 91, 0.1);
        text-align: center;
        z-index: 10;
        animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .gradient-text {
        background: linear-gradient(135deg, #e15b5b, #d43f3f);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 32px;
        margin-bottom: 8px;
        color: var(--text-main);
        font-weight: 700;
    }

    .subtitle {
        color: var(--text-muted);
        margin-bottom: 32px;
        font-size: 14px;
    }

    .auth-form {
        text-align: left;
    }

    .input-group {
        margin-bottom: 20px;
    }

    .input-group label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-main);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .input-wrapper i {
        position: absolute;
        left: 16px;
        font-size: 20px;
        color: var(--accent-dark);
        pointer-events: none;
    }

    .input-wrapper input {
        width: 100%;
        padding: 12px 48px 12px 48px;
        border-radius: 12px;
        border: 2px solid var(--accent-light);
        outline: none;
        font-family: inherit;
        font-size: 16px;
        transition: all 0.3s ease;
        background: white;
    }

    .input-wrapper input:focus {
        border-color: var(--accent-dark);
        box-shadow: 0 0 0 3px rgba(225, 91, 91, 0.1);
        background: white;
    }

    .input-wrapper input:disabled {
        background: var(--accent-light);
        cursor: not-allowed;
        opacity: 0.6;
    }

    .toggle-password {
        position: absolute;
        right: 12px;
        z-index: 10;
        padding: 0;
        background: transparent;
        border: none;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: var(--accent-dark);
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
    }

    .toggle-password:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
        color: var(--coral);
    }

    .toggle-password:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .error-container {
        margin-bottom: 20px;
        animation: shake 0.4s ease-in-out;
    }

    @keyframes shake {
        0%,
        100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-5px);
        }
        75% {
            transform: translateX(5px);
        }
    }

    .error-msg {
        color: #e15b5b;
        background: rgba(225, 91, 91, 0.1);
        border-left: 4px solid #e15b5b;
        font-size: 14px;
        padding: 12px;
        border-radius: 8px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin: 0;
    }

    .error-msg i {
        flex-shrink: 0;
        margin-top: 2px;
    }

    .error-msg span {
        flex: 1;
        line-height: 1.4;
    }

    .auth-submit {
        width: 100%;
        padding: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .auth-submit:hover:not(:disabled) {
        box-shadow: 2px 2px 0px #1a1515;
        transform: translate(2px, 2px);
    }

    .auth-submit:active:not(:disabled) {
        box-shadow: 0px 0px 0px #1a1515;
        transform: translate(4px, 4px);
    }

    .auth-submit:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .auth-footer {
        margin-top: 32px;
        font-size: 14px;
        color: var(--text-muted);
        margin-bottom: 16px;
    }

    .auth-footer a {
        color: var(--accent-dark);
        font-weight: 700;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    .auth-footer a:hover {
        text-decoration: underline;
    }

    .forgot-password {
        text-align: center;
        font-size: 13px;
        color: var(--text-muted);
        margin: 0;
    }

    .forgot-password a {
        color: var(--accent-dark);
        text-decoration: none;
        font-weight: 600;
        transition: color 0.3s ease;
    }

    .forgot-password a:hover {
        text-decoration: underline;
    }

    .stars-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }

    .star {
        position: absolute;
        background: var(--accent-dark);
        clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
        );
        opacity: 0.3;
        animation: float 4s ease-in-out infinite;
    }

    .star.s {
        width: 40px;
        height: 40px;
    }
    .star.m {
        width: 60px;
        height: 60px;
    }
    .star.l {
        width: 80px;
        height: 80px;
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }
        50% {
            transform: translateY(-20px) rotate(10deg);
        }
    }

    @media (max-width: 480px) {
        .auth-card {
            padding: 32px 24px;
        }

        .gradient-text {
            font-size: 28px;
        }

        .input-wrapper input {
            font-size: 16px;
        }
    }
</style>

