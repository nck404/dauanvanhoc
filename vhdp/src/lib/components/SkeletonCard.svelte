<script>
    let { type = "book" } = $props();
</script>

{#if type === 'text'}
    <div class="skeleton-text">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
    </div>
{:else}
    <div class="skeleton-card sharp-corners">
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
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        border: 1px solid var(--ink);
        background: var(--bg-wash);
    }

    .skeleton-cover {
        position: relative;
        width: 100%;
        aspect-ratio: 2 / 3;
        border: 1px solid var(--ink);
        background: var(--bg-wash-deep);
        overflow: hidden;
        margin-bottom: 16px;
    }

    .skeleton-cover.audio,
    .skeleton-cover.video {
        aspect-ratio: 1 / 1;
    }

    .skeleton-cover.video {
        aspect-ratio: 16 / 9;
    }

    .skeleton-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(17, 17, 17, 0.04) 50%,
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
    }

    .skeleton-line {
        height: 12px;
        background: var(--bg-wash-deep);
        border: 1px solid var(--line);
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
            rgba(17, 17, 17, 0.04) 50%,
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
        margin-bottom: 8px;
    }

    .skeleton-text .skeleton-line.short {
        width: 60%;
    }
</style>
