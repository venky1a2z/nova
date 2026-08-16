function renderShell() {

    renderHeader();

    loadAds();

}


function renderHeader() {

    const header =
        document.getElementById(
            "header"
        );


    if (!header) {
        return;
    }


    let accountArea = `

        <a
            class="login-link"
            href="login.html"
        >
            Login
        </a>

        <a
            class="signup-button"
            href="signup.html"
        >
            Join Nova ☕
        </a>

    `;


    if (
        typeof NovaAuth !==
        "undefined"
    ) {

        const user =
            NovaAuth.getCurrentUser();


        if (user) {

            accountArea = `

                <a
                    class="login-link"
                    href="profile.html"
                >
                    ☕ ${escapeHtml(
                        user.username
                    )}
                </a>

                <a
                    class="signup-button"
                    href="profile.html"
                >
                    My Profile
                </a>

            `;

        }

    }


    header.innerHTML = `

        <header class="top-banner">


            <img
                class="banner-scene"
                src="assets/backgrounds/banner.png"
                alt=""
            >


            <div
                class="banner-overlay"
            ></div>


            ${accountArea}


            <a href="index.html">

                <img
                    class="top-banner-logo"
                    src="assets/logo/nova-logo.png"
                    alt="Nova"
                >

            </a>


        </header>


        <nav class="top-nav">


            <a href="index.html">
                My NOVA
            </a>


            <a href="games.html">
                Games
            </a>


            <a href="catalog.html">
                Catalog
            </a>


            <a href="creator.html">
                Creator
            </a>


            <a href="people.html">
                People
            </a>


            <a href="groups.html">
                Groups
            </a>


            <a href="forum.html">
                Forum
            </a>


            <a href="help.html">
                Help
            </a>


        </nav>

    `;

}


function loadAds() {

    const container =
        document.getElementById(
            "ads"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    for (
        let number = 1;
        number <= 30;
        number++
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            `assets/ads/ad${number}.png`;


        image.alt =
            "Nova Community Poster";


        image.onerror =
            () => {

                image.remove();

            };


        container.appendChild(
            image
        );

    }

}


function escapeHtml(
    value
) {

    return String(
        value
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