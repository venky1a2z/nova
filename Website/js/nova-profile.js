const NovaProfile = {


    currentAuthUser:
        null,


    profile:
        null,


    viewingOwnProfile:
        false,


    isAdmin:
        false,


    isVerified:
        false,


    messageTimer:
        null,


    /* =====================================================
       INITIALIZE
    ====================================================== */

    async init() {


        const {
            data:
                authData,
            error:
                authError
        } =
            await NovaSupabase
                .auth
                .getUser();


        if (
            authError
        ) {

            console.warn(
                "Nova auth check:",
                authError
            );

        }


        this.currentAuthUser =
            authData?.user
            ||
            null;


        /*
            Check whether the currently
            logged-in account is a Nova admin.
        */

        if (
            this.currentAuthUser
        ) {

            await this.loadAdminStatus();

        }


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


        /*
            No ID means:
            open your own profile.
        */

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
       ADMIN STATUS
    ====================================================== */

    async loadAdminStatus() {


        const {
            data,
            error
        } =
            await NovaSupabase
                .rpc(
                    "is_nova_admin"
                );


        if (
            error
        ) {

            console.error(
                "Nova admin check:",
                error
            );


            this.isAdmin =
                false;


            return;

        }


        this.isAdmin =
            data === true;

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
                    updated_at,
                    last_seen
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
                "Profile load error:",
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


        /*
            Check whether this user
            currently has the blue check.
        */

        await this.loadVerifiedStatus();


        this.renderProfile();


        if (
            this.viewingOwnProfile
        ) {

            this.setupOwnerControls();

        }
        else {

            await this.setupOtherUserControls();

        }


        /*
            If logged-in account is
            an official Nova admin,
            show verify controls.
        */

        this.setupAdminVerificationControls();

    },


    /* =====================================================
       VERIFIED STATUS
    ====================================================== */

    async loadVerifiedStatus() {

    if (
        !this.profile
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
            .eq(
                "user_id",
                this.profile.id
            )
            .maybeSingle();


    if (
        error
    ) {

        console.error(
            "Nova verification check:",
            error
        );


        this.isVerified =
            false;


        return;

    }


    this.isVerified =
        Boolean(
            data
        );

},


    /* =====================================================
       RENDER PROFILE
    ====================================================== */

    renderProfile() {


        if (
            !this.profile
        ) {

            return;

        }


        const profile =
            this.profile;


        document.title =
            `${profile.username} - Nova`;


        const usernameElement =
            document.getElementById(
                "profileUsername"
            );


        if (
            usernameElement
        ) {

            usernameElement.textContent =
                profile.username;

        }


        const displayName =
            profile.display_name
            ||
            profile.username;


        const displayNameElement =
            document.getElementById(
                "profileDisplayName"
            );


        if (
            displayNameElement
        ) {

            displayNameElement.textContent =
                displayName;

        }


        const bioElement =
            document.getElementById(
                "profileBio"
            );


        if (
            bioElement
        ) {

            bioElement.textContent =
                profile.bio
                ||
                "This user has not written a bio yet.";

        }


        const profilePicture =
            document.getElementById(
                "profilePicture"
            );


        if (
            profilePicture
        ) {


            profilePicture.src =
                profile.avatar_url
                ||
                "assets/avatars/guest.png";


            profilePicture.alt =
                `${profile.username}'s profile picture`;

        }


        const handle =
            document.getElementById(
                "profileHandle"
            );


        if (
            handle
        ) {

            handle.textContent =
                `@${profile.username}`;

        }


        const joinedElement =
            document.getElementById(
                "profileJoined"
            );


        if (
            joinedElement
        ) {


            const joined =
                profile.created_at
                    ?
                    new Date(
                        profile.created_at
                    )
                    :
                    null;


            joinedElement.textContent =
                joined
                    ?
                    joined.toLocaleDateString()
                    :
                    "Unknown";

        }


        this.renderCharacterInfo();


        this.renderVerifiedBadge();

        this.renderOnlineStatus();
    },


    /* =====================================================
       VERIFIED BADGE
    ====================================================== */

    renderVerifiedBadge() {


        const badge =
            document.getElementById(
                "profileVerifiedBadge"
            );


        if (
            !badge
        ) {

            return;

        }


        badge.hidden =
            !this.isVerified;

    },

renderOnlineStatus() {

    const dot =
        document.getElementById(
            "profileOnlineDot"
        );


    if (
        !dot
        ||
        !this.profile
    ) {

        return;

    }


    let online =
        false;


    if (
        typeof NovaPresence !==
        "undefined"
    ) {

        online =
            NovaPresence.isOnline(
                this.profile.last_seen
            );

    }


    /*
        Your own profile should immediately
        appear online while you're using Nova.
    */

    if (
        this.viewingOwnProfile
        &&
        this.currentAuthUser
    ) {

        online =
            true;

    }


    dot.hidden =
        !online;


    dot.title =
        online
            ?
            "Online"
            :
            "Offline";

},

    /* =====================================================
       CHARACTER INFO
    ====================================================== */

    renderCharacterInfo() {


        if (
            !this.profile
        ) {

            return;

        }


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


        this.setText(
            "characterSkin",
            values.skin
        );


        this.setText(
            "characterFace",
            values.face
        );


        this.setText(
            "characterShirt",
            values.shirt
        );


        this.setText(
            "characterPants",
            values.pants
        );


        this.setText(
            "characterHat",
            values.hat
        );

    },


    /* =====================================================
       OWNER CONTROLS
    ====================================================== */

    setupOwnerControls() {


        const ownerControls =
            document.getElementById(
                "ownerControls"
            );


        if (
            ownerControls
        ) {

            ownerControls.hidden =
                false;

        }


        const otherUserControls =
            document.getElementById(
                "otherUserControls"
            );


        if (
            otherUserControls
        ) {

            otherUserControls.hidden =
                true;

        }


        const editUsername =
            document.getElementById(
                "editUsername"
            );


        if (
            editUsername
        ) {

            editUsername.value =
                this.profile.username;

        }


        const editDisplayName =
            document.getElementById(
                "editDisplayName"
            );


        if (
            editDisplayName
        ) {

            editDisplayName.value =
                this.profile.display_name
                ||
                "";

        }


        const editBio =
            document.getElementById(
                "editBio"
            );


        if (
            editBio
        ) {


            editBio.value =
                this.profile.bio
                ||
                "";


            editBio.addEventListener(
                "input",
                () =>
                    this.updateBioCounter()
            );

        }


        this.updateBioCounter();


        const saveButton =
            document.getElementById(
                "saveProfileButton"
            );


        if (
            saveButton
        ) {

            saveButton.addEventListener(
                "click",
                () =>
                    this.saveProfile()
            );

        }


        const pictureInput =
            document.getElementById(
                "profilePictureInput"
            );


        if (
            pictureInput
        ) {

            pictureInput.addEventListener(
                "change",
                event =>
                    this.previewProfilePicture(
                        event
                    )
            );

        }


        const uploadButton =
            document.getElementById(
                "uploadProfilePictureButton"
            );


        if (
            uploadButton
        ) {

            uploadButton.addEventListener(
                "click",
                () =>
                    this.uploadProfilePicture()
            );

        }


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (
            logoutButton
        ) {

            logoutButton.addEventListener(
                "click",
                async () => {


                    try {

                        await NovaAuth.logout();

                    }
                    catch (
                        error
                    ) {

                        console.warn(
                            error
                        );

                    }


                    window.location.href =
                        "index.html";

                }
            );

        }


        const deleteButton =
            document.getElementById(
                "deleteAccountButton"
            );


        if (
            deleteButton
        ) {

            deleteButton.addEventListener(
                "click",
                () =>
                    this.openDeleteModal()
            );

        }


        const cancelDelete =
            document.getElementById(
                "cancelDeleteButton"
            );


        if (
            cancelDelete
        ) {

            cancelDelete.addEventListener(
                "click",
                () =>
                    this.closeDeleteModal()
            );

        }


        const confirmDelete =
            document.getElementById(
                "confirmDeleteButton"
            );


        if (
            confirmDelete
        ) {

            confirmDelete.addEventListener(
                "click",
                () =>
                    this.deleteAccount()
            );

        }

    },


    /* =====================================================
       OTHER USER CONTROLS
    ====================================================== */

    async setupOtherUserControls() {


        const ownerControls =
            document.getElementById(
                "ownerControls"
            );


        if (
            ownerControls
        ) {

            ownerControls.hidden =
                true;

        }


        const otherControls =
            document.getElementById(
                "otherUserControls"
            );


        if (
            !otherControls
        ) {

            return;

        }


        otherControls.hidden =
            false;


        const button =
            document.getElementById(
                "profileFriendButton"
            );


        if (
            !button
        ) {

            return;

        }


        /*
            Logged-out visitor.
        */

        if (
            !this.currentAuthUser
        ) {


            button.textContent =
                "Log in to add friend";


            button.disabled =
                false;


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

if (
    me ===
    them
) {

    otherControls.hidden =
        true;

    return;

}

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
                "Friend relationship check:",
                error
            );

        }


        /*
            Already friends.
        */

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


        /*
            Pending friend request.
        */

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


                button.disabled =
                    false;


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


        /*
            No relationship yet.
        */

        button.textContent =
            "＋ Add Friend";


        button.disabled =
            false;


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
       ADMIN VERIFICATION CONTROLS
    ====================================================== */

    setupAdminVerificationControls() {


        const box =
            document.getElementById(
                "novaAdminControls"
            );


        const button =
            document.getElementById(
                "novaVerifyButton"
            );


        if (
            !box
            ||
            !button
        ) {

            return;

        }


        /*
            Never show admin controls unless
            this account is registered in
            nova_admins.

            Also don't show the button when
            looking at your own profile.
        */

        if (
            !this.isAdmin
            ||
            this.viewingOwnProfile
        ) {


            box.hidden =
                true;


            return;

        }


        box.hidden =
            false;


        this.updateVerifyButton();


        button.addEventListener(
            "click",
            async () => {


                button.disabled =
                    true;


                button.textContent =
                    this.isVerified
                        ?
                        "Removing..."
                        :
                        "Verifying...";


                const {
                    error
                } =
                    await NovaSupabase
                        .rpc(
                            "nova_set_verified",
                            {

                                target_user_id:
                                    this.profile.id,


                                should_verify:
                                    !this.isVerified

                            }
                        );


                if (
                    error
                ) {


                    console.error(
                        "Verification update error:",
                        error
                    );


                    button.disabled =
                        false;


                    this.updateVerifyButton();


                    this.showMessage(
                        error.message,
                        true
                    );


                    return;

                }


                this.isVerified =
                    !this.isVerified;


                button.disabled =
                    false;


                this.renderVerifiedBadge();


                this.updateVerifyButton();


                this.showMessage(

                    this.isVerified
                        ?
                        `${this.profile.username} is now verified!`
                        :
                        `${this.profile.username}'s verification was removed.`

                );

            }
        );

    },


    /* =====================================================
       UPDATE VERIFY BUTTON
    ====================================================== */

    updateVerifyButton() {


        const button =
            document.getElementById(
                "novaVerifyButton"
            );


        if (
            !button
        ) {

            return;

        }


        button.textContent =
            this.isVerified
                ?
                "Remove Verification"
                :
                "✓ Verify User";

    },


    /* =====================================================
       SAVE PROFILE
    ====================================================== */

    async saveProfile() {


        const usernameInput =
            document.getElementById(
                "editUsername"
            );


        const displayInput =
            document.getElementById(
                "editDisplayName"
            );


        const bioInput =
            document.getElementById(
                "editBio"
            );


        if (
            !usernameInput
            ||
            !displayInput
            ||
            !bioInput
        ) {

            return;

        }


        const username =
            usernameInput
                .value
                .trim();


        const displayName =
            displayInput
                .value
                .trim();


        const bio =
            bioInput
                .value
                .trim();


        /*
            Username validation.
        */

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


        /*
            Check for existing username.
        */

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


        if (
            !preview
        ) {

            return;

        }


        /*
            Revoke old preview URL
            if there was one.
        */

        if (
            preview.dataset.objectUrl
        ) {

            URL.revokeObjectURL(
                preview.dataset.objectUrl
            );

        }


        const objectUrl =
            URL.createObjectURL(
                file
            );


        preview.dataset.objectUrl =
            objectUrl;


        preview.src =
            objectUrl;


        preview.hidden =
            false;

    },


    /* =====================================================
       UPLOAD PROFILE PICTURE
    ====================================================== */

    async uploadProfilePicture() {


        if (
            !this.viewingOwnProfile
            ||
            !this.currentAuthUser
        ) {

            return;

        }


        const input =
            document.getElementById(
                "profilePictureInput"
            );


        const button =
            document.getElementById(
                "uploadProfilePictureButton"
            );


        if (
            !input
            ||
            !button
        ) {

            return;

        }


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


        const maxSize =
            5 *
            1024 *
            1024;


        if (
            file.size >
            maxSize
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


        /*
            Upload image.
        */

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
                "Profile picture upload:",
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


        /*
            Get public URL.
        */

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
            publicData?.publicUrl;


        if (
            !publicUrl
        ) {


            button.disabled =
                false;


            button.textContent =
                "Upload Profile Picture";


            this.showMessage(
                "Nova uploaded the picture but couldn't create its URL.",
                true
            );


            return;

        }


        /*
            Update profile row.
        */

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


        /*
            Update local account cache
            so homepage can use the image too.
        */

        await this.refreshLocalUser(
            {


                avatar_url:
                    publicUrl,


                avatar:
                    publicUrl

            }
        );


        const profilePicture =
            document.getElementById(
                "profilePicture"
            );


        if (
            profilePicture
        ) {

            profilePicture.src =
                publicUrl;

        }


        const preview =
            document.getElementById(
                "profilePicturePreview"
            );


        if (
            preview
        ) {


            if (
                preview.dataset.objectUrl
            ) {

                URL.revokeObjectURL(
                    preview.dataset.objectUrl
                );


                delete preview
                    .dataset
                    .objectUrl;

            }


            preview.hidden =
                true;

        }


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
            document.getElementById(
                "editBio"
            );


        const counter =
            document.getElementById(
                "bioCounter"
            );


        if (
            !bio
            ||
            !counter
        ) {

            return;

        }


        counter.textContent =
            `${bio.value.length} / 200`;

    },


    /* =====================================================
       LOCAL CACHE REFRESH
    ====================================================== */

    async refreshLocalUser(
        changes
    ) {


        try {


            if (
                typeof NovaAuth !==
                "undefined"
                &&
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
                typeof NovaAuth !==
                "undefined"
                &&
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


        const modal =
            document.getElementById(
                "deleteAccountModal"
            );


        if (
            !modal
        ) {

            return;

        }


        modal.hidden =
            false;


        const input =
            document.getElementById(
                "deleteUsernameConfirm"
            );


        if (
            input
        ) {


            input.value =
                "";


            input.focus();

        }

    },


    closeDeleteModal() {


        const modal =
            document.getElementById(
                "deleteAccountModal"
            );


        if (
            modal
        ) {

            modal.hidden =
                true;

        }

    },


    /* =====================================================
       DELETE ACCOUNT
    ====================================================== */

    async deleteAccount() {


        if (
            !this.viewingOwnProfile
            ||
            !this.profile
        ) {

            return;

        }


        const confirmationInput =
            document.getElementById(
                "deleteUsernameConfirm"
            );


        const button =
            document.getElementById(
                "confirmDeleteButton"
            );


        if (
            !confirmationInput
            ||
            !button
        ) {

            return;

        }


        const confirmation =
            confirmationInput
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
                "Delete account function:",
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


        /*
            Clear browser session.
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
                error
            );

        }


        try {


            if (
                typeof NovaAuth !==
                "undefined"
            ) {

                await NovaAuth.logout();

            }

        }
        catch (
            error
        ) {

            console.warn(
                error
            );

        }


        window.location.href =
            "index.html";

    },


    /* =====================================================
       SMALL HELPERS
    ====================================================== */

    setText(
        elementId,
        value
    ) {


        const element =
            document.getElementById(
                elementId
            );


        if (
            element
        ) {

            element.textContent =
                value;

        }

    },


    /* =====================================================
       MESSAGE
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


        if (
            !box
        ) {

            console.log(
                text
            );

            return;

        }


        box.textContent =
            text;


        box.classList.toggle(
            "error",
            isError
        );


        box.hidden =
            false;


        if (
            this.messageTimer
        ) {

            clearTimeout(
                this.messageTimer
            );

        }


        this.messageTimer =
            setTimeout(
                () => {

                    box.hidden =
                        true;

                },
                5000
            );

    },


    /* =====================================================
       FATAL PROFILE ERROR
    ====================================================== */

    showError(
        text
    ) {


        const page =
            document.getElementById(
                "profilePageContent"
            );


        if (
            !page
        ) {

            return;

        }


        page.innerHTML =
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


    /* =====================================================
       HTML ESCAPE
    ====================================================== */

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