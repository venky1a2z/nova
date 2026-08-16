const NovaAuth = {

    CACHE_USER_KEY:
        "nova_supabase_user",


    // =========================================================
    // LOCAL CACHE
    //
    // Other Nova pages currently expect getCurrentUser()
    // to return immediately instead of using await.
    //
    // Supabase is the real account source.
    // This cache keeps the existing website compatible.
    // =========================================================

    getCurrentUser() {

        return NovaStorage.get(
            this.CACHE_USER_KEY,
            null
        );

    },


    isLoggedIn() {

        return (
            this.getCurrentUser() !== null
        );

    },


    saveCachedUser(
        user
    ) {

        NovaStorage.set(
            this.CACHE_USER_KEY,
            user
        );


        // Keep compatibility with older Nova code
        // that may still check the old session object.

        NovaStorage.set(
            "session",
            {
                userId:
                    user.id
            }
        );

    },


    clearCachedUser() {

        NovaStorage.remove(
            this.CACHE_USER_KEY
        );


        NovaStorage.remove(
            "session"
        );

    },


    // =========================================================
    // LOAD PROFILE
    // =========================================================

    async getProfile(
        userId
    ) {

        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    userId
                )
                .maybeSingle();


        if (
            error
        ) {

            console.error(
                "Nova profile load failed:",
                error
            );

            return null;

        }


        return data;

    },


    // =========================================================
    // BUILD NOVA USER OBJECT
    // =========================================================

    buildNovaUser(
        authUser,
        profile
    ) {

        return {

            id:
                authUser.id,

            email:
                authUser.email || "",

            username:
                profile?.username
                ||
                authUser.user_metadata?.username
                ||
                "NovaPlayer",

            displayName:
                profile?.display_name
                ||
                profile?.username
                ||
                authUser.user_metadata?.username
                ||
                "NovaPlayer",

            avatar:
                "assets/avatars/guest.png",

            avatarImage:
                NovaStorage.get(
                    "nova_avatar_image",
                    null
                ),

            joinedAt:
                profile?.created_at
                ||
                authUser.created_at
                ||
                new Date()
                    .toISOString(),

            bio:
                "Hey! I'm new to Nova.",

            places:
                [],

            inventory:
                [],

            character: {

                body:
                    "r6",

                skin:
                    profile?.skin
                    ||
                    "yellow",

                face:
                    profile?.face
                    ||
                    "happy",

                shirt:
                    profile?.shirt
                    ||
                    "none",

                pants:
                    profile?.pants
                    ||
                    "none",

                hat:
                    profile?.hat
                    ||
                    "none"

            }

        };

    },


    // =========================================================
    // REFRESH CURRENT SESSION
    // =========================================================

    async refreshSession() {

        try {

            const {
                data,
                error
            } =
                await NovaSupabase
                    .auth
                    .getSession();


            if (
                error
            ) {

                console.error(
                    "Nova session error:",
                    error
                );

                this.clearCachedUser();

                return null;

            }


            const session =
                data.session;


            if (
                !session
            ) {

                this.clearCachedUser();

                return null;

            }


            const authUser =
                session.user;


            const profile =
                await this.getProfile(
                    authUser.id
                );


            const novaUser =
                this.buildNovaUser(
                    authUser,
                    profile
                );


            this.saveCachedUser(
                novaUser
            );


            return novaUser;

        }
        catch (
            error
        ) {

            console.error(
                "Nova session refresh failed:",
                error
            );

            return null;

        }

    },


    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    async createAccount(
        username,
        password,
        email
    ) {

        username =
            String(
                username || ""
            )
                .trim();


        email =
            String(
                email || ""
            )
                .trim()
                .toLowerCase();


        if (
            username.length < 3
        ) {

            return {

                success: false,

                message:
                    "Username must be at least 3 characters."

            };

        }


        if (
            username.length > 20
        ) {

            return {

                success: false,

                message:
                    "Username must be 20 characters or fewer."

            };

        }


        if (
            /\s/.test(
                username
            )
        ) {

            return {

                success: false,

                message:
                    "Username cannot contain spaces."

            };

        }


        if (
            !email
        ) {

            return {

                success: false,

                message:
                    "Please enter an email address."

            };

        }


        if (
            password.length < 6
        ) {

            return {

                success: false,

                message:
                    "Password must be at least 6 characters."

            };

        }


        // -----------------------------------------------------
        // Check Nova username
        // -----------------------------------------------------

        const {
            data:
                existingProfile,

            error:
                usernameCheckError

        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .select(
                    "id"
                )
                .ilike(
                    "username",
                    username
                )
                .maybeSingle();


        if (
            usernameCheckError
        ) {

            console.error(
                "Username check failed:",
                usernameCheckError
            );

        }


        if (
            existingProfile
        ) {

            return {

                success: false,

                message:
                    "That username is already taken."

            };

        }


        // -----------------------------------------------------
        // Supabase Auth account
        // -----------------------------------------------------

        const {
            data:
                signupData,

            error:
                signupError

        } =
            await NovaSupabase
                .auth
                .signUp(
                    {

                        email:
                            email,

                        password:
                            password,

                        options: {

                            data: {

                                username:
                                    username

                            }

                        }

                    }
                );


        if (
            signupError
        ) {

            return {

                success: false,

                message:
                    signupError.message

            };

        }


        if (
            !signupData.user
        ) {

            return {

                success: false,

                message:
                    "Nova could not create your account."

            };

        }


        // -----------------------------------------------------
        // Email confirmation enabled
        // -----------------------------------------------------

        if (
            !signupData.session
        ) {

            return {

                success: true,

                requiresConfirmation: true,

                message:
                    "Account created! Check your email to confirm your account, then log in."

            };

        }


        // -----------------------------------------------------
        // Create Nova profile
        // -----------------------------------------------------

        const profileData = {

            id:
                signupData.user.id,

            username:
                username,

            display_name:
                username,

            skin:
                "yellow",

            face:
                "happy",

            shirt:
                "none",

            pants:
                "none",

            hat:
                "none"

        };


        const {
            data:
                insertedProfile,

            error:
                profileError

        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .insert(
                    profileData
                )
                .select()
                .single();


        if (
            profileError
        ) {

            console.error(
                "Nova profile creation failed:",
                profileError
            );


            return {

                success: false,

                message:
                    "Your login was created, but Nova could not create your profile. Please contact Nova support."

            };

        }


        const novaUser =
            this.buildNovaUser(
                signupData.user,
                insertedProfile
            );


        this.saveCachedUser(
            novaUser
        );


        return {

            success: true,

            requiresConfirmation: false,

            user:
                novaUser,

            message:
                "Account created!"

        };

    },


    // =========================================================
    // LOGIN
    // =========================================================

    async login(
        email,
        password
    ) {

        email =
            String(
                email || ""
            )
                .trim()
                .toLowerCase();


        if (
            !email
        ) {

            return {

                success: false,

                message:
                    "Please enter your email."

            };

        }


        if (
            !password
        ) {

            return {

                success: false,

                message:
                    "Please enter your password."

            };

        }


        const {
            data,
            error
        } =
            await NovaSupabase
                .auth
                .signInWithPassword(
                    {

                        email:
                            email,

                        password:
                            password

                    }
                );


        if (
            error
        ) {

            return {

                success: false,

                message:
                    error.message

            };

        }


        const profile =
            await this.getProfile(
                data.user.id
            );


        // -----------------------------------------------------
        // Create profile if email-confirmed signup did not
        // create one earlier.
        // -----------------------------------------------------

        let finalProfile =
            profile;


        if (
            !finalProfile
        ) {

            const fallbackUsername =
                data.user
                    .user_metadata
                    ?.username
                ||
                `Nova_${data.user.id.substring(0, 6)}`;


            const {
                data:
                    createdProfile,

                error:
                    profileError

            } =
                await NovaSupabase
                    .from(
                        "profiles"
                    )
                    .insert(
                        {

                            id:
                                data.user.id,

                            username:
                                fallbackUsername,

                            display_name:
                                fallbackUsername,

                            skin:
                                "yellow",

                            face:
                                "happy",

                            shirt:
                                "none",

                            pants:
                                "none",

                            hat:
                                "none"

                        }
                    )
                    .select()
                    .single();


            if (
                profileError
            ) {

                console.error(
                    "Could not create missing profile:",
                    profileError
                );

            }
            else {

                finalProfile =
                    createdProfile;

            }

        }


        const novaUser =
            this.buildNovaUser(
                data.user,
                finalProfile
            );


        this.saveCachedUser(
            novaUser
        );


        return {

            success: true,

            user:
                novaUser

        };

    },


    // =========================================================
    // LOGOUT
    // =========================================================

    async logout() {

        await NovaSupabase
            .auth
            .signOut();


        this.clearCachedUser();

    },


    // =========================================================
    // UPDATE USER
    //
    // Keeps compatibility with Character/Profile pages.
    // =========================================================

    async updateCurrentUser(
        changes
    ) {

        const currentUser =
            this.getCurrentUser();


        if (
            !currentUser
        ) {

            return false;

        }


        const updatedUser = {

            ...currentUser,

            ...changes

        };


        this.saveCachedUser(
            updatedUser
        );


        const character =
            updatedUser.character
            ||
            {};


        const profileChanges = {};


        if (
            changes.username !==
            undefined
        ) {

            profileChanges.username =
                changes.username;

        }


        if (
            changes.displayName !==
            undefined
        ) {

            profileChanges.display_name =
                changes.displayName;

        }


        if (
            character.skin !==
            undefined
        ) {

            profileChanges.skin =
                character.skin;

        }


        if (
            character.face !==
            undefined
        ) {

            profileChanges.face =
                character.face;

        }


        if (
            character.shirt !==
            undefined
        ) {

            profileChanges.shirt =
                character.shirt;

        }


        if (
            character.pants !==
            undefined
        ) {

            profileChanges.pants =
                character.pants;

        }


        if (
            character.hat !==
            undefined
        ) {

            profileChanges.hat =
                character.hat;

        }


        if (
            Object.keys(
                profileChanges
            ).length > 0
        ) {

            const {
                error
            } =
                await NovaSupabase
                    .from(
                        "profiles"
                    )
                    .update(
                        profileChanges
                    )
                    .eq(
                        "id",
                        currentUser.id
                    );


            if (
                error
            ) {

                console.error(
                    "Nova profile update failed:",
                    error
                );

                return false;

            }

        }


        return true;

    }

};


window.NovaAuth =
    NovaAuth;