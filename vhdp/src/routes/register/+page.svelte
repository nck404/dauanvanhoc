<script>
    import { goto } from "$app/navigation";
    import { apiFetch, setToken, loadUser } from "$lib/api.js";

    let loading = $state(false);
    let username = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let showPassword = $state(false);
    let showConfirmPassword = $state(false);
    let errorMsg = $state("");

    let passwordsMatch = $derived(password && confirmPassword ? password === confirmPassword : true);

    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }

    function toggleConfirmPasswordVisibility() {
        showConfirmPassword = !showConfirmPassword;
    }

    function getPasswordStrength() {
        if (!password) return { score: 0, label: "", color: "" };

        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;

        const levels = [
            { score: 0, label: "", color: "" },
            { score: 1, label: "Yếu", color: "#e15b5b" },
            { score: 2, label: "Trung bình", color: "#f59e0b" },
            { score: 3, label: "Khá", color: "#fbbf24" },
            { score: 4, label: "Mạnh", color: "#10b981" },
        ];

        return levels[Math.min(Math.ceil(score / 1.5), 4)];
    }

    const passwordStrength = $derived(getPasswordStrength());

    async function handleRegister(e) {
        e.preventDefault();
        loading = true;
        errorMsg = "";

        if (password !== confirmPassword) {
            errorMsg = "Mật khẩu xác nhận không khớp";
            loading = false;
            return;
        }

        try {
            const res = await apiFetch("/api/auth/sign-up/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: username.trim() + "@vhdp.local",
                    password,
                    name: username.trim(),
                    username: username.trim()
                })
            });

            if (!res.ok) {
                const data = await res.json();
                errorMsg = data.message || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại";
                loading = false;
                return;
            }

            const data = await res.json();
            const token = data.token;
            if (token) {
                setToken(token);
                await loadUser();
                goto("/");
            } else {
                errorMsg = "Đăng ký thành công, vui lòng đăng nhập";
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
        <div class="star s" style="top: 15%; left: 80%;"></div>
        <div class="star m" style="top: 70%; left: 10%;"></div>
        <div class="star l" style="top: 40%; left: 50%;"></div>
    </div>

    <div class="auth-card">
        <h1 class="gradient-text">Tham gia VHDP</h1>
        <p class="subtitle">Bắt đầu hành trình khám phá văn học ✨</p>

        <form onsubmit={handleRegister} class="auth-form">
            <div class="input-group">
                <label for="username">Tên đăng nhập</label>
                <div class="input-wrapper">
                    <i class="bx bx-user"></i>
                    <input
                        type="text"
                        id="username"
                        placeholder="3-20 ký tự (chữ, số, -, _)"
                        bind:value={username}
                        autocomplete="username"
                        minlength="3"
                        maxlength="20"
                        disabled={loading}
                    />
                </div>
                <p class="input-hint">
                    Tên đăng nhập chỉ được chứa chữ cái, số, gạch ngang và gạch dưới
                </p>
            </div>

            <div class="input-group">
                <label for="password">Mật khẩu</label>
                <div class="input-wrapper">
                    <i class="bx bx-lock-alt"></i>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Ít nhất 6 ký tự"
                        bind:value={password}
                        autocomplete="new-password"
                        minlength="6"
                        maxlength="100"
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
                {#if password}
                    <div class="password-strength">
                        <div class="strength-bar">
                            <div
                                class="strength-fill"
                                style="width: {(passwordStrength.score / 4) * 100}%; background-color: {passwordStrength.color};"
                            ></div>
                        </div>
                        <p class="strength-label" style="color: {passwordStrength.color};">
                            Mức độ: {passwordStrength.label}
                        </p>
                    </div>
                {/if}
            </div>

            <div class="input-group">
                <label for="confirmPassword">Xác nhận mật khẩu</label>
                <div class="input-wrapper">
                    <i class="bx bx-check-shield"></i>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        bind:value={confirmPassword}
                        autocomplete="new-password"
                        minlength="6"
                        maxlength="100"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        class="toggle-password"
                        onclick={toggleConfirmPasswordVisibility}
                        disabled={loading}
                        aria-label="Hiển thị/Ẩn xác nhận mật khẩu"
                    >
                        <i class={`bx ${showConfirmPassword ? "bx-hide" : "bx-show"}`}></i>
                    </button>
                    {#if confirmPassword && !passwordsMatch}
                        <span class="match-indicator unmatched">
                            <i class="bx bx-x"></i>
                        </span>
                    {/if}
                    {#if confirmPassword && passwordsMatch && password}
                        <span class="match-indicator matched">
                            <i class="bx bx-check"></i>
                        </span>
                    {/if}
                </div>
                {#if confirmPassword && !passwordsMatch}
                    <p class="input-error">Mật khẩu không khớp</p>
                {/if}
            </div>

            {#if errorMsg}
                <div class="error-container">
                    <p class="error-msg">
                        <i class="bx bx-error-circle"></i>
                        <span>{errorMsg}</span>
                    </p>
                </div>
            {/if}

            <button
                type="submit"
                class="comic-btn comic-btn--red comic-btn--lg auth-submit"
                disabled={loading || !passwordsMatch || !password || !username.trim() || !confirmPassword}
            >
                {#if loading}
                    <span class="loading-spinner"></span>
                    Đang xử lý...
                {:else}
                    Đăng ký
                {/if}
            </button>
        </form>

        <p class="auth-footer">
            Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
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
        background: linear-gradient(135deg, rgba(225, 91, 91, 0.08) 0%, rgba(225, 91, 91, 0.02) 100%);
    }

    .auth-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        width: 100%;
        max-width: 450px;
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(225, 91, 91, 0.1);
        text-align: center;
        z-index: 10;
        animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

    .gradient-text {
        background: linear-gradient(135deg, #e15b5b, #d43f3f);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 32px;
        margin-bottom: 8px;
        font-weight: 700;
    }

    .subtitle { color: var(--text-muted); margin-bottom: 32px; font-size: 14px; }
    .auth-form { text-align: left; }
    .input-group { margin-bottom: 24px; }
    .input-group label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }

    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-wrapper i { position: absolute; left: 16px; font-size: 20px; color: var(--accent-dark); pointer-events: none; }
    .input-wrapper input { width: 100%; padding: 12px 48px; border-radius: 12px; border: 2px solid var(--accent-light); outline: none; font-family: inherit; font-size: 16px; transition: all 0.3s ease; background: white; }
    .input-wrapper input:focus { border-color: var(--accent-dark); box-shadow: 0 0 0 3px rgba(225, 91, 91, 0.1); }

    .toggle-password { position: absolute; right: 12px; z-index: 10; padding: 0; background: transparent; border: none; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--accent-dark); border-radius: 50%; cursor: pointer; transition: background 0.2s, color 0.2s; }
    .toggle-password:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); color: var(--coral); }
    .toggle-password:disabled { opacity: 0.55; cursor: not-allowed; }
    .match-indicator { position: absolute; right: 48px; font-size: 18px; display: flex; align-items: center; }
    .match-indicator.matched { color: #10b981; }
    .match-indicator.unmatched { color: #e15b5b; }

    .input-hint, .input-error { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
    .input-error { color: #e15b5b; }

    .password-strength { margin-top: 8px; }
    .strength-bar { width: 100%; height: 4px; background: var(--accent-light); border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; transition: width 0.3s ease, background-color 0.3s ease; }
    .strength-label { font-size: 12px; margin-top: 4px; font-weight: 600; }

    .error-msg { color: #e15b5b; background: rgba(225, 91, 91, 0.1); border-left: 4px solid #e15b5b; font-size: 14px; padding: 12px; border-radius: 8px; display: flex; gap: 10px; margin-bottom: 20px; }
    
    .auth-submit { width: 100%; padding: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .auth-submit:hover:not(:disabled) { box-shadow: 2px 2px 0px #1a1515; transform: translate(2px, 2px); }
    .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    .loading-spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-footer { margin-top: 32px; font-size: 14px; color: var(--text-muted); }
    .auth-footer a { color: var(--accent-dark); font-weight: 700; text-decoration: none; }

    .stars-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
    .star { position: absolute; background: var(--accent-dark); clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); opacity: 0.3; animation: float 4s ease-in-out infinite; }
    .star.s { width: 40px; height: 40px; }
    .star.m { width: 60px; height: 60px; }
    .star.l { width: 80px; height: 80px; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px) rotate(10deg); } }
</style>

