const NovaNotifications = {

    userId:
        null,

    notifications:
        [],

    unreadCount:
        0,


    async init() {

        const {
            data,
            error
        } =
            await NovaSupabase
                .auth
                .getUser();


        if (
            error
            ||
            !data?.user
        ) {

            return;

        }


        this.userId =
            data.user.id;


        this.createBell();


        await this.loadNotifications();


        this.startPolling();

    },


    createBell() {

        const header =
            document.getElementById(
                "header"
            );


        if (
            !header
        ) {

            return;

        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "nova-notification-wrap";


        wrapper.innerHTML =
            `
                <button
                    id="novaNotificationButton"
                    class="nova-notification-button"
                    type="button"
                    title="Notifications"
                >
                    🔔

                    <span
                        id="novaNotificationBadge"
                        class="nova-notification-badge"
                        hidden
                    >
                        0
                    </span>
                </button>


                <div
                    id="novaNotificationPanel"
                    class="nova-notification-panel"
                    hidden
                >

                    <div class="nova-notification-header">

                        <strong>
                            Notifications
                        </strong>

                        <button
                            id="novaNotificationReadAll"
                            type="button"
                        >
                            Mark all read
                        </button>

                    </div>


                    <div
                        id="novaNotificationList"
                        class="nova-notification-list"
                    >
                        Loading...
                    </div>

                </div>
            `;


        header.appendChild(
            wrapper
        );


        document
            .getElementById(
                "novaNotificationButton"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    this.togglePanel();

                }
            );


        document
            .getElementById(
                "novaNotificationPanel"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                }
            );


        document
            .getElementById(
                "novaNotificationReadAll"
            )
            ?.addEventListener(
                "click",
                async () => {

                    await this.markAllRead();

                }
            );


        document.addEventListener(
            "click",
            () => {

                this.closePanel();

            }
        );


        this.injectStyles();

    },


    injectStyles() {

        if (
            document.getElementById(
                "novaNotificationStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "novaNotificationStyles";


        style.textContent =
            `
                .nova-notification-wrap {

                    position:
                        relative;

                    margin-left:
                        auto;

                    display:
                        flex;

                    align-items:
                        center;

                }


                .nova-notification-button {

                    position:
                        relative;

                    display:
                        inline-flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    width:
                        38px;

                    height:
                        38px;

                    color:
                        #f4efff;

                    font-size:
                        17px;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.07
                        );

                    border:
                        1px solid
                        rgba(
                            194,
                            174,
                            236,
                            0.25
                        );

                    border-radius:
                        8px;

                    cursor:
                        pointer;

                }


                .nova-notification-button:hover {

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.12
                        );

                }


                .nova-notification-badge {

                    position:
                        absolute;

                    top:
                        -5px;

                    right:
                        -5px;

                    min-width:
                        16px;

                    height:
                        16px;

                    padding:
                        0 4px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    color:
                        white;

                    font-size:
                        8px;

                    font-weight:
                        900;

                    background:
                        #b84f5b;

                    border:
                        2px solid
                        #222138;

                    border-radius:
                        999px;

                    box-sizing:
                        border-box;

                }


                .nova-notification-panel {

                    position:
                        absolute;

                    top:
                        46px;

                    right:
                        0;

                    z-index:
                        9999;

                    width:
                        min(
                            360px,
                            calc(
                                100vw - 24px
                            )
                        );

                    overflow:
                        hidden;

                    color:
                        #4c4053;

                    background:
                        #fffaf0;

                    border:
                        1px solid
                        #bfaec7;

                    border-radius:
                        10px;

                    box-shadow:
                        0 16px 38px
                        rgba(
                            5,
                            5,
                            15,
                            0.34
                        );

                }


                .nova-notification-panel[hidden] {

                    display:
                        none !important;

                }


                .nova-notification-header {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        12px;

                    padding:
                        11px 13px;

                    color:
                        #f6f1ff;

                    background:
                        linear-gradient(
                            110deg,
                            #27243f,
                            #1d1c2f
                        );

                    border-bottom:
                        1px solid
                        #bfaec7;

                }


                .nova-notification-header strong {

                    font-size:
                        11px;

                }


                .nova-notification-header button {

                    padding:
                        0;

                    color:
                        #cbbdea;

                    font:
                        inherit;

                    font-size:
                        8px;

                    background:
                        none;

                    border:
                        0;

                    cursor:
                        pointer;

                }


                .nova-notification-header button:hover {

                    color:
                        white;

                    text-decoration:
                        underline;

                }


                .nova-notification-list {

                    max-height:
                        420px;

                    overflow-y:
                        auto;

                }


                .nova-notification-item {

                    display:
                        grid;

                    grid-template-columns:
                        34px
                        minmax(
                            0,
                            1fr
                        );

                    gap:
                        9px;

                    padding:
                        11px 12px;

                    background:
                        #fffaf0;

                    border-bottom:
                        1px solid
                        #e1d5e4;

                    cursor:
                        pointer;

                }


                .nova-notification-item:hover {

                    background:
                        #f6eef7;

                }


                .nova-notification-item.unread {

                    background:
                        #eee7f5;

                }


                .nova-notification-item.unread:hover {

                    background:
                        #e7dcef;

                }


                .nova-notification-icon {

                    width:
                        34px;

                    height:
                        34px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    font-size:
                        16px;

                    background:
                        #ded2e8;

                    border-radius:
                        8px;

                }


                .nova-notification-title {

                    margin-bottom:
                        3px;

                    color:
                        #45394c;

                    font-size:
                        10px;

                    font-weight:
                        900;

                }


                .nova-notification-message {

                    color:
                        #706277;

                    font-size:
                        9px;

                    line-height:
                        1.45;

                }


                .nova-notification-time {

                    margin-top:
                        4px;

                    color:
                        #a093a6;

                    font-size:
                        7px;

                }


                .nova-notification-empty {

                    padding:
                        28px 15px;

                    color:
                        #88798f;

                    font-size:
                        9px;

                    text-align:
                        center;

                }


                @media (
                    max-width:
                        560px
                ) {

                    .nova-notification-panel {

                        position:
                            fixed;

                        top:
                            72px;

                        right:
                            10px;

                        left:
                            10px;

                        width:
                            auto;

                    }

                }
            `;


        document.head
            .appendChild(
                style
            );

    },


    async loadNotifications() {

        if (
            !this.userId
        ) {

            return;

        }


        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "notifications"
                )
                .select(
                    `
                    id,
                    type,
                    title,
                    message,
                    actor_id,
                    entity_id,
                    is_read,
                    created_at
                    `
                )
                .eq(
                    "user_id",
                    this.userId
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    30
                );


        if (
            error
        ) {

            console.error(
                "Nova notifications:",
                error
            );


            return;

        }


        this.notifications =
            data
            ||
            [];


        this.unreadCount =
            this.notifications
                .filter(
                    item =>
                        !item.is_read
                )
                .length;


        this.renderBadge();


        this.renderList();

    },


    renderBadge() {

        const badge =
            document.getElementById(
                "novaNotificationBadge"
            );


        if (
            !badge
        ) {

            return;

        }


        if (
            this.unreadCount <=
            0
        ) {

            badge.hidden =
                true;

            return;

        }


        badge.hidden =
            false;


        badge.textContent =
            this.unreadCount >
            99
                ?
                "99+"
                :
                String(
                    this.unreadCount
                );

    },


    renderList() {

        const list =
            document.getElementById(
                "novaNotificationList"
            );


        if (
            !list
        ) {

            return;

        }


        list.innerHTML =
            "";


        if (
            this.notifications.length ===
            0
        ) {

            list.innerHTML =
                `
                    <div class="nova-notification-empty">
                        Nothing happened.
                        Suspiciously peaceful.
                    </div>
                `;


            return;

        }


        this.notifications
            .forEach(
                notification => {


                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "nova-notification-item";


                    if (
                        !notification.is_read
                    ) {

                        item.classList.add(
                            "unread"
                        );

                    }


                    item.innerHTML =
                        `
                            <div class="nova-notification-icon">
                                ${this.getIcon(
                                    notification.type
                                )}
                            </div>


                            <div>

                                <div class="nova-notification-title">
                                    ${this.escapeHtml(
                                        notification.title
                                    )}
                                </div>


                                <div class="nova-notification-message">
                                    ${this.escapeHtml(
                                        notification.message
                                    )}
                                </div>


                                <div class="nova-notification-time">
                                    ${this.formatTime(
                                        notification.created_at
                                    )}
                                </div>

                            </div>
                        `;


                    item.addEventListener(
                        "click",
                        async () => {

                            await this.openNotification(
                                notification
                            );

                        }
                    );


                    list.appendChild(
                        item
                    );

                }
            );

    },


    async openNotification(
        notification
    ) {

        if (
            !notification.is_read
        ) {

            await this.markRead(
                notification.id
            );

        }


        switch (
            notification.type
        ) {

            case "friend_request":

                window.location.href =
                    "friends.html";

                break;


            case "friend_accepted":

                if (
                    notification.actor_id
                ) {

                    window.location.href =
                        `profile.html?id=${encodeURIComponent(
                            notification.actor_id
                        )}`;

                }
                else {

                    window.location.href =
                        "friends.html";

                }

                break;


            case "verified":

                window.location.href =
                    "profile.html";

                break;


            default:

                this.closePanel();

                break;

        }

    },


    async markRead(
        notificationId
    ) {

        const {
            error
        } =
            await NovaSupabase
                .from(
                    "notifications"
                )
                .update(
                    {
                        is_read:
                            true
                    }
                )
                .eq(
                    "id",
                    notificationId
                )
                .eq(
                    "user_id",
                    this.userId
                );


        if (
            error
        ) {

            console.error(
                "Notification read:",
                error
            );


            return;

        }


        const notification =
            this.notifications
                .find(
                    item =>
                        item.id ===
                        notificationId
                );


        if (
            notification
        ) {

            notification.is_read =
                true;

        }


        this.unreadCount =
            this.notifications
                .filter(
                    item =>
                        !item.is_read
                )
                .length;


        this.renderBadge();

        this.renderList();

    },


    async markAllRead() {

        if (
            !this.userId
        ) {

            return;

        }


        const {
            error
        } =
            await NovaSupabase
                .from(
                    "notifications"
                )
                .update(
                    {
                        is_read:
                            true
                    }
                )
                .eq(
                    "user_id",
                    this.userId
                )
                .eq(
                    "is_read",
                    false
                );


        if (
            error
        ) {

            console.error(
                "Mark all notifications read:",
                error
            );


            return;

        }


        this.notifications
            .forEach(
                item => {

                    item.is_read =
                        true;

                }
            );


        this.unreadCount =
            0;


        this.renderBadge();

        this.renderList();

    },


    togglePanel() {

        const panel =
            document.getElementById(
                "novaNotificationPanel"
            );


        if (
            !panel
        ) {

            return;

        }


        panel.hidden =
            !panel.hidden;

    },


    closePanel() {

        const panel =
            document.getElementById(
                "novaNotificationPanel"
            );


        if (
            panel
        ) {

            panel.hidden =
                true;

        }

    },


    startPolling() {

        setInterval(
            () => {

                this.loadNotifications();

            },
            15000
        );

    },


    getIcon(
        type
    ) {

        switch (
            type
        ) {

            case "friend_request":
                return "☺";

            case "friend_accepted":
                return "✓";

            case "verified":
                return "★";

            default:
                return "✦";

        }

    },


    formatTime(
        value
    ) {

        if (
            !value
        ) {

            return "";

        }


        const date =
            new Date(
                value
            );


        const difference =
            Date.now()
            -
            date.getTime();


        const minutes =
            Math.floor(
                difference /
                60000
            );


        if (
            minutes <
            1
        ) {

            return "just now";

        }


        if (
            minutes <
            60
        ) {

            return `${minutes}m ago`;

        }


        const hours =
            Math.floor(
                minutes /
                60
            );


        if (
            hours <
            24
        ) {

            return `${hours}h ago`;

        }


        const days =
            Math.floor(
                hours /
                24
            );


        if (
            days <
            7
        ) {

            return `${days}d ago`;

        }


        return date
            .toLocaleDateString();

    },


    escapeHtml(
        value
    ) {

        return String(
            value
            ??
            ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                "\"",
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }

};


window.NovaNotifications =
    NovaNotifications;