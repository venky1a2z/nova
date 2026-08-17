const NovaPeople = {


    currentUserId:
        null,


    verifiedIds:
        new Set(),


    /* =====================================================
       INIT
    ====================================================== */

    async init() {


        await this.loadCurrentUser();


        this.setupSearch();


        await this.loadPeople();

    },



    /* =====================================================
       CURRENT USER
    ====================================================== */

    async loadCurrentUser() {


        try {


            const {
                data,
                error
            } =
                await NovaSupabase
                    .auth
                    .getUser();


            if (
                error
            ) {

                console.warn(
                    "People auth:",
                    error
                );


                return;

            }


            this.currentUserId =
                data?.user?.id
                ||
                null;


        }
        catch (
            error
        ) {

            console.warn(
                "People auth failed:",
                error
            );

        }

    },



    /* =====================================================
       SEARCH CONTROLS
    ====================================================== */

    setupSearch() {


        const input =
            document.getElementById(
                "peopleSearchInput"
            );


        const button =
            document.getElementById(
                "peopleSearchButton"
            );


        if (
            !input
            ||
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            () => {

                this.search(
                    input.value
                );

            }
        );


        input.addEventListener(
            "keydown",
            event => {


                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();


                    this.search(
                        input.value
                    );

                }

            }
        );


        input.addEventListener(
            "input",
            () => {


                if (
                    input.value
                        .trim()
                        .length ===
                    0
                ) {

                    this.loadPeople();

                }

            }
        );

    },



    /* =====================================================
       LOAD PEOPLE
    ====================================================== */

    async loadPeople() {


        this.setTitle(
            "Around Nova"
        );


        this.setNote(
            ""
        );


        this.showLoading(
            "Looking around Nova..."
        );


        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .select(
                    `
                    id,
                    username,
                    display_name,
                    bio,
                    avatar_url,
                    created_at
                    `
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    24
                );


        if (
            error
        ) {

            console.error(
                "People load:",
                error
            );


            this.showMessage(
                "Nova couldn't find anybody. Very suspicious."
            );


            return;

        }


        const profiles =
            data
            ||
            [];


        await this.loadVerification(
            profiles
        );


        this.renderPeople(
            profiles
        );

    },



    /* =====================================================
       SEARCH
    ====================================================== */

    async search(
        rawQuery
    ) {


        const query =
            String(
                rawQuery
                ||
                ""
            )
                .trim();


        if (
            query.length ===
            0
        ) {

            await this.loadPeople();

            return;

        }


        if (
            query.length <
            2
        ) {

            this.setTitle(
                "Search"
            );


            this.setNote(
                ""
            );


            this.showMessage(
                "Type at least two characters. Nova is not psychic yet."
            );


            return;

        }


        this.setTitle(
            `Results for "${query}"`
        );


        this.showLoading(
            "Searching the population..."
        );


        /*
         * Keep characters that are safe
         * inside a PostgREST OR filter.
         */

        const safeQuery =
            query
                .replace(
                    /[%_,()]/g,
                    ""
                )
                .trim();


        if (
            safeQuery.length <
            2
        ) {

            this.showMessage(
                "Try a slightly less mysterious search."
            );


            return;

        }


        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .select(
                    `
                    id,
                    username,
                    display_name,
                    bio,
                    avatar_url,
                    created_at
                    `
                )
                .or(
                    `username.ilike.%${safeQuery}%,display_name.ilike.%${safeQuery}%`
                )
                .limit(
                    24
                );


        if (
            error
        ) {

            console.error(
                "People search:",
                error
            );


            this.showMessage(
                "Search broke. Somebody probably touched something."
            );


            return;

        }


        const profiles =
            data
            ||
            [];


        await this.loadVerification(
            profiles
        );


        this.setNote(
            profiles.length ===
            1
                ?
                "1 person found"
                :
                `${profiles.length} people found`
        );


        this.renderPeople(
            profiles
        );

    },



    /* =====================================================
       VERIFIED USERS
    ====================================================== */

    async loadVerification(
        profiles
    ) {


        this.verifiedIds =
            new Set();


        const ids =
            profiles
                .map(
                    profile =>
                        profile.id
                )
                .filter(
                    Boolean
                );


        if (
            ids.length ===
            0
        ) {

            return;

        }


        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "verified_users"
                )
                .select(
                    "user_id"
                )
                .in(
                    "user_id",
                    ids
                );


        if (
            error
        ) {

            console.warn(
                "Verification lookup:",
                error
            );


            return;

        }


        this.verifiedIds =
            new Set(
                (
                    data
                    ||
                    []
                )
                    .map(
                        row =>
                            row.user_id
                    )
            );

    },



    /* =====================================================
       RENDER
    ====================================================== */

    renderPeople(
        profiles
    ) {


        const grid =
            document.getElementById(
                "peopleGrid"
            );


        if (
            !grid
        ) {

            return;

        }


        grid.innerHTML =
            "";


        if (
            profiles.length ===
            0
        ) {

            this.showMessage(
                "Nobody matched that search. They may have escaped."
            );


            return;

        }


        profiles.forEach(
            profile => {


                grid.appendChild(
                    this.createPersonCard(
                        profile
                    )
                );

            }
        );

    },



    /* =====================================================
       CARD
    ====================================================== */

    createPersonCard(
        profile
    ) {


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "person-card";


        const main =
            document.createElement(
                "div"
            );


        main.className =
            "person-main";


        /* AVATAR */

        const avatarLink =
            document.createElement(
                "a"
            );


        avatarLink.className =
            "person-avatar-link";


        avatarLink.href =
            `profile.html?id=${encodeURIComponent(
                profile.id
            )}`;


        const avatar =
            document.createElement(
                "img"
            );


        avatar.className =
            "person-avatar";


        avatar.src =
            profile.avatar_url
            ||
            "assets/avatars/guest.png";


        avatar.alt =
            `${profile.username}'s profile picture`;


        avatarLink.appendChild(
            avatar
        );


        /* INFO */

        const info =
            document.createElement(
                "div"
            );


        info.className =
            "person-info";


        const nameRow =
            document.createElement(
                "div"
            );


        nameRow.className =
            "person-name-row";


        const name =
            document.createElement(
                "a"
            );


        name.className =
            "person-display-name";


        name.href =
            `profile.html?id=${encodeURIComponent(
                profile.id
            )}`;


        name.textContent =
            profile.display_name
            ||
            profile.username;


        nameRow.appendChild(
            name
        );


        if (
            this.verifiedIds
                .has(
                    profile.id
                )
        ) {


            const verified =
                document.createElement(
                    "img"
                );


            verified.className =
                "person-verified";


            verified.src =
                "assets/decorations/verified.png";


            verified.alt =
                "Verified";


            verified.title =
                "Verified Nova user";


            nameRow.appendChild(
                verified
            );

        }


        const username =
            document.createElement(
                "div"
            );


        username.className =
            "person-username";


        username.textContent =
            `@${profile.username}`;


        const bio =
            document.createElement(
                "div"
            );


        bio.className =
            "person-bio";


        bio.textContent =
            profile.bio
            ||
            "This user has wisely chosen not to explain themselves.";


        info.appendChild(
            nameRow
        );


        info.appendChild(
            username
        );


        info.appendChild(
            bio
        );


        main.appendChild(
            avatarLink
        );


        main.appendChild(
            info
        );


        card.appendChild(
            main
        );


        /* ACTIONS */

        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "person-actions";


        const profileButton =
            document.createElement(
                "a"
            );


        profileButton.className =
            "retro-button";


        profileButton.href =
            `profile.html?id=${encodeURIComponent(
                profile.id
            )}`;


        profileButton.textContent =
            "View Profile";


        actions.appendChild(
            profileButton
        );


        /*
         * IMPORTANT:
         *
         * Your own account NEVER gets
         * an Add Friend button.
         */

        if (
            this.currentUserId
            &&
            profile.id ===
                this.currentUserId
        ) {


            const self =
                document.createElement(
                    "span"
                );


            self.className =
                "person-self-label";


            self.textContent =
                "That's you. Probably.";


            actions.appendChild(
                self
            );

        }
        else {


            const friendButton =
                document.createElement(
                    "button"
                );


            friendButton.className =
                "retro-button play-button";


            friendButton.type =
                "button";


            friendButton.textContent =
                this.currentUserId
                    ?
                    "＋ Add Friend"
                    :
                    "Log in to Friend";


            friendButton.addEventListener(
                "click",
                async () => {


                    if (
                        !this.currentUserId
                    ) {

                        window.location.href =
                            "login.html";


                        return;

                    }


                    await this.sendFriendRequest(
                        profile,
                        friendButton
                    );

                }
            );


            actions.appendChild(
                friendButton
            );

        }


        card.appendChild(
            actions
        );


        return card;

    },



    /* =====================================================
       FRIEND REQUEST
    ====================================================== */

    async sendFriendRequest(
        profile,
        button
    ) {


        /*
         * Extra client-side protection
         * against self-friending.
         */

        if (
            profile.id ===
            this.currentUserId
        ) {

            return;

        }


        button.disabled =
            true;


        button.textContent =
            "Sending...";


        const result =
            await NovaFriends
                .sendRequest(
                    profile.id
                );


        if (
            result.success
        ) {

            button.textContent =
                "Request Sent";


            return;

        }


        /*
         * Existing friendships / requests
         * are not fatal.
         */

        if (
            result.message ===
            "You are already friends."
        ) {

            button.textContent =
                "✓ Friends";


            return;

        }


        if (
            result.message ===
            "A friend request already exists."
        ) {

            button.textContent =
                "Request Pending";


            return;

        }


        button.disabled =
            false;


        button.textContent =
            "＋ Add Friend";


        alert(
            result.message
            ||
            "Nova failed to send the request."
        );

    },



    /* =====================================================
       UI HELPERS
    ====================================================== */

    setTitle(
        text
    ) {


        const element =
            document.getElementById(
                "peopleSectionTitle"
            );


        if (
            element
        ) {

            element.textContent =
                text;

        }

    },


    setNote(
        text
    ) {


        const element =
            document.getElementById(
                "peopleResultNote"
            );


        if (
            element
        ) {

            element.textContent =
                text;

        }

    },


    showLoading(
        text
    ) {


        const grid =
            document.getElementById(
                "peopleGrid"
            );


        if (
            !grid
        ) {

            return;

        }


        grid.innerHTML =
            "";


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "people-message";


        message.textContent =
            text;


        grid.appendChild(
            message
        );

    },


    showMessage(
        text
    ) {


        this.showLoading(
            text
        );

    }

};


window.NovaPeople =
    NovaPeople;