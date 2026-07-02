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
            { score: 1, label: "Yếu", color: "#CC0000" },
            { score: 2, label: "Trung bình", color: "#CC0000" },
            { score: 3, label: "Khá", color: "#CC0000" },
            { score: 4, label: "Mạnh", color: "#CC0000" },
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

<div class="auth-page dot-grid-bg">
    <div class="auth-card newsprint-card">
        <div class="auth-header border-b-4 border-[#111111] pb-6 mb-8">
            <span class="label font-mono text-[10px] uppercase tracking-[0.2em] text-[#CC0000] font-bold block mb-4 flex items-center gap-3">
                <span class="w-8 h-[2px] bg-[#CC0000]"></span>
                Đăng ký
            </span>
            <h1 class="font-serif font-black text-4xl text-[#111111] leading-tight">
                Tham gia VHDP<span class="text-[#CC0000]">.</span>
            </h1>
        </div>

        <form onsubmit={handleRegister} class="auth-form">
            <div class="input-group mb-6">
                <label for="username" class="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-[#111111] block mb-3">
                    Tên đăng nhập
                </label>
                <input
                    type="text"
                    id="username"
                    placeholder="3-20 ký tự (chữ, số, -, _)"
                    bind:value={username}
                    autocomplete="username"
                    minlength="3"
                    maxlength="20"
                    disabled={loading}
                    class="newsprint-input w-full"
                />
            </div>

            <div class="input-group mb-6">
                <label for="password" class="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-[#111111] block mb-3">
                    Mật khẩu
                </label>
                <div class="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Ít nhất 6 ký tự"
                        bind:value={password}
                        autocomplete="new-password"
                        minlength="6"
                        maxlength="100"
                        disabled={loading}
                        class="newsprint-input w-full pr-14"
                    />
                    <button
                        type="button"
                        class="toggle-password absolute right-0 bottom-0 w-12 h-12 border border-[#111111] bg-[#F9F9F7] flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                        onclick={togglePasswordVisibility}
                        disabled={loading}
                        aria-label="Hiển thị/Ẩn mật khẩu"
                    >
                        <i class={`bx ${showPassword ? "bx-hide" : "bx-show"} text-xl`}></i>
                    </button>
                </div>
                {#if password}
                    <div class="password-strength mt-4">
                        <div class="strength-bar w-full h-[3px] bg-neutral-200 overflow-hidden border border-neutral-200">
                            <div
                                class="strength-fill h-full transition-all duration-300"
                                style="width: {(passwordStrength.score / 4) * 100}%; background-color: {passwordStrength.score <= 2 ? '#CC0000' : passwordStrength.score === 3 ? '#111111' : '#111111'};"
                            ></div>
                        </div>
                        <p class="strength-label font-mono text-[10px] uppercase tracking-widest font-bold mt-2" style="color: {passwordStrength.score <= 2 ? '#CC0000' : '#111111'};">
                            Mức độ: {passwordStrength.label}
                        </p>
                    </div>
                {/if}
            </div>

            <div class="input-group mb-6">
                <label for="confirmPassword" class="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-[#111111] block mb-3">
                    Xác nhận mật khẩu
                </label>
                <div class="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        bind:value={confirmPassword}
                        autocomplete="new-password"
                        minlength="6"
                        maxlength="100"
                        disabled={loading}
                        class="newsprint-input w-full pr-14"
                    />
                    <button
                        type="button"
                        class="toggle-password absolute right-0 bottom-0 w-12 h-12 border border-[#111111] bg-[#F9F9F7] flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all duration-200"
                        onclick={toggleConfirmPasswordVisibility}
                        disabled={loading}
                        aria-label="Hiển thị/Ẩn xác nhận mật khẩu"
                    >
                        <i class={`bx ${showConfirmPassword ? "bx-hide" : "bx-show"} text-xl`}></i>
                    </button>
                </div>
                {#if confirmPassword && !passwordsMatch}
                    <p class="input-error font-mono text-xs text-[#CC0000] mt-3 font-bold uppercase tracking-wider flex items-center gap-2">
                        <i class="bx bx-x-circle"></i>
                        Mật khẩu không khớp
                    </p>
                {/if}
            </div>

            {#if errorMsg}
                <div class="error-container mb-6 border-l-4 border-[#CC0000] bg-[#CC0000]/5 px-4 py-4">
                    <p class="error-msg font-sans text-sm text-[#CC0000] flex items-center gap-2">
                        <i class="bx bx-error-circle text-lg"></i>
                        <span>{errorMsg}</span>
                    </p>
                </div>
            {/if}

            <button
                type="submit"
                class="newsprint-btn newsprint-btn--primary w-full py-4 mt-6 text-sm"
                disabled={loading || !passwordsMatch || !password || !username.trim() || !confirmPassword}
            >
                {#if loading}
                    <span class="loading-spinner inline-block w-4 h-4 border-2 border-[#F9F9F7]/30 border-t-[#F9F9F7] rounded-none animate-spin mr-2"></span>
                    Đang xử lý...
                {:else}
                    Đăng ký
                {/if}
            </button>
        </form>

        <div class="auth-divider my-8 flex items-center gap-4">
            <span class="flex-1 h-[1px] bg-neutral-200"></span>
            <span class="font-mono text-xs uppercase tracking-widest text-neutral-400">hoặc</span>
            <span class="flex-1 h-[1px] bg-neutral-200"></span>
        </div>

        <p class="auth-footer text-center font-sans text-sm text-neutral-600">
            Đã có tài khoản? <a href="/login" class="text-[#CC0000] font-bold hover:underline underline-offset-4 decoration-2">Đăng nhập ngay</a>
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
        max-width: 480px;
        padding: 48px;
        background: var(--newsprint-white);
        border: 2px solid var(--newsprint-ink);
        box-shadow: 8px 8px 0px 0px var(--newsprint-ink);
    }

    .auth-form {
        text-align: left;
    }

    .input-group {
        margin-bottom: 24px;
    }

    .toggle-password {
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease-out;
        border-radius: 0px;
    }

    .toggle-password:hover:not(:disabled) {
        background: var(--newsprint-ink);
        color: var(--newsprint-white);
    }

    .toggle-password:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
