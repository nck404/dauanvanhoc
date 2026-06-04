<script>
    let { type = "book" } = $props();
</script>

{#if type === 'text'}
    <div class="skeleton-text">
        <div class="skeleton-line"></div>
    </div>
{:else}
    <div class="skeleton-card">
        <div class="skeleton-cover {type}">
            <div class="skeleton-shimmer"></div>
        </div>
        <div class="skeleton-info">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-author"></div>
        </div>
    </div>
{/if}

<style>
    .skeleton-card {
        padding: 28px 24px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        min-height: 340px;
    }

    .skeleton-cover {
        position: relative;
        width: 140px;
        height: 200px;
        border-radius: 4px;
        background: var(--line, rgba(0,0,0,0.08));
        overflow: hidden;
        margin-bottom: 24px;
    }

    .skeleton-cover.audio,
    .skeleton-cover.video {
        width: 100%;
        height: 0;
        padding-bottom: 100%;
        border-radius: 14px;
    }

    .skeleton-cover.video {
        padding-bottom: 56.25%;
    }

    .skeleton-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.45) 50%,
            transparent 100%
        );
        animation: shimmer 1.6s ease-in-out infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .skeleton-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: auto;
    }

    .skeleton-line {
        height: 12px;
        border-radius: 6px;
        background: var(--line, rgba(0,0,0,0.08));
        position: relative;
        overflow: hidden;
    }

    .skeleton-line::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.45) 50%,
            transparent 100%
        );
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .skeleton-title {
        width: 85%;
        height: 16px;
    }

    .skeleton-author {
        width: 55%;
        height: 12px;
    }

    .skeleton-text {
        width: 100%;
    }

    .skeleton-text .skeleton-line {
        width: 100%;
        height: 14px;
        border-radius: 7px;
    }
</style>

