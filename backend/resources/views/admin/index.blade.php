<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hijaz Admin — Control Center</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap"
        rel="stylesheet">

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        :root {
            --bg-dark: #070707;
            --panel-bg: rgba(20, 20, 20, 0.6);
            --border-glass: rgba(255, 255, 255, 0.08);
            --gold-primary: #d4af37;
            --gold-dark: #b8860b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-dark);
            color: #ffffff;
            font-family: 'Outfit', 'Inter', sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ─── Keyframe Animations ─── */
        @keyframes adminShake {

            0%,
            100% {
                transform: translateX(0);
            }

            20% {
                transform: translateX(-8px);
            }

            40% {
                transform: translateX(8px);
            }

            60% {
                transform: translateX(-6px);
            }

            80% {
                transform: translateX(6px);
            }
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes toastFadeIn {
            from {
                opacity: 0;
                transform: translateY(16px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* ─── PIN Access Screen ─── */
        #pin-screen {
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, #1c1510 0%, #050505 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            z-index: 1000;
        }

        .pin-card {
            position: relative;
            width: 100%;
            max-width: 420px;
            background: rgba(20, 20, 20, 0.7);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--border-glass);
            border-radius: 24px;
            padding: 3rem 2.5rem;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
            text-align: center;
        }

        .pin-card.shake {
            animation: adminShake 0.5s ease;
        }

        .lock-badge {
            position: absolute;
            top: -40px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-dark) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3);
        }

        .pin-input {
            width: 100%;
            padding: 1rem 1.25rem;
            border-radius: 14px;
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.03);
            color: white;
            font-size: 1.1rem;
            text-align: center;
            letter-spacing: 0.3em;
            outline: none;
            transition: all 200ms ease;
        }

        .pin-input.error {
            border-color: rgba(239, 68, 68, 0.6);
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.15);
        }

        .btn-gold {
            width: 100%;
            padding: 1rem;
            border-radius: 14px;
            border: none;
            background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-dark) 100%);
            color: #0a0a0a;
            font-weight: 700;
            font-size: 0.95rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 200ms ease;
            box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
        }

        .btn-gold:hover {
            opacity: 0.92;
            transform: translateY(-1px);
        }

        /* ─── Main Admin Layout ─── */
        #admin-dashboard {
            display: none;
            min-height: 100vh;
            flex-direction: column;
        }

        header.admin-header {
            position: relative;
            z-index: 10;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(10, 10, 10, 0.85);
            backdrop-filter: blur(16px);
            padding: 1.25rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }

        .admin-main-wrapper {
            display: flex;
            flex: 1;
            position: relative;
            z-index: 5;
        }

        aside.admin-sidebar {
            width: 260px;
            flex-shrink: 0;
            border-right: 1px solid rgba(255, 255, 255, 0.06);
            padding: 2rem 0;
            background: rgba(255, 255, 255, 0.01);
            display: flex;
            flex-direction: column;
        }

        .sidebar-section-title {
            color: rgba(255, 255, 255, 0.35);
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            padding: 0 1.5rem;
            margin-bottom: 0.75rem;
        }

        .sidebar-btn {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.85rem 1.5rem;
            background: transparent;
            border: none;
            border-left: 3px solid transparent;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: left;
            transition: all 200ms ease;
            font-family: inherit;
        }

        .sidebar-btn:hover {
            color: rgba(255, 255, 255, 0.85);
            background: rgba(255, 255, 255, 0.02);
        }

        .sidebar-btn.active {
            color: #ffffff;
            font-weight: 700;
        }

        .sidebar-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.15rem 0.5rem;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.4);
        }

        main.admin-content {
            flex: 1;
            padding: 2.5rem;
            overflow-y: auto;
        }

        /* ─── Category Banner ─── */
        .category-banner {
            border-radius: 20px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
            transition: all 300ms ease;
        }

        /* ─── Product Card Row ─── */
        .product-row {
            display: grid;
            grid-template-columns: 64px 1fr 140px 100px 100px;
            align-items: center;
            gap: 1.5rem;
            padding: 1rem 1.5rem;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 200ms ease;
            margin-bottom: 0.75rem;
        }

        .product-row:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(255, 255, 255, 0.1);
        }

        .icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.03);
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 200ms ease;
        }

        .icon-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }

        .icon-btn.danger {
            border-color: rgba(239, 68, 68, 0.2);
            background: rgba(239, 68, 68, 0.05);
            color: rgba(239, 68, 68, 0.7);
        }

        .icon-btn.danger:hover {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
        }

        /* ─── Order Cards ─── */
        .order-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 20px;
            padding: 1.75rem;
            margin-bottom: 1.25rem;
            transition: all 250ms ease;
        }

        .order-card:hover {
            background: rgba(255, 255, 255, 0.035);
            border-color: rgba(212, 175, 55, 0.25);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
        }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.3rem 0.75rem;
            border-radius: 999px;
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .status-pill.processing {
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3);
            color: #fbbf24;
        }

        .status-pill.shipped {
            background: rgba(147, 197, 253, 0.12);
            border: 1px solid rgba(147, 197, 253, 0.3);
            color: #93c5fd;
        }

        .status-pill.delivered {
            background: rgba(134, 239, 172, 0.12);
            border: 1px solid rgba(134, 239, 172, 0.3);
            color: #86efac;
        }

        .status-pill.cancelled {
            background: rgba(248, 113, 113, 0.12);
            border: 1px solid rgba(248, 113, 113, 0.3);
            color: #f87171;
        }

        .status-select {
            background: #181818;
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            color: white;
            padding: 0.45rem 0.85rem;
            font-size: 0.8rem;
            font-weight: 600;
            outline: none;
            cursor: pointer;
            transition: all 180ms ease;
            font-family: inherit;
        }

        .status-select:focus,
        .status-select:hover {
            border-color: var(--gold-primary);
        }

        /* ─── Form Modal ─── */
        #product-modal,
        #coupon-modal {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.82);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 2000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }

        /* ─── Coupon Filter Buttons ─── */
        .coupon-filter-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.55);
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            cursor: pointer;
            transition: all 180ms ease;
            font-family: inherit;
        }

        .coupon-filter-btn:hover {
            color: white;
        }

        .coupon-filter-btn.active {
            background: rgba(212, 175, 55, 0.18);
            color: #d4af37;
        }

        .coupon-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 18px;
            padding: 1.35rem 1.5rem;
            margin-bottom: 0.85rem;
            transition: all 200ms ease;
        }

        .coupon-card:hover {
            background: rgba(255, 255, 255, 0.035);
            border-color: rgba(212, 175, 55, 0.25);
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        }

        .modal-card {
            background: #0f0f0f;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 28px;
            width: 100%;
            max-width: 580px;
            max-height: 88vh;
            overflow-y: auto;
            padding: 2.5rem;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
            position: relative;
        }

        .form-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.45);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.4rem;
            display: block;
        }

        .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.03);
            color: white;
            font-size: 0.9rem;
            outline: none;
            font-family: 'Inter', sans-serif;
            transition: all 200ms ease;
        }

        .form-input:focus {
            border-color: rgba(212, 175, 55, 0.5);
            box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
        }

        .drop-zone {
            border: 2px dashed rgba(255, 255, 255, 0.15);
            border-radius: 14px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.02);
            transition: all 200ms ease;
        }

        .drop-zone.dragover,
        .drop-zone:hover {
            border-color: var(--gold-primary);
            background: rgba(212, 175, 55, 0.05);
        }

        /* ─── Toast Feedback ─── */
        #admin-toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: #181818;
            border: 1px solid rgba(212, 175, 55, 0.35);
            border-radius: 14px;
            padding: 0.85rem 1.25rem;
            color: white;
            font-size: 0.88rem;
            font-weight: 600;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            gap: 0.6rem;
            z-index: 3000;
            animation: toastFadeIn 200ms ease forwards;
        }
    </style>
</head>

<body>

    <!-- ─── PIN Access Screen ─── -->
    <div id="pin-screen">
        <div class="pin-card" id="pin-card">
            <div class="lock-badge">
                <i data-lucide="lock" style="width: 32px; height: 32px; color: #0d0d0d; stroke-width: 2.25;"></i>
            </div>

            <div style="margin-top: 1rem;">
                <h1 style="color: white; font-size: 1.85rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                    Access Terminal
                </h1>
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 0.5rem; line-height: 1.5;">
                    Please enter your administrator passphrase to manage Hijaz collections & customer orders.
                </p>
            </div>

            <div style="width: 100%; display: flex; flex-direction: column; gap: 0.875rem;">
                <input type="password" id="pin-input" class="pin-input" placeholder="••••••••" autofocus>
                <p id="pin-error"
                    style="color: #ef4444; font-size: 0.82rem; font-weight: 600; margin: 0; display: none;">
                    Incorrect passphrase. Authentication failed.
                </p>
                <button id="btn-authenticate" class="btn-gold">
                    <i data-lucide="shield-check" style="width: 18px; height: 18px;"></i>
                    Authenticate
                </button>
            </div>
        </div>
    </div>

    <!-- ─── Admin Dashboard ─── -->
    <div id="admin-dashboard">
        <!-- Header -->
        <header class="admin-header">
            <div style="display: flex; align-items: center; gap: 1.25rem;">
                <a href="http://localhost:5173" target="_blank"
                    style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: white; display: flex; align-items: center; justify-content: center; text-decoration: none;"
                    title="Open Storefront">
                    <i data-lucide="external-link" style="width: 18px; height: 18px;"></i>
                </a>
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="shield-check" style="width: 18px; height: 18px; color: #d4af37;"></i>
                        <span style="color: white; font-weight: 800; font-size: 1.15rem; letter-spacing: -0.01em;">Hijaz
                            Admin</span>
                    </div>
                    <p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; margin: 0.15rem 0 0; font-weight: 500;">
                        Store Operations & Fulfillment
                    </p>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.875rem;">
                <!-- Lock Admin -->
                <button id="btn-lock-admin"
                    style="display: flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.7); cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="lock" style="width: 14px; height: 14px;"></i>
                    <span>Lock</span>
                </button>

                <!-- Clear All Products (only shown in products view) -->
                <button id="btn-reset-all"
                    style="display: flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.125rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
                    <span id="reset-text">Clear Products</span>
                </button>

                <!-- Add Product Button -->
                <button id="btn-add-product"
                    style="display: flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #7A4E2D, #9B6A45); color: white; cursor: pointer; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 16px rgba(122,78,45,0.22); transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                    Add Product
                </button>

                <!-- Refresh Orders Button -->
                <button id="btn-refresh-orders"
                    style="display: none; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border-radius: 10px; border: 1px solid rgba(212,175,55,0.3); background: rgba(212,175,55,0.1); color: #d4af37; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i>
                    Refresh Orders
                </button>

                <!-- Refresh Messages Button -->
                <button id="btn-refresh-messages"
                    style="display: none; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border-radius: 10px; border: 1px solid rgba(99,179,237,0.3); background: rgba(99,179,237,0.08); color: #63b3ed; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i>
                    Refresh Messages
                </button>

                <!-- Refresh Reviews Button -->
                <button id="btn-refresh-reviews"
                    style="display: none; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border-radius: 10px; border: 1px solid rgba(251,191,36,0.3); background: rgba(251,191,36,0.08); color: #fbbf24; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i>
                    Refresh Reviews
                </button>

                <!-- Add Coupon Button (shown in settings view) -->
                <button id="btn-add-coupon" onclick="openCouponModal()"
                    style="display: none; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #d4af37, #9B6A45); color: #0a0a0a; cursor: pointer; font-size: 0.85rem; font-weight: 800; box-shadow: 0 4px 16px rgba(212,175,55,0.25); transition: all 200ms ease; font-family: inherit;">
                    <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                    Add Coupon
                </button>
            </div>
        </header>

        <!-- Main Wrapper -->
        <div class="admin-main-wrapper">
            <!-- Sidebar -->
            <aside class="admin-sidebar">
                <!-- Orders Management section -->
                <p class="sidebar-section-title">Sales & Feedback</p>
                <button id="btn-sidebar-orders" class="sidebar-btn" onclick="switchToOrders()">
                    <span style="font-size: 1.25rem;">📦</span>
                    <span style="flex: 1; letter-spacing: -0.01em;">Customer Orders</span>
                    <span id="sidebar-orders-badge" class="sidebar-badge"
                        style="background: rgba(212,175,55,0.15); color: #d4af37;">0</span>
                </button>

                <!-- Reviews Section -->
                <button id="btn-sidebar-reviews" class="sidebar-btn" onclick="switchToReviews()"
                    style="margin-top: 0.35rem;">
                    <span style="font-size: 1.25rem;">⭐</span>
                    <span style="flex: 1; letter-spacing: -0.01em;">Customer Reviews</span>
                    <span id="sidebar-reviews-badge" class="sidebar-badge"
                        style="background: rgba(251,191,36,0.15); color: #fbbf24;">0</span>
                </button>

                <!-- Messages Section -->
                <button id="btn-sidebar-messages" class="sidebar-btn" onclick="switchToMessages()"
                    style="margin-top: 0.35rem;">
                    <span style="font-size: 1.25rem;">✉️</span>
                    <span style="flex: 1; letter-spacing: -0.01em;">Contact Messages</span>
                    <span id="sidebar-messages-badge" class="sidebar-badge"
                        style="background: rgba(99,179,237,0.15); color: #63b3ed;">0</span>
                </button>

                <!-- AI Intelligence Section -->
                <p class="sidebar-section-title" style="margin-top: 1.25rem;">Intelligence</p>
                <button id="btn-sidebar-ai" class="sidebar-btn" onclick="switchToAI()">
                    <span style="font-size: 1.25rem;">🤖</span>
                    <span style="flex: 1; letter-spacing: -0.01em;">AI Assistant</span>
                    <span id="sidebar-ai-badge" class="sidebar-badge"
                        style="background: rgba(168,85,247,0.2); color: #c084fc; font-weight: 800;">Copilot</span>
                </button>

                <!-- Store Operations & Settings Section -->
                <p class="sidebar-section-title" style="margin-top: 1.25rem;">Store Operations</p>
                <button id="btn-sidebar-settings" class="sidebar-btn" onclick="switchToSettings()">
                    <span style="font-size: 1.25rem;">⚙️</span>
                    <span style="flex: 1; letter-spacing: -0.01em;">Business Settings</span>
                    <span id="sidebar-coupons-badge" class="sidebar-badge"
                        style="background: rgba(212,175,55,0.15); color: #d4af37;">0</span>
                </button>

                <div style="height: 1px; background: rgba(255,255,255,0.06); margin: 1.25rem 1.5rem;"></div>

                <!-- Collections section -->
                <p class="sidebar-section-title">Collections</p>
                <div id="sidebar-categories"></div>
            </aside>

            <!-- Dashboard Content -->
            <main class="admin-content">
                <!-- ── Products View ── -->
                <div id="view-products">
                    <!-- Category Info Banner -->
                    <div class="category-banner" id="cat-banner">
                        <div id="banner-icon"
                            style="width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2.25rem;">
                        </div>
                        <div>
                            <h2 id="banner-title"
                                style="color: white; font-weight: 800; font-size: 1.25rem; margin: 0; letter-spacing: -0.01em;">
                            </h2>
                            <p id="banner-tagline"
                                style="color: rgba(255,255,255,0.45); font-size: 0.85rem; margin: 0.25rem 0 0; line-height: 1.4;">
                            </p>
                        </div>
                        <div style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center;">
                            <div style="text-align: right;">
                                <p id="cat-count"
                                    style="color: white; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Category</p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="total-count"
                                    style="color: rgba(255,255,255,0.5); font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Total</p>
                            </div>
                        </div>
                    </div>

                    <!-- Products List Container -->
                    <div id="products-list"></div>
                </div>

                <!-- ── Orders View ── -->
                <div id="view-orders" style="display: none;">
                    <!-- Orders KPI Banner -->
                    <div class="category-banner"
                        style="background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(155,106,69,0.08)); border-color: rgba(212,175,55,0.25);">
                        <div
                            style="width: 56px; height: 56px; border-radius: 16px; background: rgba(212,175,55,0.15); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                            📦
                        </div>
                        <div>
                            <h2
                                style="color: white; font-weight: 800; font-size: 1.35rem; margin: 0; letter-spacing: -0.01em;">
                                Customer Orders & Fulfillment
                            </h2>
                            <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0.25rem 0 0;">
                                Track and manage customer purchases, shipping details, and real-time fulfillment.
                            </p>
                        </div>
                        <div style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center;">
                            <div style="text-align: right;">
                                <p id="kpi-orders-count"
                                    style="color: white; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Total Orders</p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="kpi-revenue"
                                    style="color: #d4af37; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    ₹0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Total Revenue</p>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Tabs & Search Toolbar -->
                    <div
                        style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                        <!-- Status Tabs -->
                        <div
                            style="display: flex; gap: 0.4rem; background: rgba(255,255,255,0.03); padding: 0.3rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.06);">
                            <button class="orders-filter-btn active" data-filter="ALL"
                                onclick="setOrdersFilter('ALL')">All</button>
                            <button class="orders-filter-btn" data-filter="Processing"
                                onclick="setOrdersFilter('Processing')">Processing</button>
                            <button class="orders-filter-btn" data-filter="Shipped"
                                onclick="setOrdersFilter('Shipped')">Shipped</button>
                            <button class="orders-filter-btn" data-filter="Delivered"
                                onclick="setOrdersFilter('Delivered')">Delivered</button>
                            <button class="orders-filter-btn" data-filter="Cancelled"
                                onclick="setOrdersFilter('Cancelled')">Cancelled</button>
                        </div>

                        <!-- Live Search Input -->
                        <div style="position: relative; min-width: 280px;">
                            <i data-lucide="search"
                                style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: rgba(255,255,255,0.4);"></i>
                            <input type="text" id="orders-search" placeholder="Search by Order ID, Name, Email, City..."
                                oninput="handleOrdersSearch(this.value)"
                                style="width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-size: 0.85rem; outline: none; font-family: inherit;">
                        </div>
                    </div>

                    <!-- Orders List Container -->
                    <div id="orders-list"></div>
                </div>

                <!-- ── Messages View ── -->
                <div id="view-messages" style="display: none;">
                    <!-- Messages KPI Banner -->
                    <div class="category-banner"
                        style="background: linear-gradient(135deg, rgba(99,179,237,0.1), rgba(66,153,225,0.06)); border-color: rgba(99,179,237,0.2);">
                        <div
                            style="width: 56px; height: 56px; border-radius: 16px; background: rgba(99,179,237,0.12); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                            ✉️
                        </div>
                        <div>
                            <h2
                                style="color: white; font-weight: 800; font-size: 1.35rem; margin: 0; letter-spacing: -0.01em;">
                                Contact Messages
                            </h2>
                            <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0.25rem 0 0;">
                                Customer inquiries, wholesale requests, and support messages from the store homepage.
                            </p>
                        </div>
                        <div style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center;">
                            <div style="text-align: right;">
                                <p id="kpi-messages-total"
                                    style="color: white; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Total</p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="kpi-messages-unread"
                                    style="color: #63b3ed; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Unread</p>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Tabs & Search -->
                    <div
                        style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                        <div
                            style="display: flex; gap: 0.4rem; background: rgba(255,255,255,0.03); padding: 0.3rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.06);">
                            <button class="msg-filter-btn active" data-filter="ALL"
                                onclick="setMessagesFilter('ALL')">All</button>
                            <button class="msg-filter-btn" data-filter="unread"
                                onclick="setMessagesFilter('unread')">Unread</button>
                            <button class="msg-filter-btn" data-filter="read"
                                onclick="setMessagesFilter('read')">Read</button>
                            <button class="msg-filter-btn" data-filter="replied"
                                onclick="setMessagesFilter('replied')">Replied</button>
                        </div>
                        <div style="position: relative; min-width: 280px;">
                            <i data-lucide="search"
                                style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: rgba(255,255,255,0.4);"></i>
                            <input type="text" id="messages-search" placeholder="Search by name, email, or subject..."
                                oninput="handleMessagesSearch(this.value)"
                                style="width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-size: 0.85rem; outline: none; font-family: inherit;">
                        </div>
                    </div>

                    <!-- Messages List Container -->
                    <div id="messages-list"></div>
                </div>

                <!-- ── Customer Reviews View ── -->
                <div id="view-reviews" style="display: none;">
                    <!-- Reviews KPI Banner -->
                    <div class="category-banner"
                        style="background: linear-gradient(135deg, rgba(251,191,36,0.1), rgba(212,175,55,0.06)); border-color: rgba(251,191,36,0.25);">
                        <div
                            style="width: 56px; height: 56px; border-radius: 16px; background: rgba(251,191,36,0.15); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                            ⭐
                        </div>
                        <div>
                            <h2
                                style="color: white; font-weight: 800; font-size: 1.35rem; margin: 0; letter-spacing: -0.01em;">
                                Customer Reviews & Ratings
                            </h2>
                            <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0.25rem 0 0;">
                                Real-time customer ratings, sentiment analysis, verified buyer feedback, and moderation.
                            </p>
                        </div>
                        <div style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center;">
                            <div style="text-align: right;">
                                <p id="kpi-reviews-total"
                                    style="color: white; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Total Reviews</p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="kpi-reviews-avg"
                                    style="color: #fbbf24; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    5.0 ★</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Avg Rating</p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="kpi-reviews-positive"
                                    style="color: #86efac; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    100%</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Positive</p>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Tabs & Search Toolbar -->
                    <div
                        style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                        <!-- Rating Filter Tabs -->
                        <div
                            style="display: flex; gap: 0.4rem; background: rgba(255,255,255,0.03); padding: 0.3rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap;">
                            <button class="review-filter-btn active" data-filter="ALL"
                                onclick="setReviewsFilter('ALL')">All</button>
                            <button class="review-filter-btn" data-filter="5" onclick="setReviewsFilter('5')">5
                                ★</button>
                            <button class="review-filter-btn" data-filter="4" onclick="setReviewsFilter('4')">4
                                ★</button>
                            <button class="review-filter-btn" data-filter="3" onclick="setReviewsFilter('3')">3
                                ★</button>
                            <button class="review-filter-btn" data-filter="2" onclick="setReviewsFilter('2')">2
                                ★</button>
                            <button class="review-filter-btn" data-filter="1" onclick="setReviewsFilter('1')">1
                                ★</button>
                        </div>

                        <!-- Live Search Input -->
                        <div style="position: relative; min-width: 280px;">
                            <i data-lucide="search"
                                style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: rgba(255,255,255,0.4);"></i>
                            <input type="text" id="reviews-search"
                                placeholder="Search by customer, email, product, comment..."
                                oninput="handleReviewsSearch(this.value)"
                                style="width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-size: 0.85rem; outline: none; font-family: inherit;">
                        </div>
                    </div>

                    <!-- Reviews List Container -->
                    <div id="reviews-list"></div>
                </div>

                <!-- ── AI Assistant View ── -->
                <div id="view-ai" style="display: none;">
                    <!-- AI Executive Banner -->
                    <div class="category-banner"
                        style="background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(126,34,206,0.06)); border-color: rgba(168,85,247,0.25);">
                        <div
                            style="width: 56px; height: 56px; border-radius: 16px; background: rgba(168,85,247,0.18); display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 25px rgba(168,85,247,0.2);">
                            🤖
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                                <h2
                                    style="color: white; font-weight: 800; font-size: 1.35rem; margin: 0; letter-spacing: -0.01em;">
                                    Executive AI Assistant
                                </h2>
                                <span
                                    style="font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 999px; background: rgba(168,85,247,0.2); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.4); text-transform: uppercase; letter-spacing: 0.05em;">
                                    Verified Data Guardrails
                                </span>
                            </div>
                            <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0.25rem 0 0;">
                                Real-time store analytics, sales forecasting, inventory intelligence, review sentiment,
                                and product SEO generation.
                            </p>
                        </div>
                        <div style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center;">
                            <div style="text-align: right;">
                                <p id="ai-kpi-revenue"
                                    style="color: #d4af37; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    ₹0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Total Revenue</p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="ai-kpi-stock-alerts"
                                    style="color: #f87171; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0</p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Restock Alerts</p>
                            </div>
                        </div>
                    </div>

                    <!-- AI Suggested Questions Toolbar -->
                    <div style="margin-bottom: 1.25rem;">
                        <p
                            style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
                            <i data-lucide="sparkles" style="width: 13px; height: 13px; color: #c084fc;"></i> Suggested
                            Inquiries:
                        </p>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="ai-prompt-pill"
                                onclick="askAIPrompt('What are my best-selling products?')">🏆 Best-Selling
                                Products</button>
                            <button class="ai-prompt-pill" onclick="askAIPrompt('Which products have low stock?')">⚠️
                                Low Stock Alerts</button>
                            <button class="ai-prompt-pill" onclick="askAIPrompt('What was my revenue this month?')">💰
                                This Month Revenue</button>
                            <button class="ai-prompt-pill"
                                onclick="askAIPrompt('Compare this month sales with last month')">📈 Compare with Last
                                Month</button>
                            <button class="ai-prompt-pill"
                                onclick="askAIPrompt('What are customers complaining about?')">⭐ Review Complaints &
                                Sentiment</button>
                            <button class="ai-prompt-pill" onclick="askAIPrompt('Which products should I promote?')">🚀
                                Promotional Opportunities</button>
                        </div>
                    </div>

                    <!-- AI Workspace Grid (Chat + Studio) -->
                    <div
                        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem; align-items: start;">
                        <!-- Left: Interactive Chat Assistant -->
                        <div
                            style="background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; display: flex; flex-direction: column; height: 680px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.4);">
                            <!-- Chat Header -->
                            <div
                                style="padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                                <div style="display: flex; align-items: center; gap: 0.6rem;">
                                    <span
                                        style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 10px #4ade80;"></span>
                                    <span style="color: white; font-weight: 700; font-size: 0.92rem;">Store Intelligence
                                        Copilot</span>
                                </div>
                                <button onclick="clearAIChat()"
                                    style="background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;"
                                    onmouseover="this.style.color='#f87171'"
                                    onmouseout="this.style.color='rgba(255,255,255,0.4)'">
                                    <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i> Clear Chat
                                </button>
                            </div>

                            <!-- Chat Stream -->
                            <div id="ai-chat-messages"
                                style="flex: 1; padding: 1.25rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
                                <!-- Initial Greeting -->
                                <div class="ai-msg-bubble assistant">
                                    <div class="ai-msg-avatar">🤖</div>
                                    <div class="ai-msg-body">
                                        <p style="font-weight: 700; margin-bottom: 0.4rem; color: #c084fc;">Salam Admin!
                                            I am your AI Store Copilot.</p>
                                        <p style="margin: 0; line-height: 1.5;">I have real-time access to your store
                                            orders, product catalog, inventory depletion rates, and customer reviews.
                                            Ask me anything or tap one of the suggested inquiries above.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Chat Input Box -->
                            <form id="ai-chat-form" onsubmit="handleAIChatSubmit(event)"
                                style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.015); display: flex; gap: 0.6rem;">
                                <input type="text" id="ai-chat-input"
                                    placeholder="Ask AI anything about sales, products, stock, reviews..."
                                    style="flex: 1; padding: 0.75rem 1rem; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; font-size: 0.88rem; outline: none; transition: border-color 0.2s; font-family: inherit;"
                                    onfocus="this.style.borderColor='#a855f7'"
                                    onblur="this.style.borderColor='rgba(255,255,255,0.08)'">
                                <button type="submit" id="btn-send-ai-chat"
                                    style="padding: 0.75rem 1.25rem; border-radius: 12px; border: none; background: linear-gradient(135deg, #9333ea, #a855f7); color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 15px rgba(168,85,247,0.3); font-family: inherit;">
                                    <i data-lucide="send" style="width: 15px; height: 15px;"></i>
                                    <span>Send</span>
                                </button>
                            </form>
                        </div>

                        <!-- Right: AI Studio & Telemetry Hub -->
                        <div
                            style="background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.25rem; height: 680px; overflow-y: auto; display: flex; flex-direction: column;">
                            <!-- Studio Tabs -->
                            <div
                                style="display: flex; gap: 0.4rem; background: rgba(255,255,255,0.03); padding: 0.3rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 1.25rem;">
                                <button class="ai-studio-tab active" onclick="switchAIStudioTab('generator', this)">✨
                                    Content Studio</button>
                                <button class="ai-studio-tab" onclick="switchAIStudioTab('inventory', this)">📦 Stock
                                    Radar</button>
                                <button class="ai-studio-tab" onclick="switchAIStudioTab('reviews', this)">⭐
                                    Sentiment</button>
                            </div>

                            <!-- Tab 1: Product Generator -->
                            <div id="ai-tab-generator" class="ai-studio-panel">
                                <h3 style="color: white; font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem 0;">AI
                                    Product Content & SEO Studio</h3>
                                <p
                                    style="font-size: 0.78rem; color: rgba(255,255,255,0.45); margin-bottom: 1rem; line-height: 1.4;">
                                    Generate titles, descriptions, and SEO metadata. Content requires explicit admin
                                    approval before saving.
                                </p>

                                <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                                    <div>
                                        <label
                                            style="font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; display: block; margin-bottom: 0.35rem;">Select
                                            Existing Product</label>
                                        <select id="ai-product-select" onchange="onAIProductSelected(this.value)"
                                            style="width: 100%; padding: 0.65rem 0.85rem; background: #141414; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; font-size: 0.85rem; outline: none; font-family: inherit;">
                                            <option value="">-- Or enter custom item name below --</option>
                                        </select>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                        <div>
                                            <label
                                                style="font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; display: block; margin-bottom: 0.35rem;">Item
                                                Name</label>
                                            <input type="text" id="ai-gen-name" placeholder="e.g. Royal Taif Rose"
                                                style="width: 100%; padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; font-size: 0.85rem; outline: none; font-family: inherit;">
                                        </div>
                                        <div>
                                            <label
                                                style="font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; display: block; margin-bottom: 0.35rem;">Category</label>
                                            <select id="ai-gen-category"
                                                style="width: 100%; padding: 0.65rem 0.85rem; background: #141414; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; font-size: 0.85rem; outline: none; font-family: inherit;">
                                                <option value="pillows">Luxury Pillows</option>
                                                <option value="bedding">Bedding & Sleep</option>
                                                <option value="bath">Bath & Towels Collection</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button type="button" onclick="generateAIProductContent()"
                                        id="btn-generate-ai-content"
                                        style="padding: 0.75rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #d4af37, #9B6A45); color: #000; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em; font-family: inherit;">
                                        <i data-lucide="sparkles" style="width: 15px; height: 15px;"></i>
                                        Generate with AI
                                    </button>

                                    <!-- Generated Preview Card -->
                                    <div id="ai-gen-preview"
                                        style="display: none; margin-top: 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 1rem;">
                                        <p
                                            style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #d4af37; letter-spacing: 0.08em; margin-bottom: 0.4rem;">
                                            AI Generated Output (Review & Approve):</p>

                                        <div style="margin-bottom: 0.6rem;">
                                            <span
                                                style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">Title:</span>
                                            <input type="text" id="ai-preview-title"
                                                style="width: 100%; padding: 0.45rem 0.65rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 0.82rem; margin-top: 0.2rem; font-weight: 700;">
                                        </div>

                                        <div style="margin-bottom: 0.6rem;">
                                            <span
                                                style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">Subtitle:</span>
                                            <input type="text" id="ai-preview-subtitle"
                                                style="width: 100%; padding: 0.45rem 0.65rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 0.82rem; margin-top: 0.2rem;">
                                        </div>

                                        <div style="margin-bottom: 0.6rem;">
                                            <span
                                                style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">Description:</span>
                                            <textarea id="ai-preview-desc" rows="3"
                                                style="width: 100%; padding: 0.45rem 0.65rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 0.8rem; margin-top: 0.2rem; resize: vertical;"></textarea>
                                        </div>

                                        <div style="margin-bottom: 0.6rem;">
                                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">SEO
                                                Title:</span>
                                            <input type="text" id="ai-preview-seo-title"
                                                style="width: 100%; padding: 0.45rem 0.65rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #93c5fd; font-size: 0.78rem; margin-top: 0.2rem;">
                                        </div>

                                        <button type="button" onclick="applyApprovedAIContent()"
                                            id="btn-approve-ai-content"
                                            style="width: 100%; margin-top: 0.4rem; padding: 0.65rem; border-radius: 8px; border: none; background: #16a34a; color: white; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                                            <i data-lucide="check-circle" style="width: 15px; height: 15px;"></i>
                                            Approve &amp; Apply to Store
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Tab 2: Stock Radar -->
                            <div id="ai-tab-inventory" class="ai-studio-panel" style="display: none;">
                                <h3 style="color: white; font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem 0;">
                                    Inventory Depletion Radar</h3>
                                <p style="font-size: 0.78rem; color: rgba(255,255,255,0.45); margin-bottom: 1rem;">
                                    Real-time tracking of critical stock levels and AI replenishment recommendations.
                                </p>
                                <div id="ai-inventory-radar-list"
                                    style="display: flex; flex-direction: column; gap: 0.6rem;">
                                    <p style="font-size: 0.82rem; color: rgba(255,255,255,0.3);">Loading inventory
                                        data...</p>
                                </div>
                            </div>

                            <!-- Tab 3: Reviews Sentiment -->
                            <div id="ai-tab-reviews" class="ai-studio-panel" style="display: none;">
                                <h3 style="color: white; font-size: 1.05rem; font-weight: 700; margin: 0 0 0.4rem 0;">
                                    Customer Feedback Intelligence</h3>
                                <p style="font-size: 0.78rem; color: rgba(255,255,255,0.45); margin-bottom: 1rem;">
                                    Verified sentiment analysis and common customer praises/complaints.
                                </p>
                                <div id="ai-reviews-radar-list"
                                    style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <p style="font-size: 0.82rem; color: rgba(255,255,255,0.3);">Loading review
                                        sentiment...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Business Settings & Coupons View ── -->
                <div id="view-settings" style="display: none;">
                    <!-- Settings Banner -->
                    <div class="category-banner"
                        style="background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(155,106,69,0.1)); border-color: rgba(212,175,55,0.25);">
                        <div
                            style="width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2.25rem; background: rgba(212,175,55,0.2);">
                            ⚙️
                        </div>
                        <div>
                            <h2
                                style="color: white; font-weight: 800; font-size: 1.25rem; margin: 0; letter-spacing: -0.01em;">
                                Business Settings &amp; Promotions
                            </h2>
                            <p
                                style="color: rgba(255,255,255,0.45); font-size: 0.85rem; margin: 0.25rem 0 0; line-height: 1.4;">
                                Control global express delivery charges, free shipping rules, coupon vouchers, and store
                                discounts.
                            </p>
                        </div>
                        <div
                            style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                            <div style="text-align: right;">
                                <p id="kpi-shipping-fee"
                                    style="color: #d4af37; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    ₹99
                                </p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Shipping Fee
                                </p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="kpi-free-shipping"
                                    style="color: #86efac; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    ₹999
                                </p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Free Delivery Above
                                </p>
                            </div>
                            <div style="width: 1px; height: 32px; background: rgba(255,255,255,0.08);"></div>
                            <div style="text-align: right;">
                                <p id="kpi-coupons-count"
                                    style="color: white; font-weight: 800; font-size: 1.75rem; margin: 0; line-height: 1;">
                                    0
                                </p>
                                <p
                                    style="color: rgba(255,255,255,0.35); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.3rem 0 0;">
                                    Coupons Active
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Main Grid: 2 Columns (Shipping & Policies vs Coupon Management) -->
                    <div
                        style="display: grid; grid-template-columns: minmax(360px, 440px) 1fr; gap: 2rem; align-items: flex-start;">

                        <!-- Column 1: Shipping & Delivery Configuration -->
                        <div
                            style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 22px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 0.65rem;">
                                    <div
                                        style="width: 36px; height: 36px; border-radius: 10px; background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.3); display: flex; align-items: center; justify-content: center; color: #d4af37;">
                                        <i data-lucide="truck" style="width: 18px; height: 18px;"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.05rem; font-weight: 800; color: white; margin: 0;">
                                            Shipping &amp; Policies</h3>
                                        <p
                                            style="font-size: 0.75rem; color: rgba(255,255,255,0.4); margin: 0.15rem 0 0;">
                                            Customer delivery rates &amp; criteria</p>
                                    </div>
                                </div>
                                <span class="sidebar-badge"
                                    style="background: rgba(212,175,55,0.15); color: #d4af37;">Global Rule</span>
                            </div>

                            <form id="business-settings-form" onsubmit="saveBusinessSettings(event)"
                                style="display: flex; flex-direction: column; gap: 1.15rem;">
                                <!-- Standard Shipping Fee -->
                                <div>
                                    <label class="form-label">Standard Shipping Fee (₹) *</label>
                                    <div style="position: relative;">
                                        <span
                                            style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); font-weight: 700;">₹</span>
                                        <input type="number" step="1" min="0" id="setting-shipping-fee"
                                            class="form-input" style="padding-left: 2.25rem;" required>
                                    </div>
                                    <p style="font-size: 0.7rem; color: rgba(255,255,255,0.35); margin: 0.25rem 0 0;">
                                        Charged on all standard orders below the free threshold.</p>
                                </div>

                                <!-- Free Delivery Toggle & Threshold -->
                                <div
                                    style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem;">
                                    <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;">
                                        <input type="checkbox" id="setting-free-shipping-enabled"
                                            style="accent-color: #d4af37; width: 17px; height: 17px;">
                                        <span style="font-size: 0.85rem; font-weight: 700; color: white;">Enable Free
                                            Delivery Rule</span>
                                    </label>

                                    <div>
                                        <label class="form-label" style="margin-bottom: 0.3rem;">Free Delivery Order
                                            Threshold (₹) *</label>
                                        <div style="position: relative;">
                                            <span
                                                style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); font-weight: 700;">₹</span>
                                            <input type="number" step="1" min="0" id="setting-free-threshold"
                                                class="form-input" style="padding-left: 2.25rem;" required>
                                        </div>
                                        <p style="font-size: 0.7rem; color: #86efac; margin: 0.25rem 0 0;">Customers get
                                            100% Free Shipping on cart total ≥ this amount.</p>
                                    </div>
                                </div>

                                <!-- Estimated Delivery Duration -->
                                <div>
                                    <label class="form-label">Estimated Delivery Timeline</label>
                                    <input type="text" id="setting-delivery-days" class="form-input"
                                        placeholder="e.g. 2 - 4 Business Days">
                                </div>

                                <!-- Business Name -->
                                <div>
                                    <label class="form-label">Storefront Business Name</label>
                                    <input type="text" id="setting-business-name" class="form-input"
                                        placeholder="HIJAZ Luxury Fragrances">
                                </div>

                                <!-- Support Contact -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                    <div>
                                        <label class="form-label">Support Email</label>
                                        <input type="email" id="setting-support-email" class="form-input"
                                            placeholder="care@hijazperfumes.com">
                                    </div>
                                    <div>
                                        <label class="form-label">Support Phone</label>
                                        <input type="text" id="setting-support-phone" class="form-input"
                                            placeholder="+91 98765 43210">
                                    </div>
                                </div>

                                <button type="submit" id="btn-save-settings" class="btn-gold"
                                    style="margin-top: 0.5rem;">
                                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                                    Save Business Settings
                                </button>
                            </form>
                        </div>

                        <!-- Column 2: Coupon Codes & Promotional Discounts -->
                        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                            <!-- Header & Filters -->
                            <div
                                style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div
                                        style="width: 36px; height: 36px; border-radius: 10px; background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.3); display: flex; align-items: center; justify-content: center; color: #d4af37;">
                                        <i data-lucide="tag" style="width: 18px; height: 18px;"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.05rem; font-weight: 800; color: white; margin: 0;">
                                            Coupons &amp; Promo Codes</h3>
                                        <p
                                            style="font-size: 0.75rem; color: rgba(255,255,255,0.4); margin: 0.15rem 0 0;">
                                            Manage discount vouchers available at checkout</p>
                                    </div>
                                </div>

                                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                                    <!-- Filter pills -->
                                    <div
                                        style="display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 999px; padding: 3px;">
                                        <button class="coupon-filter-btn active" data-filter="ALL"
                                            onclick="setCouponsFilter('ALL')">All</button>
                                        <button class="coupon-filter-btn" data-filter="ACTIVE"
                                            onclick="setCouponsFilter('ACTIVE')">Active</button>
                                        <button class="coupon-filter-btn" data-filter="INACTIVE"
                                            onclick="setCouponsFilter('INACTIVE')">Inactive</button>
                                    </div>

                                    <!-- Search input -->
                                    <div style="position: relative; width: 170px;">
                                        <input type="text" placeholder="Search coupons..."
                                            oninput="handleCouponsSearch(this.value)"
                                            style="width: 100%; padding: 0.45rem 0.85rem 0.45rem 2rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; color: white; font-size: 0.78rem; outline: none; font-family: inherit;">
                                        <i data-lucide="search"
                                            style="width: 12px; height: 12px; position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4);"></i>
                                    </div>

                                    <!-- Create Coupon Button -->
                                    <button type="button" onclick="openCouponModal()"
                                        style="display: flex; align-items: center; gap: 0.35rem; padding: 0.55rem 1rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #d4af37, #9B6A45); color: #0a0a0a; font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: all 180ms ease; font-family: inherit;">
                                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                                        New Coupon
                                    </button>
                                </div>
                            </div>

                            <!-- Coupons List Container -->
                            <div id="coupons-list" style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- ─── Product Form Modal ─── -->
    <div id="product-modal">
        <div class="modal-card">
            <!-- Modal Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                <div>
                    <h2 id="modal-title"
                        style="color: white; font-size: 1.5rem; font-weight: 800; margin: 0; letter-spacing: -0.01em;">
                        Add New Product
                    </h2>
                    <p id="modal-category-label"
                        style="color: rgba(255, 255, 255, 0.45); font-size: 0.82rem; margin: 0.35rem 0 0; display: flex; align-items: center; gap: 0.35rem;">
                    </p>
                </div>
                <button id="btn-close-modal" class="icon-btn" style="border-radius: 50%;">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
            </div>

            <!-- Form Body -->
            <form id="product-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <input type="hidden" id="form-edit-id">

                <!-- Image Uploader -->
                <div>
                    <label class="form-label">Product Image</label>
                    <div id="drop-zone" class="drop-zone">
                        <input type="file" id="file-input" accept="image/*" style="display: none;">
                        <div id="upload-prompt"
                            style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                            <div
                                style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6);">
                                <i data-lucide="upload" style="width: 20px; height: 20px;"></i>
                            </div>
                            <p style="font-size: 0.85rem; color: white; font-weight: 600;">Drag & drop image here, or
                                click to browse</p>
                            <p style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">PNG, JPG, WEBP up to 10MB</p>
                        </div>
                        <div id="preview-wrapper"
                            style="display: none; position: relative; align-items: center; justify-content: center;">
                            <img id="image-preview"
                                style="max-height: 120px; border-radius: 10px; object-fit: contain;">
                            <button type="button" id="btn-remove-image"
                                style="position: absolute; top: -8px; right: 10px; background: rgba(239,68,68,0.9); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Category Selector -->
                <div>
                    <label class="form-label">Category *</label>
                    <select id="form-category" class="form-input" style="background: #141414; cursor: pointer;"
                        required onchange="toggleBeddingSizeGroup()">
                        <option value="pillows">☁️ Luxury Pillows</option>
                        <option value="bedding">🛏️ Bedding & Sleep</option>
                        <option value="bath">🛁 Bath & Towels Collection</option>
                    </select>
                </div>

                <!-- Product Name -->
                <!-- Bedding Size Selector (shown only when category = bedding) -->
                <div id="bedding-size-group" style="display: none;">
                    <label class="form-label">&#x1F6CF;&#xFE0F; Bedding Size *</label>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.5rem;">
                        <label id="bedding-opt-king" style="cursor: pointer; padding: 0.85rem 0.75rem; border-radius: 12px; border: 1.5px solid #d4af37; background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(122,78,45,0.12)); display: flex; flex-direction: column; align-items: center; gap: 0.3rem; transition: all 200ms ease;">
                            <input type="radio" name="bedding_type" id="bedding-king" value="king" style="display:none;" checked>
                            <span style="font-size: 1.2rem;">&#128081;</span>
                            <span style="font-size: 0.82rem; font-weight: 800; color: #d4af37;">King</span>
                            <span style="font-size: 0.67rem; color: rgba(255,255,255,0.45); text-align:center;">Extra spacious</span>
                        </label>
                        <label id="bedding-opt-queen" style="cursor: pointer; padding: 0.85rem 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); display: flex; flex-direction: column; align-items: center; gap: 0.3rem; transition: all 200ms ease;">
                            <input type="radio" name="bedding_type" id="bedding-queen" value="queen" style="display:none;">
                            <span style="font-size: 1.2rem;">&#10024;</span>
                            <span style="font-size: 0.82rem; font-weight: 800; color: white;">Queen</span>
                            <span style="font-size: 0.67rem; color: rgba(255,255,255,0.45); text-align:center;">Most popular</span>
                        </label>
                        <label id="bedding-opt-single" style="cursor: pointer; padding: 0.85rem 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); display: flex; flex-direction: column; align-items: center; gap: 0.3rem; transition: all 200ms ease;">
                            <input type="radio" name="bedding_type" id="bedding-single" value="single" style="display:none;">
                            <span style="font-size: 1.2rem;">&#127769;</span>
                            <span style="font-size: 0.82rem; font-weight: 800; color: white;">Single</span>
                            <span style="font-size: 0.67rem; color: rgba(255,255,255,0.45); text-align:center;">Compact cozy</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label class="form-label">Product Name *</label>
                    <input type="text" id="form-name" class="form-input" placeholder="e.g. Royal Cloud Pillow" required>
                </div>

                <!-- Subtitle & Badge -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Subtitle</label>
                        <input type="text" id="form-subtitle" class="form-input" placeholder="e.g. Aged 25 Years">
                    </div>
                    <div>
                        <label class="form-label">Badge Label</label>
                        <input type="text" id="form-badge" class="form-input" placeholder="e.g. Best Seller / New">
                    </div>
                </div>

                <!-- Price & Original Price -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Selling Price (₹) *</label>
                        <input type="number" step="0.01" id="form-price" class="form-input" placeholder="8999" required>
                    </div>
                    <div>
                        <label class="form-label">Original Price (₹)</label>
                        <input type="number" step="0.01" id="form-original-price" class="form-input"
                            placeholder="12000">
                    </div>
                </div>

                <!-- Rating & Reviews -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Rating (0 - 5)</label>
                        <input type="number" step="0.1" min="0" max="5" id="form-rating" class="form-input" value="4.5">
                    </div>
                    <div>
                        <label class="form-label">Review Count</label>
                        <input type="number" id="form-reviews" class="form-input" value="0">
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <label class="form-label">Description</label>
                    <textarea id="form-description" class="form-input" rows="3"
                        placeholder="Enter detailed product description..." style="resize: vertical;"></textarea>
                </div>

                <!-- ─── Extra Gallery Images ─── -->
                <div style="border-top: 1px solid rgba(255,255,255,0.07); padding-top: 1.25rem;">
                    <label class="form-label" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                        <i data-lucide="images" style="width: 15px; height: 15px; color: #d4af37;"></i>
                        Gallery Images
                        <span style="font-size:0.7rem; color:rgba(255,255,255,0.35); font-weight:500; margin-left:auto;">Add extra product photos (shown in detail view)</span>
                    </label>
                    <div id="gallery-inputs-list" style="display:flex; flex-direction:column; gap:0.6rem;"></div>
                    <button type="button" onclick="addGalleryInput()"
                        style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.55); font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit; width: 100%; justify-content: center; transition: all 180ms;">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        Add Gallery Image URL
                    </button>
                </div>

                <!-- ─── Thumbnail Selector ─── -->
                <div>
                    <label class="form-label" style="display: flex; align-items: center; gap: 0.4rem;">
                        <i data-lucide="image" style="width: 15px; height: 15px; color: #d4af37;"></i>
                        Primary Thumbnail URL
                        <span style="font-size:0.7rem; color:rgba(255,255,255,0.35); font-weight:500; margin-left:auto;">Main image shown to customers on catalog</span>
                    </label>
                    <input type="text" id="form-thumbnail" class="form-input"
                        placeholder="https://... (leave blank to use uploaded image above)">
                </div>

                <!-- ─── Instagram / YouTube Embed Links ─── -->
                <div style="border-top: 1px solid rgba(255,255,255,0.07); padding-top: 1.25rem;">
                    <label class="form-label" style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                        <i data-lucide="film" style="width: 15px; height: 15px; color: #c084fc;"></i>
                        Reel / Video Embed URLs
                        <span style="font-size:0.7rem; color:rgba(255,255,255,0.35); font-weight:500; margin-left:auto;">Instagram Reels or YouTube (shown in product detail)</span>
                    </label>
                    <div id="embed-inputs-list" style="display:flex; flex-direction:column; gap:0.6rem;"></div>
                    <button type="button" onclick="addEmbedInput()"
                        style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; border: 1px dashed rgba(168,85,247,0.3); background: rgba(168,85,247,0.04); color: #c084fc; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit; width: 100%; justify-content: center; transition: all 180ms;">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        Add Embed URL
                    </button>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="btn-submit-form" class="btn-gold"
                    style="margin-top: 0.5rem; text-transform: none;">
                    <i data-lucide="check" style="width: 18px; height: 18px;"></i>
                    <span id="submit-text">Create Product</span>
                </button>
            </form>
        </div>
    </div>

    <!-- ─── Coupon Form Modal ─── -->
    <div id="coupon-modal">
        <div class="modal-card">
            <!-- Modal Header -->
            <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.75rem;">
                <div>
                    <h2 id="coupon-modal-title"
                        style="color: white; font-size: 1.4rem; font-weight: 800; margin: 0; letter-spacing: -0.01em;">
                        Create Coupon Code
                    </h2>
                    <p style="color: rgba(255, 255, 255, 0.45); font-size: 0.8rem; margin: 0.25rem 0 0;">
                        Configure discount rate, minimum order criteria, and limits.
                    </p>
                </div>
                <button type="button" onclick="closeCouponModal()" class="icon-btn" style="border-radius: 50%;">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
            </div>

            <!-- Form Body -->
            <form id="coupon-form" onsubmit="saveCoupon(event)"
                style="display: flex; flex-direction: column; gap: 1.15rem;">
                <input type="hidden" id="coupon-edit-id">

                <!-- Code & Type -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Coupon Code *</label>
                        <input type="text" id="coupon-code" class="form-input" placeholder="e.g. FESTIVE20" required
                            style="text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">
                    </div>
                    <div>
                        <label class="form-label">Discount Type *</label>
                        <select id="coupon-type" class="form-input" style="background: #141414; cursor: pointer;">
                            <option value="percent">Percentage (%) Off</option>
                            <option value="fixed">Flat Fixed Amount (₹) Off</option>
                        </select>
                    </div>
                </div>

                <!-- Discount Value & Min Order -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Discount Value *</label>
                        <input type="number" step="0.01" min="0.01" id="coupon-value" class="form-input"
                            placeholder="e.g. 15 for 15% or 200 for ₹200" required>
                    </div>
                    <div>
                        <label class="form-label">Min. Order Amount (₹)</label>
                        <input type="number" step="1" min="0" id="coupon-min-order" class="form-input"
                            placeholder="0 (No minimum)">
                    </div>
                </div>

                <!-- Max Cap & Usage Limit -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label class="form-label">Max Discount Cap (₹)</label>
                        <input type="number" step="1" min="0" id="coupon-max-discount" class="form-input"
                            placeholder="Leave empty for unlimited">
                        <span style="font-size: 0.68rem; color: rgba(255,255,255,0.35);">Applicable only to %
                            discounts</span>
                    </div>
                    <div>
                        <label class="form-label">Total Usage Limit</label>
                        <input type="number" step="1" min="1" id="coupon-usage-limit" class="form-input"
                            placeholder="Leave empty for unlimited">
                    </div>
                </div>

                <!-- Expiry Date -->
                <div>
                    <label class="form-label">Expiry Date</label>
                    <input type="date" id="coupon-expiry" class="form-input" style="color-scheme: dark;">
                </div>

                <!-- Description -->
                <div>
                    <label class="form-label">Public Description / Tagline</label>
                    <input type="text" id="coupon-description" class="form-input"
                        placeholder="e.g. 15% Festive discount on royal attars">
                </div>

                <!-- Active Toggle -->
                <div
                    style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.85rem 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;">
                        <input type="checkbox" id="coupon-is-active" checked
                            style="accent-color: #d4af37; width: 17px; height: 17px;">
                        <div>
                            <span style="font-size: 0.85rem; font-weight: 700; color: white; display: block;">Active
                                Immediately</span>
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.4);">Users can redeem this coupon
                                code at checkout</span>
                        </div>
                    </label>
                </div>

                <!-- Modal Actions -->
                <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
                    <button type="button" onclick="closeCouponModal()" class="icon-btn"
                        style="flex: 1; width: auto; height: 46px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;">
                        Cancel
                    </button>
                    <button type="submit" id="btn-save-coupon" class="btn-gold"
                        style="flex: 2; height: 46px; border-radius: 12px; padding: 0;">
                        Save Coupon
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ─── Toast Feedback Notification ─── -->
    <div id="admin-toast">
        <i data-lucide="check-circle" style="width: 18px; height: 18px; color: #86efac;"></i>
        <span id="toast-message">Action successful</span>
    </div>

    <style>
        .orders-filter-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.55);
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            cursor: pointer;
            transition: all 180ms ease;
            font-family: inherit;
        }

        .orders-filter-btn:hover {
            color: white;
        }

        .orders-filter-btn.active {
            background: rgba(212, 175, 55, 0.18);
            color: #d4af37;
        }

        /* ─── Message Filter Buttons ─── */
        .msg-filter-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.55);
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            cursor: pointer;
            transition: all 180ms ease;
            font-family: inherit;
        }

        .msg-filter-btn:hover {
            color: white;
        }

        .msg-filter-btn.active {
            background: rgba(99, 179, 237, 0.2);
            color: #63b3ed;
        }

        /* ─── Message Cards ─── */
        .message-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 18px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: border-color 200ms ease;
        }

        .message-card:hover {
            border-color: rgba(99, 179, 237, 0.25);
        }

        .message-card.unread {
            border-left: 3px solid #63b3ed;
        }

        /* ─── Review Filter Buttons ─── */
        .review-filter-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.55);
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            cursor: pointer;
            transition: all 180ms ease;
            font-family: inherit;
        }

        .review-filter-btn:hover {
            color: white;
        }

        .review-filter-btn.active {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
        }

        /* ─── Review Cards ─── */
        .review-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 18px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 200ms ease;
        }

        .review-card:hover {
            background: rgba(255, 255, 255, 0.035);
            border-color: rgba(251, 191, 36, 0.25);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        /* ─── AI Assistant Styles ─── */
        .ai-prompt-pill {
            background: rgba(168, 85, 247, 0.08);
            border: 1px solid rgba(168, 85, 247, 0.25);
            color: #d8b4fe;
            padding: 0.4rem 0.85rem;
            border-radius: 999px;
            font-size: 0.76rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        }

        .ai-prompt-pill:hover {
            background: rgba(168, 85, 247, 0.2);
            border-color: rgba(168, 85, 247, 0.5);
            color: #fff;
            transform: translateY(-1px);
        }

        .ai-msg-bubble {
            display: flex;
            gap: 0.75rem;
            max-width: 88%;
            animation: toastFadeIn 0.25s ease-out;
        }

        .ai-msg-bubble.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }

        .ai-msg-bubble.assistant {
            align-self: flex-start;
        }

        .ai-msg-avatar {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .ai-msg-bubble.user .ai-msg-avatar {
            background: rgba(212, 175, 55, 0.2);
            border: 1px solid rgba(212, 175, 55, 0.4);
            color: #d4af37;
        }

        .ai-msg-bubble.assistant .ai-msg-avatar {
            background: rgba(168, 85, 247, 0.2);
            border: 1px solid rgba(168, 85, 247, 0.4);
            color: #c084fc;
        }

        .ai-msg-body {
            padding: 0.85rem 1.15rem;
            border-radius: 14px;
            font-size: 0.86rem;
            line-height: 1.6;
        }

        .ai-msg-bubble.user .ai-msg-body {
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(168, 85, 247, 0.2));
            border: 1px solid rgba(168, 85, 247, 0.35);
            color: #ffffff;
            border-top-right-radius: 4px;
        }

        .ai-msg-bubble.assistant .ai-msg-body {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.9);
            border-top-left-radius: 4px;
        }

        .ai-msg-body p {
            margin-bottom: 0.5rem;
        }

        .ai-msg-body p:last-child {
            margin-bottom: 0;
        }

        .ai-msg-body ul {
            margin-left: 1.25rem;
            margin-bottom: 0.5rem;
        }

        .ai-studio-tab {
            flex: 1;
            padding: 0.55rem 0.75rem;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.78rem;
            font-weight: 700;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .ai-studio-tab.active {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
    </style>

    <!-- ─── Script Logic ─── -->
    <script>
        const ADMIN_PIN = 'admin123';

        const CATEGORY_CONFIG = {
            pillows: {
                id: 'pillows',
                label: 'Luxury Pillows',
                tagline: 'Sink into cloud-like comfort and restorative sleep.',
                bg: '#8C7A6B',
                panel: '#B8A89A',
                icon: '☁️'
            },
            bedding: {
                id: 'bedding',
                label: 'Bedding & Sleep',
                tagline: 'Drift into five-star serenity and timeless elegance.',
                bg: '#8A6A52',
                panel: '#A07D63',
                icon: '🛏️'
            },
            bath: {
                id: 'bath',
                label: 'Bath & Towels Collection',
                tagline: 'Impossibly soft. Five-star spa indulgence.',
                bg: '#4A6572',
                panel: '#5B7C8D',
                icon: '🛁'
            }
        };

        let currentSection = 'products'; // 'products' | 'orders' | 'reviews' | 'messages' | 'ai'
        let activeCategory = 'pillows';
        let allProductsGrouped = { pillows: [], bedding: [], bath: [] };
        let allOrders = [];
        let allMessages = [];
        let allReviews = [];
        let allProductsFlat = [];
        let activeAIConversationId = null;
        let aiGeneratedDraft = null;
        let ordersFilter = 'ALL';
        let ordersSearchQuery = '';
        let messagesFilter = 'ALL';
        let messagesSearchQuery = '';
        let reviewsFilter = 'ALL';
        let reviewsSearchQuery = '';
        let currentEditProduct = null;
        let selectedFile = null;
        let confirmReset = false;
        let resetTimer = null;
        let allCoupons = [];
        let couponsFilter = 'ALL';
        let couponsSearchQuery = '';

        // Initialize Lucide icons
        lucide.createIcons();

        // ─── PIN Auth Handler ───
        const pinScreen = document.getElementById('pin-screen');
        const pinCard = document.getElementById('pin-card');
        const pinInput = document.getElementById('pin-input');
        const pinError = document.getElementById('pin-error');
        const btnAuthenticate = document.getElementById('btn-authenticate');
        const adminDashboard = document.getElementById('admin-dashboard');
        const btnLockAdmin = document.getElementById('btn-lock-admin');

        function unlockAdmin() {
            pinScreen.style.display = 'none';
            adminDashboard.style.display = 'flex';
            fetchProducts();
            fetchOrders();
            fetchMessages();
            fetchReviews();
            fetchAIOverview();
            fetchBusinessSettings();
            fetchCoupons();
        }

        function lockAdmin() {
            sessionStorage.removeItem('hijaz_admin_authed');
            adminDashboard.style.display = 'none';
            pinScreen.style.display = 'flex';
            pinInput.value = '';
        }

        function checkPin() {
            if (pinInput.value === ADMIN_PIN) {
                sessionStorage.setItem('hijaz_admin_authed', 'true');
                unlockAdmin();
            } else {
                pinError.style.display = 'block';
                pinInput.classList.add('error');
                pinCard.classList.add('shake');
                pinInput.value = '';
                setTimeout(() => {
                    pinCard.classList.remove('shake');
                    pinInput.classList.remove('error');
                }, 600);
            }
        }

        btnAuthenticate.addEventListener('click', checkPin);
        pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPin(); });
        if (btnLockAdmin) btnLockAdmin.addEventListener('click', lockAdmin);

        if (sessionStorage.getItem('hijaz_admin_authed') === 'true') {
            unlockAdmin();
        }

        // ─── Toast Feedback ───
        function showToast(msg) {
            const toast = document.getElementById('admin-toast');
            document.getElementById('toast-message').textContent = msg;
            toast.style.display = 'flex';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }

        // ─── View Switching (Products vs Orders vs Reviews vs Messages vs AI) ───
        function switchToOrders() {
            currentSection = 'orders';
            document.getElementById('view-products').style.display = 'none';
            document.getElementById('view-orders').style.display = 'block';
            document.getElementById('view-reviews').style.display = 'none';
            document.getElementById('view-messages').style.display = 'none';
            document.getElementById('view-ai').style.display = 'none';
            document.getElementById('view-settings').style.display = 'none';

            document.getElementById('btn-add-product').style.display = 'none';
            document.getElementById('btn-reset-all').style.display = 'none';
            document.getElementById('btn-refresh-orders').style.display = 'flex';
            document.getElementById('btn-refresh-messages').style.display = 'none';
            document.getElementById('btn-refresh-reviews').style.display = 'none';
            document.getElementById('btn-add-coupon').style.display = 'none';

            document.getElementById('btn-sidebar-orders').classList.add('active');
            document.getElementById('btn-sidebar-orders').style.background = 'rgba(212,175,55,0.15)';
            document.getElementById('btn-sidebar-orders').style.borderLeftColor = '#d4af37';

            document.getElementById('btn-sidebar-reviews').classList.remove('active');
            document.getElementById('btn-sidebar-reviews').style.background = 'transparent';
            document.getElementById('btn-sidebar-reviews').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-messages').classList.remove('active');
            document.getElementById('btn-sidebar-messages').style.background = 'transparent';
            document.getElementById('btn-sidebar-messages').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-ai').classList.remove('active');
            document.getElementById('btn-sidebar-ai').style.background = 'transparent';
            document.getElementById('btn-sidebar-ai').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-settings').classList.remove('active');
            document.getElementById('btn-sidebar-settings').style.background = 'transparent';
            document.getElementById('btn-sidebar-settings').style.borderLeftColor = 'transparent';

            renderSidebar();
            renderOrdersView();
        }

        function switchToReviews() {
            currentSection = 'reviews';
            document.getElementById('view-products').style.display = 'none';
            document.getElementById('view-orders').style.display = 'none';
            document.getElementById('view-reviews').style.display = 'block';
            document.getElementById('view-messages').style.display = 'none';
            document.getElementById('view-ai').style.display = 'none';
            document.getElementById('view-settings').style.display = 'none';

            document.getElementById('btn-add-product').style.display = 'none';
            document.getElementById('btn-reset-all').style.display = 'none';
            document.getElementById('btn-refresh-orders').style.display = 'none';
            document.getElementById('btn-refresh-messages').style.display = 'none';
            document.getElementById('btn-refresh-reviews').style.display = 'flex';
            document.getElementById('btn-add-coupon').style.display = 'none';

            document.getElementById('btn-sidebar-reviews').classList.add('active');
            document.getElementById('btn-sidebar-reviews').style.background = 'rgba(251,191,36,0.15)';
            document.getElementById('btn-sidebar-reviews').style.borderLeftColor = '#fbbf24';

            document.getElementById('btn-sidebar-orders').classList.remove('active');
            document.getElementById('btn-sidebar-orders').style.background = 'transparent';
            document.getElementById('btn-sidebar-orders').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-messages').classList.remove('active');
            document.getElementById('btn-sidebar-messages').style.background = 'transparent';
            document.getElementById('btn-sidebar-messages').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-ai').classList.remove('active');
            document.getElementById('btn-sidebar-ai').style.background = 'transparent';
            document.getElementById('btn-sidebar-ai').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-settings').classList.remove('active');
            document.getElementById('btn-sidebar-settings').style.background = 'transparent';
            document.getElementById('btn-sidebar-settings').style.borderLeftColor = 'transparent';

            renderSidebar();
            renderReviewsView();
        }

        function switchToMessages() {
            currentSection = 'messages';
            document.getElementById('view-products').style.display = 'none';
            document.getElementById('view-orders').style.display = 'none';
            document.getElementById('view-reviews').style.display = 'none';
            document.getElementById('view-messages').style.display = 'block';
            document.getElementById('view-ai').style.display = 'none';
            document.getElementById('view-settings').style.display = 'none';

            document.getElementById('btn-add-product').style.display = 'none';
            document.getElementById('btn-reset-all').style.display = 'none';
            document.getElementById('btn-refresh-orders').style.display = 'none';
            document.getElementById('btn-refresh-messages').style.display = 'flex';
            document.getElementById('btn-refresh-reviews').style.display = 'none';
            document.getElementById('btn-add-coupon').style.display = 'none';

            document.getElementById('btn-sidebar-messages').classList.add('active');
            document.getElementById('btn-sidebar-messages').style.background = 'rgba(99,179,237,0.12)';
            document.getElementById('btn-sidebar-messages').style.borderLeftColor = '#63b3ed';

            document.getElementById('btn-sidebar-orders').classList.remove('active');
            document.getElementById('btn-sidebar-orders').style.background = 'transparent';
            document.getElementById('btn-sidebar-orders').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-reviews').classList.remove('active');
            document.getElementById('btn-sidebar-reviews').style.background = 'transparent';
            document.getElementById('btn-sidebar-reviews').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-ai').classList.remove('active');
            document.getElementById('btn-sidebar-ai').style.background = 'transparent';
            document.getElementById('btn-sidebar-ai').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-settings').classList.remove('active');
            document.getElementById('btn-sidebar-settings').style.background = 'transparent';
            document.getElementById('btn-sidebar-settings').style.borderLeftColor = 'transparent';

            renderSidebar();
            renderMessagesView();
        }

        function switchToAI() {
            currentSection = 'ai';
            document.getElementById('view-products').style.display = 'none';
            document.getElementById('view-orders').style.display = 'none';
            document.getElementById('view-reviews').style.display = 'none';
            document.getElementById('view-messages').style.display = 'none';
            document.getElementById('view-ai').style.display = 'block';
            document.getElementById('view-settings').style.display = 'none';

            document.getElementById('btn-add-product').style.display = 'none';
            document.getElementById('btn-reset-all').style.display = 'none';
            document.getElementById('btn-refresh-orders').style.display = 'none';
            document.getElementById('btn-refresh-messages').style.display = 'none';
            document.getElementById('btn-refresh-reviews').style.display = 'none';
            document.getElementById('btn-add-coupon').style.display = 'none';

            document.getElementById('btn-sidebar-ai').classList.add('active');
            document.getElementById('btn-sidebar-ai').style.background = 'rgba(168,85,247,0.15)';
            document.getElementById('btn-sidebar-ai').style.borderLeftColor = '#c084fc';

            document.getElementById('btn-sidebar-orders').classList.remove('active');
            document.getElementById('btn-sidebar-orders').style.background = 'transparent';
            document.getElementById('btn-sidebar-orders').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-reviews').classList.remove('active');
            document.getElementById('btn-sidebar-reviews').style.background = 'transparent';
            document.getElementById('btn-sidebar-reviews').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-messages').classList.remove('active');
            document.getElementById('btn-sidebar-messages').style.background = 'transparent';
            document.getElementById('btn-sidebar-messages').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-settings').classList.remove('active');
            document.getElementById('btn-sidebar-settings').style.background = 'transparent';
            document.getElementById('btn-sidebar-settings').style.borderLeftColor = 'transparent';

            renderSidebar();
            fetchAIOverview();
        }

        function switchToCategory(catKey) {
            currentSection = 'products';
            activeCategory = catKey;
            document.getElementById('view-orders').style.display = 'none';
            document.getElementById('view-reviews').style.display = 'none';
            document.getElementById('view-messages').style.display = 'none';
            document.getElementById('view-ai').style.display = 'none';
            document.getElementById('view-settings').style.display = 'none';
            document.getElementById('view-products').style.display = 'block';

            document.getElementById('btn-add-product').style.display = 'flex';
            document.getElementById('btn-reset-all').style.display = 'flex';
            document.getElementById('btn-refresh-orders').style.display = 'none';
            document.getElementById('btn-refresh-messages').style.display = 'none';
            document.getElementById('btn-refresh-reviews').style.display = 'none';
            document.getElementById('btn-add-coupon').style.display = 'none';

            document.getElementById('btn-sidebar-orders').classList.remove('active');
            document.getElementById('btn-sidebar-orders').style.background = 'transparent';
            document.getElementById('btn-sidebar-orders').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-reviews').classList.remove('active');
            document.getElementById('btn-sidebar-reviews').style.background = 'transparent';
            document.getElementById('btn-sidebar-reviews').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-messages').classList.remove('active');
            document.getElementById('btn-sidebar-messages').style.background = 'transparent';
            document.getElementById('btn-sidebar-messages').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-ai').classList.remove('active');
            document.getElementById('btn-sidebar-ai').style.background = 'transparent';
            document.getElementById('btn-sidebar-ai').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-settings').classList.remove('active');
            document.getElementById('btn-sidebar-settings').style.background = 'transparent';
            document.getElementById('btn-sidebar-settings').style.borderLeftColor = 'transparent';

            renderSidebar();
            renderCategoryView();
        }

        function switchToSettings() {
            currentSection = 'settings';
            document.getElementById('view-products').style.display = 'none';
            document.getElementById('view-orders').style.display = 'none';
            document.getElementById('view-reviews').style.display = 'none';
            document.getElementById('view-messages').style.display = 'none';
            document.getElementById('view-ai').style.display = 'none';
            document.getElementById('view-settings').style.display = 'block';

            document.getElementById('btn-add-product').style.display = 'none';
            document.getElementById('btn-reset-all').style.display = 'none';
            document.getElementById('btn-refresh-orders').style.display = 'none';
            document.getElementById('btn-refresh-messages').style.display = 'none';
            document.getElementById('btn-refresh-reviews').style.display = 'none';
            document.getElementById('btn-add-coupon').style.display = 'flex';

            document.getElementById('btn-sidebar-settings').classList.add('active');
            document.getElementById('btn-sidebar-settings').style.background = 'rgba(212,175,55,0.15)';
            document.getElementById('btn-sidebar-settings').style.borderLeftColor = '#d4af37';

            document.getElementById('btn-sidebar-orders').classList.remove('active');
            document.getElementById('btn-sidebar-orders').style.background = 'transparent';
            document.getElementById('btn-sidebar-orders').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-reviews').classList.remove('active');
            document.getElementById('btn-sidebar-reviews').style.background = 'transparent';
            document.getElementById('btn-sidebar-reviews').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-messages').classList.remove('active');
            document.getElementById('btn-sidebar-messages').style.background = 'transparent';
            document.getElementById('btn-sidebar-messages').style.borderLeftColor = 'transparent';

            document.getElementById('btn-sidebar-ai').classList.remove('active');
            document.getElementById('btn-sidebar-ai').style.background = 'transparent';
            document.getElementById('btn-sidebar-ai').style.borderLeftColor = 'transparent';

            renderSidebar();
            fetchBusinessSettings();
            fetchCoupons();
        }

        // ─── Business Settings & Coupons Logic ───
        async function fetchBusinessSettings() {
            try {
                const res = await fetch('/api/settings');
                if (!res.ok) throw new Error('Failed to load settings');
                const data = await res.json();

                const fee = data.shipping_fee !== undefined && data.shipping_fee !== null ? Number(data.shipping_fee) : 99;
                const thresh = data.free_shipping_threshold !== undefined && data.free_shipping_threshold !== null ? Number(data.free_shipping_threshold) : 999;

                document.getElementById('kpi-shipping-fee').textContent = `₹${fee}`;
                document.getElementById('kpi-free-shipping').textContent = `₹${thresh}`;

                document.getElementById('setting-shipping-fee').value = fee;
                document.getElementById('setting-free-threshold').value = thresh;
                document.getElementById('setting-free-shipping-enabled').checked = Boolean(data.free_shipping_enabled);
                document.getElementById('setting-delivery-days').value = data.estimated_delivery_days || '';
                document.getElementById('setting-business-name').value = data.business_name || '';
                document.getElementById('setting-support-email').value = data.support_email || '';
                document.getElementById('setting-support-phone').value = data.support_phone || '';
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }
        }

        async function saveBusinessSettings(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-save-settings');
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i> Saving...';
            lucide.createIcons();

            const fee = Number(document.getElementById('setting-shipping-fee').value);
            const thresh = Number(document.getElementById('setting-free-threshold').value);

            const payload = {
                shipping_fee: !isNaN(fee) ? fee : 0,
                free_shipping_threshold: !isNaN(thresh) ? thresh : 0,
                free_shipping_enabled: document.getElementById('setting-free-shipping-enabled').checked,
                estimated_delivery_days: document.getElementById('setting-delivery-days').value.trim(),
                business_name: document.getElementById('setting-business-name').value.trim(),
                support_email: document.getElementById('setting-support-email').value.trim(),
                support_phone: document.getElementById('setting-support-phone').value.trim(),
            };

            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showToast('Business & Shipping settings saved!');
                    document.getElementById('kpi-shipping-fee').textContent = `₹${payload.shipping_fee}`;
                    document.getElementById('kpi-free-shipping').textContent = `₹${payload.free_shipping_threshold}`;
                } else {
                    alert('Error saving settings: ' + (data.message || 'Validation error'));
                }
            } catch (err) {
                console.error('Error saving settings:', err);
                alert('Network error while saving settings.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i> Save Business Settings';
                lucide.createIcons();
            }
        }

        async function fetchCoupons() {
            try {
                const res = await fetch('/api/coupons');
                if (!res.ok) throw new Error('Failed to load coupons');
                allCoupons = await res.json();
                const activeCoupons = allCoupons.filter(c => c.is_active).length;
                document.getElementById('kpi-coupons-count').textContent = activeCoupons;
                document.getElementById('sidebar-coupons-badge').textContent = allCoupons.length;
                renderCouponsList();
            } catch (err) {
                console.error('Failed to fetch coupons:', err);
            }
        }

        function setCouponsFilter(f) {
            couponsFilter = f;
            document.querySelectorAll('.coupon-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === f);
            });
            renderCouponsList();
        }

        function handleCouponsSearch(q) {
            couponsSearchQuery = (q || '').toLowerCase().trim();
            renderCouponsList();
        }

        function renderCouponsList() {
            const container = document.getElementById('coupons-list');
            if (!container) return;
            container.innerHTML = '';

            const filtered = allCoupons.filter(c => {
                if (couponsFilter === 'ACTIVE' && !c.is_active) return false;
                if (couponsFilter === 'INACTIVE' && c.is_active) return false;
                if (couponsSearchQuery) {
                    const q = couponsSearchQuery;
                    return (c.code || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
                }
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1.5rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 16px;">
                        <i data-lucide="tag" style="width: 36px; height: 36px; margin-bottom: 0.75rem; opacity: 0.35; color: #d4af37;"></i>
                        <p style="font-size: 0.95rem; font-weight: 700; color: white; margin: 0;">No coupons found</p>
                        <p style="font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 0.35rem;">Click "New Coupon" to add a promotion voucher.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            filtered.forEach(c => {
                const discountText = c.discount_type === 'percent'
                    ? `${c.discount_value}% OFF`
                    : `₹${Number(c.discount_value).toLocaleString()} OFF`;

                const card = document.createElement('div');
                card.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.15rem 1.35rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; transition: all 200ms ease;';
                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 0;">
                        <div style="padding: 0.45rem 0.85rem; border-radius: 10px; background: rgba(212,175,55,0.12); border: 1.5px dashed rgba(212,175,55,0.4); color: #d4af37; font-weight: 800; font-size: 1rem; letter-spacing: 0.05em;">
                            ${c.code}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <span style="font-size: 0.76rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 6px; background: #86efac15; color: #86efac; border: 1px solid #86efac30;">
                                    ${discountText}
                                </span>
                                ${c.min_order_amount > 0 ? `<span style="font-size: 0.72rem; color: rgba(255,255,255,0.45);">Min. ₹${Number(c.min_order_amount).toLocaleString()}</span>` : ''}
                                ${c.max_discount_amount ? `<span style="font-size: 0.72rem; color: rgba(255,255,255,0.45);">Cap ₹${Number(c.max_discount_amount).toLocaleString()}</span>` : ''}
                                <span style="font-size: 0.72rem; color: rgba(255,255,255,0.45);">Used: <strong style="color: white;">${c.used_count || 0}${c.usage_limit ? ` / ${c.usage_limit}` : ''}</strong></span>
                            </div>
                            ${c.description ? `<p style="font-size: 0.78rem; color: rgba(255,255,255,0.5); margin: 0.25rem 0 0;">${c.description}</p>` : ''}
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <button onclick="toggleCoupon(${c.id})"
                            style="padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: 1px solid ${c.is_active ? 'rgba(134,239,172,0.3)' : 'rgba(239,68,68,0.3)'}; background: ${c.is_active ? 'rgba(134,239,172,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${c.is_active ? '#86efac' : '#f87171'}; transition: all 180ms ease;">
                            ${c.is_active ? '● Active' : '○ Inactive'}
                        </button>
                        <button class="icon-btn btn-edit-coupon" title="Edit Coupon">
                            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="icon-btn danger" onclick="deleteCoupon(${c.id})" title="Delete Coupon">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                `;
                card.querySelector('.btn-edit-coupon').onclick = () => openCouponModal(c);
                container.appendChild(card);
            });
            lucide.createIcons();
        }

        const couponModal = document.getElementById('coupon-modal');

        function openCouponModal(c = null) {
            document.getElementById('coupon-modal-title').textContent = c ? 'Edit Coupon' : 'Create Coupon Code';
            document.getElementById('coupon-edit-id').value = c ? c.id : '';
            document.getElementById('coupon-code').value = c ? c.code : '';
            document.getElementById('coupon-type').value = c ? c.discount_type : 'percent';
            document.getElementById('coupon-value').value = c ? c.discount_value : '';
            document.getElementById('coupon-min-order').value = (c && c.min_order_amount) ? c.min_order_amount : '';
            document.getElementById('coupon-max-discount').value = (c && c.max_discount_amount) ? c.max_discount_amount : '';
            document.getElementById('coupon-usage-limit').value = (c && c.usage_limit) ? c.usage_limit : '';
            document.getElementById('coupon-expiry').value = (c && c.expires_at) ? c.expires_at.split('T')[0] : '';
            document.getElementById('coupon-description').value = c ? (c.description || '') : '';
            document.getElementById('coupon-is-active').checked = c ? Boolean(c.is_active) : true;

            couponModal.style.display = 'flex';
        }

        function closeCouponModal() {
            couponModal.style.display = 'none';
        }

        async function saveCoupon(e) {
            e.preventDefault();
            const editId = document.getElementById('coupon-edit-id').value;
            const payload = {
                code: document.getElementById('coupon-code').value.trim().toUpperCase(),
                discount_type: document.getElementById('coupon-type').value,
                discount_value: Number(document.getElementById('coupon-value').value),
                min_order_amount: document.getElementById('coupon-min-order').value ? Number(document.getElementById('coupon-min-order').value) : 0,
                max_discount_amount: document.getElementById('coupon-max-discount').value ? Number(document.getElementById('coupon-max-discount').value) : null,
                usage_limit: document.getElementById('coupon-usage-limit').value ? Number(document.getElementById('coupon-usage-limit').value) : null,
                expires_at: document.getElementById('coupon-expiry').value || null,
                description: document.getElementById('coupon-description').value.trim(),
                is_active: document.getElementById('coupon-is-active').checked,
            };

            const url = editId ? `/api/coupons/${editId}` : '/api/coupons';
            const method = editId ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    closeCouponModal();
                    fetchCoupons();
                    showToast(editId ? 'Coupon updated' : 'Coupon created successfully');
                } else {
                    alert('Error: ' + (data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to save coupon')));
                }
            } catch (err) {
                console.error(err);
                alert('Network error while saving coupon.');
            }
        }

        async function toggleCoupon(id) {
            try {
                const res = await fetch(`/api/coupons/${id}/toggle`, { method: 'PATCH' });
                if (res.ok) {
                    fetchCoupons();
                    showToast('Coupon status updated');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteCoupon(id) {
            if (!confirm('Are you sure you want to delete this coupon?')) return;
            try {
                const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchCoupons();
                    showToast('Coupon deleted');
                }
            } catch (err) {
                console.error(err);
            }
        }

        document.getElementById('btn-refresh-orders').onclick = () => {
            fetchOrders();
            showToast('Orders refreshed');
        };

        document.getElementById('btn-refresh-messages').onclick = () => {
            fetchMessages();
            showToast('Messages refreshed');
        };

        document.getElementById('btn-refresh-reviews').onclick = () => {
            fetchReviews();
            showToast('Reviews refreshed');
        };

        // ─── Fetch Products ───
        async function fetchProducts() {
            try {
                const res = await fetch('/api/products');
                if (!res.ok) throw new Error('Failed to fetch products');
                const data = await res.json();

                allProductsGrouped = { pillows: [], bedding: [], bath: [] };
                data.forEach(p => {
                    let cat = p.category;
                    if (cat === 'oud' || cat === 'fragrance') cat = 'pillows';
                    if (allProductsGrouped[cat]) {
                        allProductsGrouped[cat].push({
                            ...p,
                            category: cat,
                            price: Number(p.price) || 0,
                            originalPrice: (p.original_price || p.originalPrice) ? Number(p.original_price || p.originalPrice) : null,
                            rating: Number(p.rating) || 0,
                            reviews: Number(p.reviews) || 0
                        });
                    }
                });
                renderSidebar();
                if (currentSection === 'products') renderCategoryView();
            } catch (err) {
                console.error(err);
            }
        }

        // ─── Fetch Orders ───
        async function fetchOrders() {
            try {
                const res = await fetch('/api/orders');
                if (!res.ok) throw new Error('Failed to fetch orders');
                allOrders = await res.json();
                document.getElementById('sidebar-orders-badge').textContent = allOrders.length;
                if (currentSection === 'orders') renderOrdersView();
            } catch (err) {
                console.error('Failed to fetch orders:', err);
            }
        }

        // ─── Fetch Messages ───
        async function fetchMessages() {
            try {
                const res = await fetch('/api/messages');
                if (!res.ok) throw new Error('Failed to fetch messages');
                allMessages = await res.json();
                const unread = allMessages.filter(m => m.status === 'unread').length;
                document.getElementById('sidebar-messages-badge').textContent = unread;
                if (currentSection === 'messages') renderMessagesView();
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        }

        // ─── Messages Filter & Search ───
        function setMessagesFilter(filter) {
            messagesFilter = filter;
            document.querySelectorAll('.msg-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            renderMessagesView();
        }

        function handleMessagesSearch(query) {
            messagesSearchQuery = (query || '').toLowerCase().trim();
            renderMessagesView();
        }

        // ─── Render Messages View ───
        function renderMessagesView() {
            const total = allMessages.length;
            const unread = allMessages.filter(m => m.status === 'unread').length;
            document.getElementById('kpi-messages-total').textContent = total;
            document.getElementById('kpi-messages-unread').textContent = unread;
            document.getElementById('sidebar-messages-badge').textContent = unread;

            const filtered = allMessages.filter(msg => {
                if (messagesFilter !== 'ALL' && msg.status !== messagesFilter) return false;
                if (messagesSearchQuery) {
                    const q = messagesSearchQuery;
                    return (
                        (msg.name || '').toLowerCase().includes(q) ||
                        (msg.email || '').toLowerCase().includes(q) ||
                        (msg.subject || '').toLowerCase().includes(q) ||
                        (msg.message || '').toLowerCase().includes(q)
                    );
                }
                return true;
            });

            const container = document.getElementById('messages-list');
            container.innerHTML = '';

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 6rem 2rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 20px;">
                        <i data-lucide="mail" style="width: 48px; height: 48px; margin-bottom: 1.25rem; opacity: 0.35; color: #63b3ed;"></i>
                        <h3 style="font-size: 1.15rem; color: white; font-weight: 700; margin: 0;">No Messages Found</h3>
                        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; max-width: 340px; margin-inline: auto; line-height: 1.5;">
                            ${allMessages.length === 0 ? 'No contact messages have been submitted yet.' : 'No messages match your current filter or search.'}
                        </p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            filtered.forEach(msg => {
                const dateStr = msg.created_at
                    ? new Date(msg.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })
                    : 'Recent';

                const statusColor = msg.status === 'replied'
                    ? '#86efac'
                    : msg.status === 'read'
                        ? 'rgba(255,255,255,0.4)'
                        : '#63b3ed';
                const statusBg = msg.status === 'replied'
                    ? 'rgba(134,239,172,0.1)'
                    : msg.status === 'read'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(99,179,237,0.12)';

                const card = document.createElement('div');
                card.className = `message-card ${msg.status === 'unread' ? 'unread' : ''}`;
                card.innerHTML = `
                    <!-- Card Header -->
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 0;">
                            <!-- Avatar -->
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(99,179,237,0.1); border: 1px solid rgba(99,179,237,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800; color: #63b3ed; flex-shrink: 0; text-transform: uppercase;">
                                ${(msg.name || '?').charAt(0)}
                            </div>
                            <div style="min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                                    <span style="color: white; font-weight: 700; font-size: 0.95rem;">${msg.name}</span>
                                    <span style="font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: ${statusBg}; color: ${statusColor}; text-transform: capitalize; border: 1px solid ${statusColor}30;">
                                        ${msg.status}
                                    </span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: rgba(255,255,255,0.45); margin-top: 0.2rem;">
                                    <i data-lucide="mail" style="width: 12px; height: 12px;"></i>
                                    <span>${msg.email}</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 0.3rem;">
                                <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${dateStr}
                            </span>
                            <!-- Status Selector -->
                            <select onchange="updateMessageStatus(${msg.id}, this.value)" style="background: #181818; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; color: white; padding: 0.4rem 0.75rem; font-size: 0.78rem; font-weight: 600; outline: none; cursor: pointer; transition: all 180ms ease; font-family: inherit;">
                                <option value="unread" ${msg.status === 'unread' ? 'selected' : ''}>Unread</option>
                                <option value="read" ${msg.status === 'read' ? 'selected' : ''}>Mark as Read</option>
                                <option value="replied" ${msg.status === 'replied' ? 'selected' : ''}>Replied</option>
                            </select>
                            <!-- Delete -->
                            <button class="icon-btn danger" onclick="deleteMessage(${msg.id})" title="Delete Message">
                                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Subject -->
                    ${msg.subject ? `
                        <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); margin-bottom: 0.5rem;">
                            Subject
                        </div>
                        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.85); font-weight: 600; margin-bottom: 0.85rem;">
                            ${msg.subject}
                        </p>
                    ` : ''}

                    <!-- Message Body -->
                    <div style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); margin-bottom: 0.5rem;">
                        Message
                    </div>
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem 1.15rem; font-size: 0.875rem; color: rgba(255,255,255,0.75); line-height: 1.65; white-space: pre-wrap;">
                        ${msg.message}
                    </div>

                    <!-- Quick Reply Link -->
                    <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem;">
                        <a href="mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Your inquiry - Hijaz')}" onclick="updateMessageStatus(${msg.id}, 'replied')"
                           style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.9rem; border-radius: 8px; border: 1px solid rgba(99,179,237,0.3); background: rgba(99,179,237,0.07); color: #63b3ed; font-size: 0.75rem; font-weight: 700; text-decoration: none; transition: all 0.2s;"
                           onmouseover="this.style.background='rgba(99,179,237,0.16)'"
                           onmouseout="this.style.background='rgba(99,179,237,0.07)'"
                        >
                            <i data-lucide="reply" style="width: 13px; height: 13px;"></i>
                            Reply via Email
                        </a>
                    </div>
                `;

                container.appendChild(card);
            });

            lucide.createIcons();
        }

        // ─── Update Message Status (AJAX) ───
        async function updateMessageStatus(msgId, newStatus) {
            try {
                const res = await fetch(`/api/messages/${msgId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    const updated = await res.json();
                    const idx = allMessages.findIndex(m => m.id === msgId);
                    if (idx !== -1) allMessages[idx] = updated;
                    renderMessagesView();
                }
            } catch (err) {
                console.error('Failed to update message status:', err);
            }
        }

        // ─── Delete Message (AJAX) ───
        async function deleteMessage(msgId) {
            if (!confirm('Delete this message? This cannot be undone.')) return;
            try {
                const res = await fetch(`/api/messages/${msgId}`, { method: 'DELETE' });
                if (res.ok) {
                    allMessages = allMessages.filter(m => m.id !== msgId);
                    renderMessagesView();
                    showToast('Message deleted');
                }
            } catch (err) {
                console.error('Failed to delete message:', err);
            }
        }

        // ─── Fetch Reviews ───
        async function fetchReviews() {
            try {
                const res = await fetch('/api/reviews');
                if (!res.ok) throw new Error('Failed to fetch reviews');
                allReviews = await res.json();
                document.getElementById('sidebar-reviews-badge').textContent = allReviews.length;
                if (currentSection === 'reviews') renderReviewsView();
            } catch (err) {
                console.error('Failed to fetch reviews:', err);
            }
        }

        // ─── Reviews Filter & Search ───
        function setReviewsFilter(filter) {
            reviewsFilter = filter;
            document.querySelectorAll('.review-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            renderReviewsView();
        }

        function handleReviewsSearch(query) {
            reviewsSearchQuery = (query || '').toLowerCase().trim();
            renderReviewsView();
        }

        // ─── Render Reviews View ───
        function renderReviewsView() {
            const total = allReviews.length;
            const avgRating = total > 0
                ? (allReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total).toFixed(1)
                : '5.0';
            const positiveCount = allReviews.filter(r => (r.sentiment || '').toLowerCase() === 'positive' || (Number(r.rating) >= 4)).length;
            const positivePct = total > 0 ? Math.round((positiveCount / total) * 100) : 100;

            document.getElementById('kpi-reviews-total').textContent = total;
            document.getElementById('kpi-reviews-avg').textContent = `${avgRating} ★`;
            document.getElementById('kpi-reviews-positive').textContent = `${positivePct}%`;
            document.getElementById('sidebar-reviews-badge').textContent = total;

            const filtered = allReviews.filter(rev => {
                if (reviewsFilter !== 'ALL') {
                    const stars = Math.floor(Number(rev.rating) || 0);
                    if (stars !== Number(reviewsFilter)) return false;
                }
                if (reviewsSearchQuery) {
                    const q = reviewsSearchQuery;
                    const productName = rev.product ? (rev.product.name || '').toLowerCase() : '';
                    return (
                        (rev.customer_name || '').toLowerCase().includes(q) ||
                        (rev.customer_email || '').toLowerCase().includes(q) ||
                        (rev.comment || '').toLowerCase().includes(q) ||
                        productName.includes(q)
                    );
                }
                return true;
            });

            const container = document.getElementById('reviews-list');
            container.innerHTML = '';

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 6rem 2rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 20px;">
                        <i data-lucide="star" style="width: 48px; height: 48px; margin-bottom: 1.25rem; opacity: 0.35; color: #fbbf24;"></i>
                        <h3 style="font-size: 1.15rem; color: white; font-weight: 700; margin: 0;">No Reviews Found</h3>
                        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; max-width: 340px; margin-inline: auto; line-height: 1.5;">
                            ${allReviews.length === 0 ? 'No customer reviews have been submitted yet.' : 'No reviews match your current filter or search criteria.'}
                        </p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            filtered.forEach(rev => {
                const dateStr = rev.created_at
                    ? new Date(rev.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })
                    : 'Recent';

                const ratingNum = Number(rev.rating) || 5;
                const sentiment = (rev.sentiment || 'positive').toLowerCase();
                const sentimentColor = sentiment === 'positive'
                    ? '#86efac'
                    : sentiment === 'neutral'
                        ? '#fbbf24'
                        : '#f87171';
                const sentimentBg = sentiment === 'positive'
                    ? 'rgba(134,239,172,0.1)'
                    : sentiment === 'neutral'
                        ? 'rgba(251,191,36,0.1)'
                        : 'rgba(248,113,113,0.1)';

                // Stars display HTML
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    const fill = i <= ratingNum ? '#fbbf24' : 'rgba(255,255,255,0.15)';
                    starsHtml += `<span style="color: ${fill}; font-size: 1.1rem; margin-right: 2px;">★</span>`;
                }

                const card = document.createElement('div');
                card.className = 'review-card';
                card.innerHTML = `
                    <!-- Card Top Header -->
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 0;">
                            <!-- Initials Avatar -->
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, rgba(212,175,55,0.25), rgba(155,106,69,0.25)); border: 1px solid rgba(212,175,55,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: #fbbf24; flex-shrink: 0; text-transform: uppercase;">
                                ${(rev.customer_name || 'U').charAt(0)}
                            </div>
                            <div style="min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                                    <span style="color: white; font-weight: 700; font-size: 0.95rem;">${rev.customer_name}</span>
                                    <span style="font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: ${sentimentBg}; color: ${sentimentColor}; text-transform: capitalize; border: 1px solid ${sentimentColor}30;">
                                        ${sentiment}
                                    </span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: rgba(255,255,255,0.45); margin-top: 0.2rem;">
                                    <span>${rev.customer_email || 'Verified Customer'}</span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 0.3rem;">
                                <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${dateStr}
                            </span>
                            <!-- Delete Button -->
                            <button class="icon-btn danger" onclick="deleteReview(${rev.id})" title="Delete Review">
                                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Rating Stars & Product Tag -->
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.85rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <div style="display: flex;">${starsHtml}</div>
                            <span style="font-weight: 800; font-size: 0.9rem; color: #fbbf24; margin-left: 0.25rem;">${ratingNum.toFixed(1)}</span>
                        </div>

                        ${rev.product ? `
                            <div style="display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); font-size: 0.76rem; color: rgba(255,255,255,0.8);">
                                <span>🛍️ ${rev.product.name}</span>
                                <span style="color: rgba(255,255,255,0.35); text-transform: uppercase; font-size: 0.65rem;">(${rev.product.category})</span>
                            </div>
                        ` : `
                            <div style="display: flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.75rem; border-radius: 8px; background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.15); font-size: 0.76rem; color: #d4af37;">
                                <span>✨ Store Experience</span>
                            </div>
                        `}
                    </div>

                    <!-- Review Comment -->
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem 1.15rem; font-size: 0.875rem; color: rgba(255,255,255,0.85); line-height: 1.65; font-style: italic;">
                        "${rev.comment}"
                    </div>
                `;

                container.appendChild(card);
            });

            lucide.createIcons();
        }

        // ─── Delete Review (AJAX) ───
        async function deleteReview(reviewId) {
            if (!confirm('Delete this customer review? This cannot be undone.')) return;
            try {
                const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
                if (res.ok) {
                    allReviews = allReviews.filter(r => r.id !== reviewId);
                    renderReviewsView();
                    fetchProducts();
                    showToast('Review deleted successfully');
                }
            } catch (err) {
                console.error('Failed to delete review:', err);
            }
        }

        // ─── AI Assistant Intelligence Engine (JS) ───
        async function fetchAIOverview() {
            try {
                // Fetch Overview Insights
                const res = await fetch('/api/admin/ai/insights/overview');
                if (res.ok) {
                    const data = await res.json();
                    const kpis = data.summary_kpis || {};

                    document.getElementById('ai-kpi-revenue').textContent = `₹${Math.round(kpis.total_revenue || 0).toLocaleString()}`;
                    const restockCount = (kpis.low_stock_count || 0) + (kpis.out_of_stock_count || 0);
                    document.getElementById('ai-kpi-stock-alerts').textContent = restockCount;
                }

                // Fetch Inventory Insights Radar
                const invRes = await fetch('/api/admin/ai/insights/inventory');
                if (invRes.ok) {
                    const invData = await invRes.json();
                    renderAIInventoryRadar(invData);
                }

                // Fetch Review Insights
                const revRes = await fetch('/api/admin/ai/insights/reviews');
                if (revRes.ok) {
                    const revData = await revRes.json();
                    renderAIReviewsRadar(revData);
                }

                // Populate Product Selector in AI Content Studio
                populateAIProductSelector();
            } catch (err) {
                console.error('Failed to fetch AI insights overview:', err);
            }
        }

        function populateAIProductSelector() {
            const select = document.getElementById('ai-product-select');
            if (!select) return;

            const existingVal = select.value;
            select.innerHTML = '<option value="">-- Or enter custom item name below --</option>';

            const allProds = Object.values(allProductsGrouped).flat();
            allProductsFlat = allProds;

            allProds.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (${p.category.toUpperCase()}) — ₹${Number(p.price).toLocaleString()}`;
                select.appendChild(opt);
            });

            if (existingVal) select.value = existingVal;
        }

        function onAIProductSelected(prodId) {
            if (!prodId) {
                document.getElementById('ai-gen-name').value = '';
                return;
            }
            const prod = allProductsFlat.find(p => p.id == prodId);
            if (prod) {
                document.getElementById('ai-gen-name').value = prod.name;
                document.getElementById('ai-gen-category').value = prod.category;
            }
        }

        function renderAIInventoryRadar(inv) {
            const container = document.getElementById('ai-inventory-radar-list');
            if (!container) return;

            const critical = inv.critical_items || [];
            if (critical.length === 0) {
                container.innerHTML = `
                    <div style="background: rgba(134,239,172,0.06); border: 1px solid rgba(134,239,172,0.2); border-radius: 12px; padding: 1rem; text-align: center;">
                        <p style="color: #86efac; font-weight: 700; font-size: 0.88rem; margin: 0;">✅ Healthy Inventory Levels</p>
                        <p style="color: rgba(255,255,255,0.5); font-size: 0.78rem; margin-top: 0.2rem;">All ${inv.total_skus || 0} catalog SKUs have healthy stock reserves.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = critical.map(item => `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid ${item.status === 'OUT_OF_STOCK' ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}; border-radius: 10px; padding: 0.75rem 0.9rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: white; font-size: 0.88rem;">${item.name}</span>
                        <span style="font-size: 0.68rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 999px; background: ${item.status === 'OUT_OF_STOCK' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}; color: ${item.status === 'OUT_OF_STOCK' ? '#f87171' : '#fbbf24'}; text-transform: uppercase;">
                            ${item.status === 'OUT_OF_STOCK' ? 'Out of Stock' : `${item.current_stock} Left`}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem; font-size: 0.75rem; color: rgba(255,255,255,0.45);">
                        <span>Category: ${item.category.toUpperCase()}</span>
                        <span style="color: #c084fc; font-weight: 700;">Reorder: +${item.recommended_reorder_qty} units</span>
                    </div>
                </div>
            `).join('');
        }

        function renderAIReviewsRadar(rev) {
            const container = document.getElementById('ai-reviews-radar-list');
            if (!container) return;

            const breakdown = rev.sentiment_breakdown || {};
            const complaints = rev.common_complaints || [];
            const praises = rev.common_praises || [];

            container.innerHTML = `
                <!-- Sentiment Bar -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.8rem; font-weight: 700;">
                        <span style="color: #86efac;">Positive: ${breakdown.positive_percentage || 100}%</span>
                        <span style="color: #fbbf24;">Neutral: ${breakdown.neutral_percentage || 0}%</span>
                        <span style="color: #f87171;">Negative: ${breakdown.negative_percentage || 0}%</span>
                    </div>
                    <div style="height: 6px; width: 100%; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden; display: flex;">
                        <div style="width: ${breakdown.positive_percentage || 100}%; background: #86efac;"></div>
                        <div style="width: ${breakdown.neutral_percentage || 0}%; background: #fbbf24;"></div>
                        <div style="width: ${breakdown.negative_percentage || 0}%; background: #f87171;"></div>
                    </div>
                </div>

                <!-- Praise Highlights -->
                ${praises.length > 0 ? `
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.75rem 0.9rem; margin-top: 0.6rem;">
                        <p style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #86efac; letter-spacing: 0.06em; margin-bottom: 0.35rem;">Top Praised Qualities:</p>
                        ${praises.map(p => `<p style="font-size: 0.78rem; color: rgba(255,255,255,0.75); margin: 0.2rem 0;">• "${p}"</p>`).join('')}
                    </div>
                ` : ''}

                <!-- Complaints & Improvement Areas -->
                ${complaints.length > 0 ? `
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 0.75rem 0.9rem; margin-top: 0.6rem;">
                        <p style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #f87171; letter-spacing: 0.06em; margin-bottom: 0.35rem;">Customer Improvement Areas:</p>
                        ${complaints.map(c => `<p style="font-size: 0.78rem; color: rgba(255,255,255,0.75); margin: 0.2rem 0;">• <strong>${c.product_name}</strong>: "${c.issue}"</p>`).join('')}
                    </div>
                ` : ''}
            `;
        }

        function switchAIStudioTab(tabId, el) {
            document.querySelectorAll('.ai-studio-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ai-studio-panel').forEach(p => p.style.display = 'none');

            el.classList.add('active');
            const target = document.getElementById(`ai-tab-${tabId}`);
            if (target) target.style.display = 'block';
        }

        // ─── AI Chat Interaction ───
        function askAIPrompt(promptText) {
            document.getElementById('ai-chat-input').value = promptText;
            sendAIChatMessage(promptText);
        }

        function handleAIChatSubmit(e) {
            e.preventDefault();
            const input = document.getElementById('ai-chat-input');
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            sendAIChatMessage(msg);
        }

        async function sendAIChatMessage(msg) {
            appendAIChatBubble('user', msg);

            // Typing indicator
            const typingBubble = document.createElement('div');
            typingBubble.id = 'ai-typing-indicator';
            typingBubble.className = 'ai-msg-bubble assistant';
            typingBubble.innerHTML = `
                <div class="ai-msg-avatar">🤖</div>
                <div class="ai-msg-body" style="color: rgba(255,255,255,0.4); font-style: italic; display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="loader-2" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i>
                    Analyzing store data...
                </div>
            `;
            const container = document.getElementById('ai-chat-messages');
            container.appendChild(typingBubble);
            container.scrollTop = container.scrollHeight;
            lucide.createIcons();

            try {
                const res = await fetch('/api/admin/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        conversation_id: activeAIConversationId,
                    })
                });

                const typing = document.getElementById('ai-typing-indicator');
                if (typing) typing.remove();

                if (res.ok) {
                    const data = await res.json();
                    activeAIConversationId = data.conversation_id;
                    appendAIChatBubble('assistant', data.message.content);
                } else {
                    appendAIChatBubble('assistant', '⚠️ AI assistant is temporarily unavailable. Please try again.');
                }
            } catch (err) {
                console.error('Chat error:', err);
                const typing = document.getElementById('ai-typing-indicator');
                if (typing) typing.remove();
                appendAIChatBubble('assistant', '⚠️ Error contacting AI analytics service. Verified data can still be inspected via the Studio radar tabs.');
            }
        }

        function appendAIChatBubble(role, content) {
            const container = document.getElementById('ai-chat-messages');
            const bubble = document.createElement('div');
            bubble.className = `ai-msg-bubble ${role}`;

            const formattedHtml = formatAIMarkdown(content);

            bubble.innerHTML = `
                <div class="ai-msg-avatar">${role === 'user' ? '👤' : '🤖'}</div>
                <div class="ai-msg-body">
                    ${formattedHtml}
                </div>
            `;

            container.appendChild(bubble);
            container.scrollTop = container.scrollHeight;
        }

        function formatAIMarkdown(text) {
            if (!text) return '';
            let formatted = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^• (.*$)/gim, '<li>$1</li>')
                .replace(/^(?:<li>.*<\/li>\s*)+/gim, '<ul>$&</ul>')
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>');
            return formatted;
        }

        function clearAIChat() {
            activeAIConversationId = null;
            const container = document.getElementById('ai-chat-messages');
            container.innerHTML = `
                <div class="ai-msg-bubble assistant">
                    <div class="ai-msg-avatar">🤖</div>
                    <div class="ai-msg-body">
                        <p style="font-weight: 700; margin-bottom: 0.4rem; color: #c084fc;">Chat cleared.</p>
                        <p style="margin: 0;">How can I assist you with your store operations today?</p>
                    </div>
                </div>
            `;
        }

        // ─── AI Product Content Generator (Studio) ───
        async function generateAIProductContent() {
            const name = document.getElementById('ai-gen-name').value.trim();
            const category = document.getElementById('ai-gen-category').value;
            const btn = document.getElementById('btn-generate-ai-content');

            if (!name) {
                alert('Please enter or select a product name.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" style="width: 15px; height: 15px; animation: spin 1s linear infinite;"></i> Generating...';
            lucide.createIcons();

            try {
                const res = await fetch('/api/admin/ai/generate/product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, category })
                });

                if (res.ok) {
                    const data = await res.json();
                    aiGeneratedDraft = data;

                    document.getElementById('ai-preview-title').value = data.product_name || name;
                    document.getElementById('ai-preview-subtitle').value = data.subtitle || '';
                    document.getElementById('ai-preview-desc').value = data.long_description || data.short_description || '';
                    document.getElementById('ai-preview-seo-title').value = data.seo_title || '';

                    document.getElementById('ai-gen-preview').style.display = 'block';
                    showToast('AI content draft generated! Review & click Approve to apply.');
                } else {
                    alert('Failed to generate product content.');
                }
            } catch (err) {
                console.error(err);
                alert('Error generating product content.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="sparkles" style="width: 15px; height: 15px;"></i> Generate with AI';
                lucide.createIcons();
            }
        }

        async function applyApprovedAIContent() {
            const select = document.getElementById('ai-product-select');
            const selectedProdId = select ? select.value : null;

            if (!selectedProdId) {
                alert('Please select an existing catalog product from the dropdown above to save and apply this approved content to.');
                return;
            }

            const btn = document.getElementById('btn-approve-ai-content');
            btn.disabled = true;
            btn.innerHTML = 'Applying...';

            try {
                const payload = {
                    product_id: Number(selectedProdId),
                    name: document.getElementById('ai-preview-title').value,
                    subtitle: document.getElementById('ai-preview-subtitle').value,
                    description: document.getElementById('ai-preview-desc').value,
                    seo_title: document.getElementById('ai-preview-seo-title').value,
                    seo_description: aiGeneratedDraft?.seo_description || '',
                    seo_keywords: aiGeneratedDraft?.seo_keywords || '',
                    features: aiGeneratedDraft?.features || '',
                };

                const res = await fetch('/api/admin/ai/apply/product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showToast('AI content approved and applied to product successfully!');
                    fetchProducts();
                    fetchAIOverview();
                } else {
                    alert('Failed to apply approved content.');
                }
            } catch (err) {
                console.error(err);
                alert('Error applying approved content.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check-circle" style="width: 15px; height: 15px;"></i> Approve &amp; Apply to Store';
                lucide.createIcons();
            }
        }


        function renderSidebar() {
            const container = document.getElementById('sidebar-categories');
            container.innerHTML = '';

            Object.keys(CATEGORY_CONFIG).forEach(catKey => {
                const cfg = CATEGORY_CONFIG[catKey];
                const count = (allProductsGrouped[catKey] || []).length;
                const isActive = (currentSection === 'products' && catKey === activeCategory);

                const btn = document.createElement('button');
                btn.className = `sidebar-btn ${isActive ? 'active' : ''}`;
                if (isActive) {
                    btn.style.background = `${cfg.bg}15`;
                    btn.style.borderLeftColor = cfg.bg;
                }
                btn.innerHTML = `
                    <span style="font-size: 1.25rem;">${cfg.icon}</span>
                    <span style="flex: 1; letter-spacing: -0.01em;">${cfg.label.replace('Products', '')}</span>
                    <span class="sidebar-badge" style="${isActive ? `background: ${cfg.bg}30; color: #fff;` : ''}">${count}</span>
                `;
                btn.onclick = () => switchToCategory(catKey);
                container.appendChild(btn);
            });
        }

        // ─── Render Category View (Products) ───
        function renderCategoryView() {
            const cfg = CATEGORY_CONFIG[activeCategory];
            const catProducts = allProductsGrouped[activeCategory] || [];
            const totalProducts = Object.values(allProductsGrouped).reduce((acc, list) => acc + list.length, 0);

            // Banner
            const banner = document.getElementById('cat-banner');
            banner.style.background = `linear-gradient(135deg, ${cfg.bg}20, ${cfg.panel}0c)`;
            banner.style.borderColor = `${cfg.bg}25`;

            const bannerIcon = document.getElementById('banner-icon');
            bannerIcon.textContent = cfg.icon;
            bannerIcon.style.background = `${cfg.bg}22`;
            bannerIcon.style.boxShadow = `0 0 20px ${cfg.bg}15`;

            document.getElementById('banner-title').textContent = cfg.label;
            document.getElementById('banner-tagline').textContent = cfg.tagline;
            document.getElementById('cat-count').textContent = catProducts.length;
            document.getElementById('total-count').textContent = totalProducts;

            // Add Product button theme update
            const btnAdd = document.getElementById('btn-add-product');
            btnAdd.style.background = `linear-gradient(135deg, ${cfg.bg}, ${cfg.panel})`;
            btnAdd.style.boxShadow = `0 4px 16px ${cfg.bg}22`;

            // List
            const listContainer = document.getElementById('products-list');
            listContainer.innerHTML = '';

            if (catProducts.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 6rem 2rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 20px;">
                        <i data-lucide="package" style="width: 48px; height: 48px; margin-bottom: 1.25rem; opacity: 0.35; color: ${cfg.bg};"></i>
                        <h3 style="font-size: 1.15rem; color: white; font-weight: 700; margin: 0;">No Products Added</h3>
                        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; max-width: 300px; margin-inline: auto; line-height: 1.5;">
                            There are no items in this category. Click the "Add Product" button above to upload one.
                        </p>
                    </div>
                `;
            } else {
                catProducts.forEach(prod => {
                    const row = document.createElement('div');
                    row.className = 'product-row';
                    row.innerHTML = `
                        <div style="width: 64px; height: 64px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;">
                            <img src="${prod.image || '/bed1.png'}" alt="${prod.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/bed1.png'">
                        </div>
                        <div style="min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap;">
                                <span style="color: white; font-weight: 700; font-size: 0.95rem;">${prod.name}</span>
                                ${prod.badge ? `<span style="font-size: 0.625rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; background: ${cfg.bg}22; color: #fff; border: 1px solid ${cfg.bg}40; text-transform: uppercase;">${prod.badge}</span>` : ''}
                            </div>
                            <p style="color: rgba(255,255,255,0.4); font-size: 0.8rem; margin: 0.25rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${prod.subtitle || ''}
                            </p>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.3rem;">
                                <i data-lucide="star" style="width: 13px; height: 13px; fill: #d4af37; color: #d4af37;"></i>
                                <span style="color: white; font-weight: 700; font-size: 0.9rem;">${(Number(prod.rating) || 0).toFixed(1)}</span>
                            </div>
                            <p style="color: rgba(255,255,255,0.35); font-size: 0.72rem; margin: 0; font-weight: 500;">${prod.reviews || 0} reviews</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="color: white; font-weight: 800; font-size: 1.05rem; margin: 0;">₹${Number(prod.price).toLocaleString()}</p>
                            ${prod.originalPrice ? `<p style="color: rgba(255,255,255,0.3); font-size: 0.75rem; text-decoration: line-through; margin: 0;">₹${Number(prod.originalPrice).toLocaleString()}</p>` : ''}
                        </div>
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button class="icon-btn btn-edit" data-id="${prod.id}"><i data-lucide="edit-3" style="width: 15px; height: 15px;"></i></button>
                            <button class="icon-btn danger btn-delete" data-id="${prod.id}"><i data-lucide="trash-2" style="width: 15px; height: 15px;"></i></button>
                        </div>
                    `;

                    row.querySelector('.btn-edit').onclick = () => openProductModal(prod);
                    row.querySelector('.btn-delete').onclick = () => deleteProduct(prod.id);

                    listContainer.appendChild(row);
                });
            }
            lucide.createIcons();
        }

        // ─── Render Orders View ───
        function setOrdersFilter(filter) {
            ordersFilter = filter;
            document.querySelectorAll('.orders-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            renderOrdersView();
        }

        function handleOrdersSearch(query) {
            ordersSearchQuery = (query || '').toLowerCase().trim();
            renderOrdersView();
        }

        function renderOrdersView() {
            // KPI calculations
            const totalRevenue = allOrders.reduce((sum, ord) => sum + (Number(ord.total_amount) || 0), 0);
            document.getElementById('kpi-orders-count').textContent = allOrders.length;
            document.getElementById('kpi-revenue').textContent = `₹${Math.round(totalRevenue).toLocaleString()}`;
            document.getElementById('sidebar-orders-badge').textContent = allOrders.length;

            // Filter logic
            const filtered = allOrders.filter(ord => {
                // Status filter
                if (ordersFilter !== 'ALL' && ord.status !== ordersFilter) {
                    return false;
                }
                // Search query
                if (ordersSearchQuery) {
                    const q = ordersSearchQuery;
                    const matchNumber = (ord.order_number || '').toLowerCase().includes(q);
                    const matchName = (ord.customer_name || '').toLowerCase().includes(q);
                    const matchEmail = (ord.customer_email || '').toLowerCase().includes(q);
                    const matchPhone = (ord.customer_phone || '').toLowerCase().includes(q);
                    const matchAddress = (ord.shipping_address || '').toLowerCase().includes(q);
                    const matchUid = (ord.user_uid || '').toLowerCase().includes(q);
                    return matchNumber || matchName || matchEmail || matchPhone || matchAddress || matchUid;
                }
                return true;
            });

            const container = document.getElementById('orders-list');
            container.innerHTML = '';

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 6rem 2rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.08); border-radius: 20px;">
                        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; margin-bottom: 1.25rem; opacity: 0.35; color: #d4af37;"></i>
                        <h3 style="font-size: 1.15rem; color: white; font-weight: 700; margin: 0;">No Orders Found</h3>
                        <p style="font-size: 0.85rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; max-width: 340px; margin-inline: auto; line-height: 1.5;">
                            ${allOrders.length === 0 ? "No customer orders have been placed in the store yet." : "No orders matching the current status filter or search query."}
                        </p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            filtered.forEach(ord => {
                const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'Recent';

                const statusClass = (ord.status || 'Processing').toLowerCase();
                const items = Array.isArray(ord.items) ? ord.items : [];

                const card = document.createElement('div');
                card.className = 'order-card';
                card.innerHTML = `
                    <!-- Order Card Header -->
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <span style="color: #d4af37; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.01em;">
                                ${ord.order_number}
                            </span>
                            <span class="status-pill ${statusClass}">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
                                ${ord.status}
                            </span>
                            <span style="font-size: 0.75rem; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 0.35rem;">
                                <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${dateStr}
                            </span>
                        </div>

                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <!-- Status Selector -->
                            <label style="font-size: 0.75rem; color: rgba(255,255,255,0.45); font-weight: 600;">Status:</label>
                            <select class="status-select" data-order-id="${ord.id}" onchange="updateOrderStatus(${ord.id}, this.value)">
                                <option value="Processing" ${ord.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Shipped" ${ord.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>

                            <!-- Download Shipping Label -->
                            <button
                                onclick="downloadLabel(${ord.id})"
                                title="Download Shipping Label"
                                style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 8px; border: 1px solid rgba(212,175,55,0.35); background: rgba(212,175,55,0.08); color: #d4af37; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit;"
                                onmouseover="this.style.background='rgba(212,175,55,0.18)'; this.style.borderColor='rgba(212,175,55,0.6)';"
                                onmouseout="this.style.background='rgba(212,175,55,0.08)'; this.style.borderColor='rgba(212,175,55,0.35)';"
                            >
                                <i data-lucide="tag" style="width: 13px; height: 13px;"></i>
                                Label
                            </button>

                            <button class="icon-btn danger" onclick="deleteOrder(${ord.id})" title="Delete Order">
                                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Customer & Shipping Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 1.25rem; background: rgba(255,255,255,0.015); padding: 1.1rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.04);">
                        <!-- Customer Info -->
                        <div>
                            <p style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.35); letter-spacing: 0.08em; margin-bottom: 0.5rem;">
                                Customer Account
                            </p>
                            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="user" style="width: 14px; height: 14px; color: #d4af37;"></i>
                                    <span style="font-weight: 700; color: white; font-size: 0.92rem;">${ord.customer_name}</span>
                                </div>
                                ${ord.customer_email ? `
                                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.65);">
                                        <i data-lucide="mail" style="width: 13px; height: 13px; color: rgba(255,255,255,0.4);"></i>
                                        <span>${ord.customer_email}</span>
                                    </div>
                                ` : ''}
                                ${ord.customer_phone ? `
                                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.65);">
                                        <i data-lucide="phone" style="width: 13px; height: 13px; color: rgba(255,255,255,0.4);"></i>
                                        <span>${ord.customer_phone}</span>
                                    </div>
                                ` : ''}
                                ${ord.user_uid ? `
                                    <div style="font-size: 0.68rem; color: rgba(255,255,255,0.3); margin-top: 0.2rem;">
                                        Google UID: <code style="color: rgba(212,175,55,0.8);">${ord.user_uid}</code>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Shipping Address -->
                        <div>
                            <p style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.35); letter-spacing: 0.08em; margin-bottom: 0.5rem;">
                                Delivery Address (${ord.address_type || 'Home'})
                            </p>
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.84rem; color: rgba(255,255,255,0.8); line-height: 1.5;">
                                <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #d4af37; margin-top: 0.2rem; flex-shrink: 0;"></i>
                                <span>${ord.shipping_address}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.6rem;">
                                <span style="font-size: 0.7rem; padding: 0.2rem 0.55rem; border-radius: 6px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.08);">
                                    Payment: <strong style="color: white; text-transform: uppercase;">${ord.payment_method || 'COD'}</strong>
                                </span>
                                <span style="font-size: 0.7rem; padding: 0.2rem 0.55rem; border-radius: 6px; background: ${ord.payment_status === 'paid' ? 'rgba(134,239,172,0.1)' : 'rgba(251,191,36,0.1)'}; color: ${ord.payment_status === 'paid' ? '#86efac' : '#fbbf24'}; border: 1px solid ${ord.payment_status === 'paid' ? 'rgba(134,239,172,0.25)' : 'rgba(251,191,36,0.25)'};">
                                    Status: <strong style="text-transform: capitalize;">${ord.payment_status || 'Pending'}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Items Purchased List -->
                    <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem;">
                        <p style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.35); letter-spacing: 0.08em; margin-bottom: 0.2rem;">
                            Items Ordered (${items.length})
                        </p>
                        ${items.map(item => `
                            <div style="display: flex; align-items: center; gap: 0.85rem; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); padding: 0.65rem 0.85rem; border-radius: 10px;">
                                <img src="${item.image || '/athar.png'}" alt="${item.name}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #151515; border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;" onerror="this.src='/athar.png'">
                                <div style="flex: 1; min-width: 0;">
                                    <p style="font-size: 0.88rem; font-weight: 700; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${item.name}
                                    </p>
                                    ${item.subtitle ? `<p style="font-size: 0.72rem; color: rgba(255,255,255,0.4); margin: 0.1rem 0 0;">${item.subtitle}</p>` : ''}
                                </div>
                                <div style="text-align: right; flex-shrink: 0;">
                                    <p style="font-size: 0.85rem; font-weight: 700; color: white; margin: 0;">
                                        ${item.quantity} × ₹${Number(item.price).toLocaleString()}
                                    </p>
                                    <p style="font-size: 0.75rem; color: rgba(255,255,255,0.4); margin: 0.1rem 0 0;">
                                        ₹${(Number(item.price) * Number(item.quantity)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Total Amount & Footer -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                        <div style="display: flex; gap: 1.25rem; font-size: 0.78rem; color: rgba(255,255,255,0.5);">
                            <span>Subtotal: <strong style="color: white;">₹${Number(ord.subtotal || ord.total_amount).toLocaleString()}</strong></span>
                            ${ord.discount ? `<span>Discount: <strong style="color: #86efac;">-₹${Number(ord.discount).toLocaleString()}</strong></span>` : ''}
                            <span>Shipping: <strong style="color: white;">${Number(ord.shipping_fee) > 0 ? `₹${ord.shipping_fee}` : 'Free'}</strong></span>
                        </div>

                        <div style="display: flex; align-items: baseline; gap: 0.4rem;">
                            <span style="font-size: 0.75rem; text-transform: uppercase; color: rgba(255,255,255,0.4); font-weight: 700; letter-spacing: 0.05em;">Order Total:</span>
                            <span style="font-size: 1.35rem; font-weight: 800; color: #d4af37;">
                                ₹${Number(ord.total_amount).toLocaleString()}
                            </span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            lucide.createIcons();
        }

        // ─── Update Order Status (AJAX) ───
        async function updateOrderStatus(orderId, newStatus) {
            try {
                const res = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (res.ok) {
                    const updated = await res.json();
                    const idx = allOrders.findIndex(o => o.id === orderId);
                    if (idx !== -1) {
                        allOrders[idx] = updated;
                    }
                    renderOrdersView();
                    showToast(`Order #${updated.order_number} status updated to ${newStatus}`);
                } else {
                    alert('Failed to update order status.');
                }
            } catch (err) {
                console.error(err);
                alert('Error updating order status.');
            }
        }

        // ─── Delete Order (AJAX) ───
        async function deleteOrder(orderId) {
            if (!confirm('Are you sure you want to delete this order record? This cannot be undone.')) return;

            try {
                const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
                if (res.ok) {
                    allOrders = allOrders.filter(o => o.id !== orderId);
                    renderOrdersView();
                    showToast('Order record removed');
                } else {
                    alert('Failed to delete order.');
                }
            } catch (err) {
                console.error(err);
                alert('Error deleting order.');
            }
        }

        // ─── Download Shipping Label ───
        function downloadLabel(orderId) {
            const ord = allOrders.find(o => o.id === orderId);
            if (!ord) { alert('Order not found.'); return; }

            const items = Array.isArray(ord.items) ? ord.items : [];
            const itemsHtml = items.map(item => `
                <tr>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${item.name}${item.subtitle ? ' – ' + item.subtitle : ''}</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.price).toLocaleString()}</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(Number(item.price) * Number(item.quantity)).toLocaleString()}</td>
                </tr>
            `).join('');

            const placedDate = ord.created_at
                ? new Date(ord.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : 'Recent';

            const labelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Shipping Label — ${ord.order_number}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
        }
        .label {
            background: #fff;
            width: 100%;
            max-width: 680px;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.15);
            overflow: hidden;
            page-break-inside: avoid;
        }
        /* HEADER */
        .label-header {
            background: linear-gradient(135deg, #1a1008 0%, #2d1f0a 100%);
            padding: 24px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        .brand {
            display: flex;
            flex-direction: column;
        }
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #d4af37;
            letter-spacing: -0.5px;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 10px;
            color: rgba(255,255,255,0.5);
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 4px;
        }
        .order-badge {
            text-align: right;
        }
        .order-badge .label-text {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,0.4);
        }
        .order-badge .order-num {
            font-size: 20px;
            font-weight: 800;
            color: #d4af37;
            line-height: 1.2;
        }
        /* BARCODE STRIP */
        .barcode-strip {
            background: #111;
            padding: 8px 28px;
            display: flex;
            align-items: center;
            gap: 2px;
            overflow: hidden;
        }
        .barcode-strip span {
            display: inline-block;
            width: 2px;
            height: 28px;
            background: #fff;
            opacity: 0.85;
        }
        .barcode-strip span:nth-child(even) { height: 20px; opacity: 0.5; }
        .barcode-strip span:nth-child(3n) { width: 4px; }
        .barcode-strip span:nth-child(5n) { height: 24px; opacity: 0.7; }
        .barcode-num {
            color: rgba(255,255,255,0.5);
            font-size: 9px;
            letter-spacing: 3px;
            margin-left: 12px;
            white-space: nowrap;
            font-family: monospace;
        }
        /* STATUS RIBBON */
        .status-ribbon {
            background: ${ord.status === 'Delivered' ? '#16a34a' : ord.status === 'Shipped' ? '#2563eb' : ord.status === 'Cancelled' ? '#dc2626' : '#d97706'};
            color: white;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 6px 0;
        }
        /* BODY */
        .label-body {
            padding: 24px 28px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .section-title {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #9ca3af;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .address-block p {
            font-size: 13px;
            color: #111;
            line-height: 1.6;
        }
        .address-block .name {
            font-size: 16px;
            font-weight: 700;
            color: #111;
            margin-bottom: 4px;
        }
        .from-block p {
            font-size: 12px;
            color: #374151;
            line-height: 1.6;
        }
        .from-block .brand-from {
            font-size: 14px;
            font-weight: 700;
            color: #d4af37;
            margin-bottom: 2px;
        }
        /* META ROW */
        .meta-row {
            margin: 0 28px;
            padding: 12px 16px;
            background: #f9fafb;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
        }
        .meta-item { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; font-weight: 700; }
        .meta-value { font-size: 12px; font-weight: 700; color: #111; }
        /* ITEMS TABLE */
        .items-section {
            margin: 16px 28px;
        }
        .items-section table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .items-section th {
            background: #f3f4f6;
            padding: 7px 8px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
            font-weight: 700;
        }
        .items-section th:not(:first-child) { text-align: center; }
        .items-section th:last-child { text-align: right; }
        /* TOTALS */
        .totals-row {
            margin: 0 28px 20px;
            display: flex;
            justify-content: flex-end;
            gap: 32px;
        }
        .totals-inner { display: flex; flex-direction: column; gap: 5px; min-width: 200px; }
        .total-line { display: flex; justify-content: space-between; font-size: 12px; color: #374151; }
        .total-line.grand { font-size: 15px; font-weight: 800; color: #111; border-top: 2px solid #d4af37; padding-top: 6px; margin-top: 2px; }
        /* FOOTER */
        .label-footer {
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 14px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .label-footer p { font-size: 10px; color: #9ca3af; }
        .label-footer strong { color: #374151; }
        @media print {
            body { background: white; padding: 0; }
            .label { box-shadow: none; border-radius: 0; max-width: 100%; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="label">
        <!-- Header -->
        <div class="label-header">
            <div class="brand">
                <div class="brand-name">Hijaz</div>
                <div class="brand-tagline">Premium Fragrances &amp; Lifestyle</div>
            </div>
            <div class="order-badge">
                <div class="label-text">Order Number</div>
                <div class="order-num">${ord.order_number}</div>
            </div>
        </div>

        <!-- Barcode Strip -->
        <div class="barcode-strip">
            ${Array.from({ length: 55 }, (_, i) => `<span></span>`).join('')}
            <span class="barcode-num">${(ord.order_number || '').replace('#', '').replace('-', '')}${ord.id}HJ</span>
        </div>

        <!-- Status Ribbon -->
        <div class="status-ribbon">${ord.status}</div>

        <!-- Address Grid -->
        <div class="label-body">
            <div class="address-block">
                <div class="section-title">📦 Ship To</div>
                <div class="name">${ord.customer_name}</div>
                <p>${(ord.shipping_address || '').replace(/,/g, ',<br>')}</p>
                ${ord.customer_phone ? `<p style="margin-top:6px; font-weight:600;">📞 ${ord.customer_phone}</p>` : ''}
                ${ord.customer_email ? `<p style="color:#6b7280; font-size:11px;">${ord.customer_email}</p>` : ''}
            </div>
            <div class="from-block">
                <div class="section-title">🏪 Ship From</div>
                <div class="brand-from">Hijaz Luxury Store</div>
                <p>Warehouse &amp; Fulfillment Centre</p>
                <p>Mumbai, Maharashtra</p>
                <p>India — 400001</p>
                <p style="margin-top:4px; color:#9ca3af; font-size:11px;">support@hijazstore.com</p>
            </div>
        </div>

        <!-- Meta Row -->
        <div class="meta-row">
            <div class="meta-item">
                <span class="meta-label">Placed On</span>
                <span class="meta-value">${placedDate}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Payment</span>
                <span class="meta-value">${(ord.payment_method || 'COD').toUpperCase()}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Payment Status</span>
                <span class="meta-value" style="color: ${ord.payment_status === 'paid' ? '#16a34a' : '#d97706'}; text-transform: capitalize;">${ord.payment_status || 'Pending'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Address Type</span>
                <span class="meta-value">${ord.address_type || 'Home'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Items</span>
                <span class="meta-value">${items.length} Product${items.length !== 1 ? 's' : ''}</span>
            </div>
        </div>

        <!-- Items Table -->
        <div class="items-section" style="margin-top: 16px;">
            <div class="section-title" style="margin: 0 0 8px;">🛍 Items Ordered</div>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml || '<tr><td colspan="4" style="padding:8px; color:#9ca3af; text-align:center;">No items</td></tr>'}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals-row">
            <div class="totals-inner">
                <div class="total-line">
                    <span>Subtotal</span>
                    <span>₹${Number(ord.subtotal || ord.total_amount).toLocaleString()}</span>
                </div>
                ${ord.discount ? `<div class="total-line"><span>Discount</span><span style="color:#16a34a;">−₹${Number(ord.discount).toLocaleString()}</span></div>` : ''}
                <div class="total-line">
                    <span>Shipping</span>
                    <span>${Number(ord.shipping_fee) > 0 ? '₹' + Number(ord.shipping_fee).toLocaleString() : 'Free'}</span>
                </div>
                <div class="total-line grand">
                    <span>Grand Total</span>
                    <span>₹${Number(ord.total_amount).toLocaleString()}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="label-footer">
            <p>Thank you for shopping at <strong>Hijaz</strong> ✨</p>
            <p>Printed on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>
    </div>

    <div class="no-print" style="text-align:center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 28px; background: #d4af37; color: #111; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;">🖨️ Print / Save as PDF</button>
    </div>

    <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

            const labelWindow = window.open('', '_blank', 'width=780,height=900,scrollbars=yes');
            if (labelWindow) {
                labelWindow.document.open();
                labelWindow.document.write(labelHtml);
                labelWindow.document.close();
                showToast(`Shipping label for ${ord.order_number} opened`);
            } else {
                alert('Popup blocked. Please allow popups for this page and try again.');
            }
        }

        // ─── Modal Actions (Product) ───
        const productModal = document.getElementById('product-modal');
        const btnAddProduct = document.getElementById('btn-add-product');
        const btnCloseModal = document.getElementById('btn-close-modal');
        const productForm = document.getElementById('product-form');
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const uploadPrompt = document.getElementById('upload-prompt');
        const previewWrapper = document.getElementById('preview-wrapper');
        const imagePreview = document.getElementById('image-preview');
        const btnRemoveImage = document.getElementById('btn-remove-image');

        // ─── Gallery & Embed Helpers ───
        function addGalleryInput(value = '') {
            const list = document.getElementById('gallery-inputs-list');
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
            row.innerHTML = `
                <input type="text" class="form-input gallery-url-input" value="${value}"
                    placeholder="https://... extra image URL"
                    style="flex:1; font-size:0.82rem;">
                <button type="button" onclick="this.parentElement.remove()"
                    style="padding:0.45rem; border-radius:8px; border:1px solid rgba(239,68,68,0.3); background:rgba(239,68,68,0.08); color:#f87171; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="x" style="width:13px; height:13px;"></i>
                </button>`;
            list.appendChild(row);
            lucide.createIcons();
        }

        function addEmbedInput(value = '') {
            const list = document.getElementById('embed-inputs-list');
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
            row.innerHTML = `
                <input type="text" class="form-input embed-url-input" value="${value}"
                    placeholder="https://www.youtube.com/embed/... or instagram reel embed"
                    style="flex:1; font-size:0.82rem;">
                <button type="button" onclick="this.parentElement.remove()"
                    style="padding:0.45rem; border-radius:8px; border:1px solid rgba(239,68,68,0.3); background:rgba(239,68,68,0.08); color:#f87171; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="x" style="width:13px; height:13px;"></i>
                </button>`;
            list.appendChild(row);
            lucide.createIcons();
        }

        function openProductModal(prod = null) {
            currentEditProduct = prod;
            selectedFile = null;
            const currentCat = prod ? (prod.category || activeCategory) : activeCategory;
            const targetCat = (currentCat === 'oud' || currentCat === 'fragrance') ? 'pillows' : currentCat;
            const cfg = CATEGORY_CONFIG[targetCat] || CATEGORY_CONFIG['pillows'];

            document.getElementById('modal-title').textContent = prod ? 'Edit Product' : 'Add New Product';
            document.getElementById('modal-category-label').innerHTML = `<span>${cfg.icon}</span><span style="font-weight: 600;">${cfg.label}</span>`;
            document.getElementById('submit-text').textContent = prod ? 'Save Changes' : 'Create Product';

            document.getElementById('btn-submit-form').style.background = `linear-gradient(135deg, ${cfg.bg}, ${cfg.panel})`;
            const formCatSelect = document.getElementById('form-category');
            if (formCatSelect) {
                formCatSelect.value = targetCat;
            }
            toggleBeddingSizeGroup();
            setBeddingTypeUI(prod ? (prod.bedding_type || 'king') : 'king');

            // Reset gallery & embed lists
            document.getElementById('gallery-inputs-list').innerHTML = '';
            document.getElementById('embed-inputs-list').innerHTML = '';
            document.getElementById('form-thumbnail').value = '';

            if (prod) {
                document.getElementById('form-edit-id').value = prod.id;
                document.getElementById('form-name').value = prod.name || '';
                document.getElementById('form-subtitle').value = prod.subtitle || '';
                document.getElementById('form-description').value = prod.description || '';
                document.getElementById('form-price').value = prod.price || '';
                document.getElementById('form-original-price').value = prod.originalPrice || '';
                document.getElementById('form-badge').value = prod.badge || '';
                document.getElementById('form-rating').value = prod.rating || 4.5;
                document.getElementById('form-reviews').value = prod.reviews || 0;

                // Populate gallery images
                const imgs = Array.isArray(prod.images) ? prod.images : [];
                imgs.forEach(url => addGalleryInput(url));

                // Populate thumbnail
                if (prod.thumbnail) {
                    document.getElementById('form-thumbnail').value = prod.thumbnail;
                }

                // Populate embed URLs
                const embeds = Array.isArray(prod.embed_urls) ? prod.embed_urls : [];
                embeds.forEach(url => addEmbedInput(url));

                if (prod.image) {
                    imagePreview.src = prod.image;
                    uploadPrompt.style.display = 'none';
                    previewWrapper.style.display = 'flex';
                } else {
                    uploadPrompt.style.display = 'flex';
                    previewWrapper.style.display = 'none';
                }
            } else {
                productForm.reset();
                document.getElementById('form-edit-id').value = '';
                document.getElementById('form-rating').value = '4.5';
                document.getElementById('form-reviews').value = '0';
                document.getElementById('form-thumbnail').value = '';
                uploadPrompt.style.display = 'flex';
                previewWrapper.style.display = 'none';
            }

            productModal.style.display = 'flex';
        }

                // â”€â”€â”€ Bedding Size Selector Helpers â”€â”€â”€
        function toggleBeddingSizeGroup() {
            const cat = document.getElementById('form-category');
            const group = document.getElementById('bedding-size-group');
            if (!cat || !group) return;
            group.style.display = (cat.value === 'bedding') ? 'block' : 'none';
        }

        function setBeddingTypeUI(val) {
            const sizes = ['king', 'queen', 'single'];
            sizes.forEach(s => {
                const radio = document.getElementById('bedding-' + s);
                const lbl   = document.getElementById('bedding-opt-' + s);
                if (!radio || !lbl) return;
                const active = (s === val);
                radio.checked = active;
                lbl.style.border     = active ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.1)';
                lbl.style.background = active
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(122,78,45,0.12))'
                    : 'rgba(255,255,255,0.03)';
                lbl.querySelector('span:nth-child(3)').style.color = active ? '#d4af37' : 'white';
            });
        }

        // Attach visual feedback to the radio-label buttons
        ['king','queen','single'].forEach(s => {
            const lbl = document.getElementById('bedding-opt-' + s);
            if (lbl) lbl.addEventListener('click', () => setBeddingTypeUI(s));
        });
function closeModal() {
            productModal.style.display = 'none';
        }

        btnAddProduct.onclick = () => openProductModal(null);
        btnCloseModal.onclick = closeModal;
        productModal.onclick = (e) => { if (e.target === productModal) closeModal(); };

        // Drag & Drop Image Handlers
        dropZone.onclick = (e) => { if (e.target !== btnRemoveImage && !btnRemoveImage.contains(e.target)) fileInput.click(); };
        fileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                selectedFile = e.target.files[0];
                imagePreview.src = URL.createObjectURL(selectedFile);
                uploadPrompt.style.display = 'none';
                previewWrapper.style.display = 'flex';
            }
        };

        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
        dropZone.ondragleave = () => dropZone.classList.remove('dragover');
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                selectedFile = e.dataTransfer.files[0];
                imagePreview.src = URL.createObjectURL(selectedFile);
                uploadPrompt.style.display = 'none';
                previewWrapper.style.display = 'flex';
            }
        };

        btnRemoveImage.onclick = (e) => {
            e.stopPropagation();
            selectedFile = null;
            imagePreview.src = '';
            fileInput.value = '';
            uploadPrompt.style.display = 'flex';
            previewWrapper.style.display = 'none';
        };

        // ─── Form Submit (AJAX Create / Update Product) ───
        productForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('form-name').value;
            const price = document.getElementById('form-price').value;

            if (!name || !price) {
                alert('Please fill out Product Name and Price.');
                return;
            }

            const formData = new FormData();
            const formCatSelect = document.getElementById('form-category');
            const chosenCategory = formCatSelect ? formCatSelect.value : activeCategory;
            formData.append('category', chosenCategory);
            if (chosenCategory === 'bedding') {
                const beddingRadio = document.querySelector('input[name="bedding_type"]:checked');
                if (beddingRadio) formData.append('bedding_type', beddingRadio.value);
            }
            formData.append('name', name);
            formData.append('subtitle', document.getElementById('form-subtitle').value || '');
            formData.append('description', document.getElementById('form-description').value || '');
            formData.append('price', price);

            const origPrice = document.getElementById('form-original-price').value;
            if (origPrice) formData.append('originalPrice', origPrice);

            const badge = document.getElementById('form-badge').value;
            if (badge) formData.append('badge', badge);

            formData.append('rating', document.getElementById('form-rating').value || '4.5');
            formData.append('reviews', document.getElementById('form-reviews').value || '0');

            if (selectedFile) {
                formData.append('image', selectedFile);
            } else if (currentEditProduct && currentEditProduct.image) {
                formData.append('image', currentEditProduct.image);
            }

            // Collect gallery image URLs
            document.querySelectorAll('.gallery-url-input').forEach((inp, i) => {
                const val = inp.value.trim();
                if (val) formData.append(`images[${i}]`, val);
            });

            // Thumbnail override
            const thumbVal = document.getElementById('form-thumbnail').value.trim();
            if (thumbVal) formData.append('thumbnail', thumbVal);

            // Collect embed URLs (Instagram Reels / YouTube)
            document.querySelectorAll('.embed-url-input').forEach((inp, i) => {
                const val = inp.value.trim();
                if (val) formData.append(`embed_urls[${i}]`, val);
            });

            try {
                let url = '/api/products';
                if (currentEditProduct) {
                    url = `/api/products/${currentEditProduct.id}`;
                    formData.append('_method', 'PUT');
                }

                const res = await fetch(url, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    closeModal();
                    fetchProducts();
                    showToast(currentEditProduct ? 'Product updated' : 'Product created');
                } else {
                    alert('Failed to save product.');
                }
            } catch (err) {
                console.error(err);
                alert('Error saving product.');
            }
        };

        // ─── Delete Product ───
        async function deleteProduct(id) {
            if (!confirm('Are you sure you want to delete this product?')) return;
            try {
                const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchProducts();
                    showToast('Product deleted');
                } else {
                    alert('Failed to delete product.');
                }
            } catch (err) {
                console.error(err);
                alert('Error deleting product.');
            }
        }

        // ─── Reset All Products ───
        const btnResetAll = document.getElementById('btn-reset-all');
        const resetText = document.getElementById('reset-text');

        btnResetAll.onclick = async () => {
            if (confirmReset) {
                try {
                    const res = await fetch('/api/products/reset', { method: 'POST' });
                    if (res.ok) {
                        confirmReset = false;
                        resetText.textContent = 'Clear Products';
                        btnResetAll.style.borderColor = 'rgba(255,255,255,0.1)';
                        btnResetAll.style.color = 'rgba(255,255,255,0.5)';
                        btnResetAll.style.background = 'rgba(255,255,255,0.02)';
                        fetchProducts();
                        showToast('All products reset to default');
                    } else {
                        alert('Failed to clear products.');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error clearing products.');
                }
            } else {
                confirmReset = true;
                resetText.textContent = 'Confirm Clear';
                btnResetAll.style.borderColor = 'rgba(239,68,68,0.4)';
                btnResetAll.style.color = '#ef4444';
                btnResetAll.style.background = 'rgba(239,68,68,0.1)';
                if (resetTimer) clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    confirmReset = false;
                    resetText.textContent = 'Clear Products';
                    btnResetAll.style.borderColor = 'rgba(255,255,255,0.1)';
                    btnResetAll.style.color = 'rgba(255,255,255,0.5)';
                    btnResetAll.style.background = 'rgba(255,255,255,0.02)';
                }, 3000);
            }
        };
    </script>
</body>

</html>