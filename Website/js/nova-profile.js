const NovaProfile = {


    currentAuthUser:
        null,


    profile:
        null,


    viewingOwnProfile:
        false,


    /* =====================================================
       INITIALIZE
    ====================================================== */

    async init() {


        const {
            data:
                authData
        } =
            await NovaSupabase
                .auth
                .getUser();


        this.currentAuthUser =
            authData?.user
            ||
            null;


        const params =
            new URLSearchParams(
                window.location.search
            );


        const requestedId =
            params.get(
                "id"
            );


        let profileId =
            requestedId;


        if (
            !profileId
        ) {


            if (
                !this.currentAuthUser
            ) {

                window.location.href =
                    "login.html";

                return;

            }


            profileId =
                this.currentAuthUser.id;

        }


        this.viewingOwnProfile =
            Boolean(
                this.currentAuthUser
                &&
                this.currentAuthUser.id ===
                    profileId
            );


        await this.loadProfile(
            profileId
        );

    },


    /* =====================================================
       LOAD PROFILE
    ====================================================== */

    async loadProfile(
        profileId
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
                    profileId
                )
                .maybeSingle();


        if (
            error
        ) {

            console.error(
                error
            );


            this.showError(
                error.message
            );

            return;

        }


        if (
            !data
        ) {

            this.showError(
                "That Nova user doesn't exist."
            );

            return;

        }


        this.profile =
            data;


        this.renderProfile();


        if (
            this.viewingOwnProfile
        ) {

            this.setupOwnerControls();

        }
        else {

            await this.setupOtherUserControls();

        }

    },


    /* =====================================================
       RENDER
    ====================================================== */

    renderProfile() {


        const profile =
            this.profile;


        document.title =
            `${profile.username} - Nova`;


        document
            .getElementById(
                "profileUsername"
            )
            .textContent =
                profile.username;


        const displayName =
            profile.display_name
            ||
            profile.username;


        document
            .getElementById(
                "profileDisplayName"
            )
            .textContent =
                displayName;


        document
            .getElementById(
                "profileBio"
            )
            .textContent =
                profile.bio
                ||
                "This user has not written a bio yet.";


        const image =
            profile.avatar_url
            ||
            "assets/avatars/guest.png";


        document
            .getElementById(
                "profilePicture"
            )
            .src =
                image;


        document
            .getElementById(
                "profilePicture"
            )
            .alt =
                `${profile.username}'s profile picture`;


        const joined =
            profile.created_at
                ?
                new Date(
                    profile.created_at
                )
                :
                null;


        document
            .getElementById(
                "profileJoined"
            )
            .textContent =
                joined
                    ?
                    joined.toLocaleDateString()
                    :
                    "Unknown";


        document
            .getElementById(
                "profileHandle"
            )
            .textContent =
                `@${profile.username}`;


        this.renderCharacterInfo();

    },


    /* =====================================================
       CHARACTER INFO
    ====================================================== */

    renderCharacterInfo() {


        const profile =
            this.profile;


        const values = {

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
                "none",

            pants:
                profile.pants
                ||
                "none",

            hat:
                profile.hat
                ||
                "none"

        };


        document
            .getElementById(
                "characterSkin"
            )
            .textContent =
                values.skin;


        document
            .getElementById(
                "characterFace"
            )
            .textContent =
                values.face;


        document
            .getElementById(
                "characterShirt"
            )
            .textContent =
                values.shirt;


        document
            .getElementById(
                "characterPants"
            )
            .textContent =
                values.pants;


        document
            .getElementById(
                "characterHat"
            )
            .textContent =
                values.hat;

    },


    /* =====================================================
       OWNER CONTROLS
    ====================================================== */

    setupOwnerControls() {


        document
            .getElementById(
                "ownerControls"
            )
            .hidden =
                false;


        document
            .getElementById(
                "otherUserControls"
            )
            .hidden =
                true;


        document
            .getElementById(
                "editUsername"
            )
            .value =
                this.profile.username;


        document
            .getElementById(
                "editDisplayName"
            )
            .value =
                this.profile.display_name
                ||
                "";


        document
            .getElementById(
                "editBio"
            )
            .value =
                this.profile.bio
                ||
                "";


        this.updateBioCounter();


        document
            .getElementById(
                "editBio"
            )
            .addEventListener(
                "input",
                () =>
                    this.updateBioCounter()
            );


        document
            .getElementById(
                "saveProfileButton"
            )
            .addEventListener(
                "click",
                () =>
                    this.saveProfile()
            );


        document
            .getElementById(
                "profilePictureInput"
            )
            .addEventListener(
                "change",
                event =>
                    this.previewProfilePicture(
                        event
                    )
            );


        document
            .getElementById(
                "uploadProfilePictureButton"
            )
            .addEventListener(
                "click",
                () =>
                    this.uploadProfilePicture()
            );


        document
            .getElementById(
                "logoutButton"
            )
            .addEventListener(
                "click",
                async () => {


                    await NovaAuth.logout();


                    window.location.href =
                        "index.html";

                }
            );


        document
            .getElementById(
                "deleteAccountButton"
            )
            .addEventListener(
                "click",
                () =>
                    this.openDeleteModal()
            );


        document
            .getElementById(
                "cancelDeleteButton"
            )
            .addEventListener(
                "click",
                () =>
                    this.closeDeleteModal()
            );


        document
            .getElementById(
                "confirmDeleteButton"
            )
            .addEventListener(
                "click",
                () =>
                    this.deleteAccount()
            );

    },


    /* =====================================================
       OTHER USER
    ====================================================== */

    async setupOtherUserControls() {


        document
            .getElementById(
                "ownerControls"
            )
            .hidden =
                true;


        const otherControls =
            document.getElementById(
                "otherUserControls"
            );


        otherControls.hidden =
            false;


        const button =
            document.getElementById(
                "profileFriendButton"
            );


        if (
            !this.currentAuthUser
        ) {

            button.textContent =
                "Log in to add friend";


            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "login.html";

                }
            );


            return;

        }


        const me =
            this.currentAuthUser.id;


        const them =
            this.profile.id;


        const {
            data:
                relationship,
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .select(
                    `
                    id,
                    requester_id,
                    addressee_id,
                    status
                    `
                )
                .or(
                    `and(requester_id.eq.${me},addressee_id.eq.${them}),and(requester_id.eq.${them},addressee_id.eq.${me})`
                )
                .maybeSingle();


        if (
            error
        ) {

            console.error(
                error
            );

        }


        if (
            relationship?.status ===
            "accepted"
        ) {

            button.textContent =
                "✓ Friends";


            button.disabled =
                true;


            return;

        }


        if (
            relationship?.status ===
            "pending"
        ) {


            if (
                relationship.requester_id ===
                me
            ) {

                button.textContent =
                    "Friend Request Sent";


                button.disabled =
                    true;

            }
            else {

                button.textContent =
                    "Respond in Friends";


                button.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "friends.html";

                    }
                );

            }


            return;

        }


        button.textContent =
            "＋ Add Friend";


        button.addEventListener(
            "click",
            async () => {


                button.disabled =
                    true;


                button.textContent =
                    "Sending...";


                const result =
                    await NovaFriends
                        .sendRequest(
                            this.profile.id
                        );


                if (
                    result.success
                ) {

                    button.textContent =
                        "Friend Request Sent";

                }
                else {

                    button.disabled =
                        false;


                    button.textContent =
                        "＋ Add Friend";


                    this.showMessage(
                        result.message,
                        true
                    );

                }

            }
        );

    },


    /* =====================================================
       SAVE PROFILE
    ====================================================== */

    async saveProfile() {


        const username =
            document
                .getElementById(
                    "editUsername"
                )
                .value
                .trim();


        const displayName =
            document
                .getElementById(
                    "editDisplayName"
                )
                .value
                .trim();


        const bio =
            document
                .getElementById(
                    "editBio"
                )
                .value
                .trim();


        if (
            !/^[A-Za-z0-9_]{3,20}$/
                .test(
                    username
                )
        ) {

            this.showMessage(
                "Username must be 3-20 characters and only contain letters, numbers, or underscores.",
                true
            );

            return;

        }


        if (
            displayName.length >
            40
        ) {

            this.showMessage(
                "Display name must be 40 characters or less.",
                true
            );

            return;

        }


        if (
            bio.length >
            200
        ) {

            this.showMessage(
                "Bio must be 200 characters or less.",
                true
            );

            return;

        }


        const {
            data:
                existing,
            error:
                existingError
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
                .neq(
                    "id",
                    this.profile.id
                )
                .maybeSingle();


        if (
            existingError
        ) {

            this.showMessage(
                existingError.message,
                true
            );

            return;

        }


        if (
            existing
        ) {

            this.showMessage(
                "That username is already taken.",
                true
            );

            return;

        }


        const {
            error
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .update(
                    {

                        username:
                            username,

                        display_name:
                            displayName
                            ||
                            null,

                        bio:
                            bio,

                        updated_at:
                            new Date()
                                .toISOString()

                    }
                )
                .eq(
                    "id",
                    this.profile.id
                );


        if (
            error
        ) {

            this.showMessage(
                error.message,
                true
            );

            return;

        }


        this.profile.username =
            username;


        this.profile.display_name =
            displayName
            ||
            null;


        this.profile.bio =
            bio;


        await this.refreshLocalUser(
            {

                username:
                    username,

                display_name:
                    displayName
                    ||
                    null,

                bio:
                    bio

            }
        );


        this.renderProfile();


        this.showMessage(
            "Profile saved!"
        );

    },


    /* =====================================================
       PROFILE PICTURE PREVIEW
    ====================================================== */

    previewProfilePicture(
        event
    ) {


        const file =
            event.target.files?.[0];


        if (
            !file
        ) {

            return;

        }


        const preview =
            document.getElementById(
                "profilePicturePreview"
            );


        preview.src =
            URL.createObjectURL(
                file
            );


        preview.hidden =
            false;

    },


    /* =====================================================
       UPLOAD PROFILE PICTURE
    ====================================================== */

    async uploadProfilePicture() {


        const input =
            document.getElementById(
                "profilePictureInput"
            );


        const button =
            document.getElementById(
                "uploadProfilePictureButton"
            );


        const file =
            input.files?.[0];


        if (
            !file
        ) {

            this.showMessage(
                "Choose a picture first.",
                true
            );

            return;

        }


        const allowedTypes = [

            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            this.showMessage(
                "Profile pictures must be PNG, JPG, WEBP, or GIF.",
                true
            );

            return;

        }


        const fiveMegabytes =
            5 *
            1024 *
            1024;


        if (
            file.size >
            fiveMegabytes
        ) {

            this.showMessage(
                "Profile pictures must be 5 MB or smaller.",
                true
            );

            return;

        }


        button.disabled =
            true;


        button.textContent =
            "Uploading...";


        const extensionMap = {

            "image/png":
                "png",

            "image/jpeg":
                "jpg",

            "image/webp":
                "webp",

            "image/gif":
                "gif"

        };


        const extension =
            extensionMap[
                file.type
            ];


        const path =
            `${this.profile.id}/${Date.now()}.${extension}`;


        const {
            error:
                uploadError
        } =
            await NovaSupabase
                .storage
                .from(
                    "profile-pictures"
                )
                .upload(
                    path,
                    file,
                    {

                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type

                    }
                );


        if (
            uploadError
        ) {

            console.error(
                uploadError
            );


            button.disabled =
                false;


            button.textContent =
                "Upload Profile Picture";


            this.showMessage(
                uploadError.message,
                true
            );


            return;

        }


        const {
            data:
                publicData
        } =
            NovaSupabase
                .storage
                .from(
                    "profile-pictures"
                )
                .getPublicUrl(
                    path
                );


        const publicUrl =
            publicData.publicUrl;


        const {
            error:
                updateError
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .update(
                    {

                        avatar_url:
                            publicUrl,

                        updated_at:
                            new Date()
                                .toISOString()

                    }
                )
                .eq(
                    "id",
                    this.profile.id
                );


        if (
            updateError
        ) {

            button.disabled =
                false;


            button.textContent =
                "Upload Profile Picture";


            this.showMessage(
                updateError.message,
                true
            );


            return;

        }


        this.profile.avatar_url =
            publicUrl;


        await this.refreshLocalUser(
            {

                avatar_url:
                    publicUrl,

                avatar:
                    publicUrl

            }
        );


        document
            .getElementById(
                "profilePicture"
            )
            .src =
                publicUrl;


        document
            .getElementById(
                "profilePicturePreview"
            )
            .hidden =
                true;


        input.value =
            "";


        button.disabled =
            false;


        button.textContent =
            "Upload Profile Picture";


        this.showMessage(
            "Profile picture updated!"
        );

    },


    /* =====================================================
       BIO COUNTER
    ====================================================== */

    updateBioCounter() {


        const bio =
            document
                .getElementById(
                    "editBio"
                )
                .value;


        document
            .getElementById(
                "bioCounter"
            )
            .textContent =
                `${bio.length} / 200`;

    },


    /* =====================================================
       LOCAL AUTH CACHE REFRESH
    ====================================================== */

    async refreshLocalUser(
        changes
    ) {


        try {


            if (
                typeof NovaAuth
                    .updateCurrentUser ===
                "function"
            ) {

                await NovaAuth
                    .updateCurrentUser(
                        changes
                    );

            }


            if (
                typeof NovaAuth
                    .refreshSession ===
                "function"
            ) {

                await NovaAuth
                    .refreshSession();

            }

        }
        catch (
            error
        ) {

            console.warn(
                "Nova profile cache refresh:",
                error
            );

        }

    },


    /* =====================================================
       DELETE MODAL
    ====================================================== */

    openDeleteModal() {


        document
            .getElementById(
                "deleteAccountModal"
            )
            .hidden =
                false;


        document
            .getElementById(
                "deleteUsernameConfirm"
            )
            .value =
                "";


        document
            .getElementById(
                "deleteUsernameConfirm"
            )
            .focus();

    },


    closeDeleteModal() {


        document
            .getElementById(
                "deleteAccountModal"
            )
            .hidden =
                true;

    },


    /* =====================================================
       DELETE ACCOUNT
    ====================================================== */

    async deleteAccount() {


        const confirmation =
            document
                .getElementById(
                    "deleteUsernameConfirm"
                )
                .value
                .trim();


        if (
            confirmation !==
            this.profile.username
        ) {

            this.showMessage(
                "Type your exact username to delete your account.",
                true
            );

            return;

        }


        const button =
            document.getElementById(
                "confirmDeleteButton"
            );


        button.disabled =
            true;


        button.textContent =
            "Deleting...";


        const {
            data,
            error
        } =
            await NovaSupabase
                .functions
                .invoke(
                    "delete-account"
                );


        if (
            error
        ) {

            console.error(
                error
            );


            button.disabled =
                false;


            button.textContent =
                "DELETE ACCOUNT FOREVER";


            this.showMessage(
                error.message,
                true
            );


            return;

        }


        if (
            data?.error
        ) {

            button.disabled =
                false;


            button.textContent =
                "DELETE ACCOUNT FOREVER";


            this.showMessage(
                data.error,
                true
            );


            return;

        }


        try {

            await NovaSupabase
                .auth
                .signOut();

        }
        catch {
        }


        try {

            await NovaAuth.logout();

        }
        catch {
        }


        window.location.href =
            "index.html";

    },


    /* =====================================================
       MESSAGES
    ====================================================== */

    showMessage(
        text,
        isError =
            false
    ) {


        const box =
            document.getElementById(
                "profileMessage"
            );


        box.textContent =
            text;


        box.classList.toggle(
            "error",
            isError
        );


        box.hidden =
            false;


        clearTimeout(
            this.messageTimer
        );


        this.messageTimer =
            setTimeout(
                () => {

                    box.hidden =
                        true;

                },

                5000
            );

    },


    showError(
        text
    ) {


        document
            .getElementById(
                "profilePageContent"
            )
            .innerHTML =
                `

                    <div class="profile-fatal-error">

                        <h2>
                            Profile unavailable
                        </h2>

                        <p>
                            ${this.escapeHtml(text)}
                        </p>

                        <a
                            href="index.html"
                            class="retro-button"
                        >
                            Back to Nova
                        </a>

                    </div>

                `;

    },


    escapeHtml(
        value
    ) {


        return String(
            value ?? ""
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


window.NovaProfile =
    NovaProfile;