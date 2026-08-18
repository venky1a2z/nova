const NovaAuth = {


    currentUserCache:
        null,


    /* =====================================================
       CONSTANTS
    ====================================================== */

    USER_CACHE_KEY:
        "nova_current_user",


    GUEST_MODE_KEY:
        "nova_guest_mode",


    GUEST_ID_KEY:
        "nova_guest_id",



    /* =====================================================
       SESSION REFRESH
    ====================================================== */

    async refreshSession() {


        /*
            Guest mode should not attempt
            to become a Supabase account.
        */

        if (
            this.isGuest()
        ) {


            const guest =
                this.getGuestUser();


            this.currentUserCache =
                guest;


            return guest;

        }


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
                ||
                !data?.user
            ) {


                this.currentUserCache =
                    null;


                this.clearUserCache();


                return null;

            }


            const authUser =
                data.user;


            const {
                data:
                    profile,
                error:
                    profileError
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
                        skin,
                        face,
                        shirt,
                        pants,
                        hat,
                        created_at,
                        updated_at
                        `
                    )
                    .eq(
                        "id",
                        authUser.id
                    )
                    .maybeSingle();


            if (
                profileError
            ) {

                console.warn(
                    "Nova profile refresh:",
                    profileError
                );

            }


            if (
                profile
            ) {


                this.currentUserCache =
                    this.profileToLocalUser(
                        profile
                    );

            }
            else {


                this.currentUserCache = {

                    id:
                        authUser.id,

                    username:
                        authUser
                            .user_metadata
                            ?.username
                        ||
                        "NovaUser",

                    guest:
                        false,

                    character:
                        this.defaultCharacter()

                };

            }


            this.saveCache(
                this.currentUserCache
            );


            return this.currentUserCache;


        }
        catch (
            error
        ) {


            console.warn(
                "Nova session refresh:",
                error
            );


            return null;

        }

    },



    /* =====================================================
       GET CURRENT USER
    ====================================================== */

    getCurrentUser() {


        if (
            this.currentUserCache
        ) {

            return this.currentUserCache;

        }


        if (
            this.isGuest()
        ) {


            const guest =
                this.getGuestUser();


            this.currentUserCache =
                guest;


            return guest;

        }


        try {


            const cached =
                NovaStorage.get(
                    this.USER_CACHE_KEY,
                    null
                );


            if (
                cached
            ) {


                this.currentUserCache =
                    cached;


                return cached;

            }


        }
        catch (
            error
        ) {

            console.warn(
                "Nova cached user:",
                error
            );

        }


        return null;

    },



    /* =====================================================
       REAL LOGIN STATE
    ====================================================== */

    async isLoggedIn() {


        if (
            this.isGuest()
        ) {

            return false;

        }


        try {


            const {
                data
            } =
                await NovaSupabase
                    .auth
                    .getSession();


            return Boolean(
                data?.session
            );


        }
        catch (
            error
        ) {


            console.warn(
                "Nova auth status:",
                error
            );


            return false;

        }

    },



    /* =====================================================
       USERNAME LOGIN
    ====================================================== */

    async login(
        username,
        password
    ) {


        username =
            String(
                username
                ||
                ""
            )
                .trim();


        password =
            String(
                password
                ||
                ""
            );


        if (
            !username
            ||
            !password
        ) {


            return {

                success:
                    false,

                message:
                    "Enter your username and password."

            };

        }


        /*
            Leave guest mode before
            performing real login.
        */

        this.clearGuestMode();


        try {


            const {
                data,
                error
            } =
                await NovaSupabase
                    .functions
                    .invoke(
                        "username-login",
                        {

                            body: {

                                username,
                                password

                            }

                        }
                    );


            if (
                error
            ) {


                console.error(
                    "Nova username login:",
                    error
                );


                return {

                    success:
                        false,

                    message:
                        data?.message
                        ||
                        "Invalid username or password."

                };

            }


            if (
                !data?.success
                ||
                !data?.session
            ) {


                return {

                    success:
                        false,

                    message:
                        data?.message
                        ||
                        "Invalid username or password."

                };

            }


            const {
                error:
                    sessionError
            } =
                await NovaSupabase
                    .auth
                    .setSession(
                        {

                            access_token:
                                data
                                    .session
                                    .access_token,

                            refresh_token:
                                data
                                    .session
                                    .refresh_token

                        }
                    );


            if (
                sessionError
            ) {


                console.error(
                    "Nova set session:",
                    sessionError
                );


                return {

                    success:
                        false,

                    message:
                        "Nova verified your password but couldn't start the session."

                };

            }


            const user =
                await this.refreshSession();


            return {

                success:
                    true,

                user

            };


        }
        catch (
            error
        ) {


            console.error(
                "Nova login:",
                error
            );


            return {

                success:
                    false,

                message:
                    "Nova couldn't log you in right now."

            };

        }

    },



    /* =====================================================
       CREATE ACCOUNT
    ====================================================== */

    async createAccount(
        username,
        password,
        acceptedRules =
            false
    ) {


        username =
            String(
                username
                ||
                ""
            )
                .trim();


        password =
            String(
                password
                ||
                ""
            );


        if (
            !/^[A-Za-z0-9_]{3,20}$/
                .test(
                    username
                )
        ) {


            return {

                success:
                    false,

                message:
                    "Username must be 3-20 characters and only contain letters, numbers, or underscores."

            };

        }


        if (
            password.length <
            8
        ) {


            return {

                success:
                    false,

                message:
                    "Password must be at least 8 characters."

            };

        }


        if (
            acceptedRules !==
            true
        ) {


            return {

                success:
                    false,

                message:
                    "Please accept Nova's safety rules first."

            };

        }


        this.clearGuestMode();


        try {


            const {
                data,
                error
            } =
                await NovaSupabase
                    .functions
                    .invoke(
                        "username-signup",
                        {

                            body: {

                                username,

                                password,

                                acceptedRules:
                                    true

                            }

                        }
                    );


            if (
                error
            ) {


                console.error(
                    "Nova signup function:",
                    error
                );


                return {

                    success:
                        false,

                    message:
                        data?.message
                        ||
                        "Nova couldn't create the account."

                };

            }


            if (
                !data?.success
                ||
                !data?.session
            ) {


                return {

                    success:
                        false,

                    message:
                        data?.message
                        ||
                        "Nova couldn't create the account."

                };

            }


            const {
                error:
                    sessionError
            } =
                await NovaSupabase
                    .auth
                    .setSession(
                        {

                            access_token:
                                data
                                    .session
                                    .access_token,

                            refresh_token:
                                data
                                    .session
                                    .refresh_token

                        }
                    );


            if (
                sessionError
            ) {


                return {

                    success:
                        false,

                    message:
                        "Account created, but Nova couldn't start your session."

                };

            }


            const user =
                await this.refreshSession();


            return {

                success:
                    true,

                user

            };


        }
        catch (
            error
        ) {


            console.error(
                "Nova create account:",
                error
            );


            return {

                success:
                    false,

                message:
                    "Nova couldn't create the account right now."

            };

        }

    },



    /* =====================================================
       GUEST MODE
    ====================================================== */

    async continueAsGuest() {


        /*
            Sign out any existing real session.
        */

        try {


            await NovaSupabase
                .auth
                .signOut();


        }
        catch (
            error
        ) {

            console.warn(
                "Nova guest signout:",
                error
            );

        }


        let guestId =
            NovaStorage.get(
                this.GUEST_ID_KEY,
                null
            );


        if (
            !guestId
        ) {


            if (
                typeof crypto !==
                    "undefined"
                &&
                typeof crypto.randomUUID ===
                    "function"
            ) {


                guestId =
                    crypto.randomUUID();

            }
            else {


                guestId =
                    "guest-"
                    +
                    Date.now()
                    +
                    "-"
                    +
                    Math.random()
                        .toString(36)
                        .slice(2);

            }


            NovaStorage.set(
                this.GUEST_ID_KEY,
                guestId
            );

        }


        NovaStorage.set(
            this.GUEST_MODE_KEY,
            true
        );


        const guest =
            this.makeGuestUser(
                guestId
            );


        this.currentUserCache =
            guest;


        this.saveCache(
            guest
        );


        return {

            success:
                true,

            user:
                guest

        };

    },



    isGuest() {


        try {


            return (
                NovaStorage.get(
                    this.GUEST_MODE_KEY,
                    false
                )
                ===
                true
            );


        }
        catch (
            error
        ) {


            return false;

        }

    },



    getGuestUser() {


        let guestId =
            NovaStorage.get(
                this.GUEST_ID_KEY,
                null
            );


        if (
            !guestId
        ) {


            guestId =
                typeof crypto !==
                    "undefined"
                &&
                typeof crypto.randomUUID ===
                    "function"
                    ?
                    crypto.randomUUID()
                    :
                    "guest-"
                    +
                    Date.now();


            NovaStorage.set(
                this.GUEST_ID_KEY,
                guestId
            );

        }


        return this.makeGuestUser(
            guestId
        );

    },



    makeGuestUser(
        guestId
    ) {


        return {

            id:
                guestId,

            username:
                "Guest",

            display_name:
                "Guest",

            bio:
                "Exploring Nova as a guest.",

            avatar:
                "assets/avatars/guest.png",

            avatar_url:
                "assets/avatars/guest.png",

            guest:
                true,

            joinedAt:
                null,

            character:
                this.defaultCharacter()

        };

    },



    clearGuestMode() {


        try {


            NovaStorage.remove(
                this.GUEST_MODE_KEY
            );


            const cached =
                NovaStorage.get(
                    this.USER_CACHE_KEY,
                    null
                );


            if (
                cached?.guest
            ) {


                NovaStorage.remove(
                    this.USER_CACHE_KEY
                );

            }


        }
        catch (
            error
        ) {

            console.warn(
                error
            );

        }


        if (
            this.currentUserCache?.guest
        ) {


            this.currentUserCache =
                null;

        }

    },



    /* =====================================================
       LOGOUT
    ====================================================== */

    async logout() {


        if (
            this.isGuest()
        ) {


            this.clearGuestMode();


            this.currentUserCache =
                null;


            this.clearUserCache();


            return;

        }


        try {


            await NovaSupabase
                .auth
                .signOut();


        }
        catch (
            error
        ) {

            console.warn(
                "Nova logout:",
                error
            );

        }


        this.currentUserCache =
            null;


        this.clearUserCache();

    },



    /* =====================================================
       UPDATE LOCAL USER
    ====================================================== */

    async updateCurrentUser(
        changes
    ) {


        let user =
            this.getCurrentUser();


        if (
            !user
            &&
            !this.isGuest()
        ) {


            user =
                await this.refreshSession();

        }


        if (
            !user
        ) {

            return false;

        }


        this.currentUserCache = {

            ...user,
            ...changes

        };


        this.saveCache(
            this.currentUserCache
        );


        return true;

    },



    /* =====================================================
       CACHE
    ====================================================== */

    saveCache(
        user
    ) {


        try {


            NovaStorage.set(
                this.USER_CACHE_KEY,
                user
            );


        }
        catch (
            error
        ) {

            console.warn(
                "Nova user cache:",
                error
            );

        }

    },



    clearUserCache() {


        try {


            NovaStorage.remove(
                this.USER_CACHE_KEY
            );


        }
        catch (
            error
        ) {

            console.warn(
                error
            );

        }

    },



    /* =====================================================
       PROFILE CONVERSION
    ====================================================== */

    profileToLocalUser(
        profile
    ) {


        return {

            id:
                profile.id,

            username:
                profile.username,

            display_name:
                profile.display_name,

            bio:
                profile.bio,

            avatar_url:
                profile.avatar_url,

            avatar:
                profile.avatar_url
                ||
                "assets/avatars/guest.png",

            joinedAt:
                profile.created_at,

            guest:
                false,

            character: {

                body:
                    "r6",

                skin:
                    profile.skin
                    ||
                    "yellow",

                face:
                    profile.face
                    ||
                    "happy",

                shirt:
                    profile.shirt
                    ||
                    "classic",

                pants:
                    profile.pants
                    ||
                    "black",

                hat:
                    profile.hat
                    ||
                    "none"

            }

        };

    },



    /* =====================================================
       DEFAULT CHARACTER
    ====================================================== */

    defaultCharacter() {


        return {

            body:
                "r6",

            skin:
                "yellow",

            face:
                "happy",

            shirt:
                "classic",

            pants:
                "black",

            hat:
                "none"

        };

    }


};



window.NovaAuth =
    NovaAuth;



/* =========================================================
   BACKGROUND SESSION REFRESH
========================================================= */

if (
    typeof NovaSupabase !==
    "undefined"
) {


    NovaAuth
        .refreshSession()
        .catch(
            error => {

                console.warn(
                    "Nova startup auth:",
                    error
                );

            }
        );

}