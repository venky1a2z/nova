console.log(
    "### NOVA PLAYER LAUNCHER LOADED ###"
);


/* =========================================================
   DEFAULT CHARACTER
========================================================= */

const NOVA_DEFAULT_CHARACTER = {

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


/* =========================================================
   GET CURRENT NOVA USER
========================================================= */

function getNovaCurrentUser() {


    if (
        typeof NovaAuth ===
        "undefined"
    ) {

        console.warn(
            "NovaAuth is not loaded."
        );


        return null;

    }


    try {

        return NovaAuth
            .getCurrentUser();

    }
    catch (
        error
    ) {

        console.warn(
            "Could not read Nova user:",
            error
        );


        return null;

    }

}


/* =========================================================
   GET CURRENT CHARACTER
========================================================= */

function getNovaSavedCharacter() {


    const user =
        getNovaCurrentUser();


    if (
        !user
    ) {

        console.log(
            "Nova: no logged-in user."
        );


        return {
            ...NOVA_DEFAULT_CHARACTER
        };

    }


    const character =
        user.character
        ||
        {};


    return {

        body:
            character.body
            ||
            NOVA_DEFAULT_CHARACTER.body,

        skin:
            character.skin
            ||
            NOVA_DEFAULT_CHARACTER.skin,

        face:
            character.face
            ||
            NOVA_DEFAULT_CHARACTER.face,

        shirt:
            character.shirt
            ||
            NOVA_DEFAULT_CHARACTER.shirt,

        pants:
            character.pants
            ||
            NOVA_DEFAULT_CHARACTER.pants,

        hat:
            character.hat
            ||
            NOVA_DEFAULT_CHARACTER.hat

    };

}


/* =========================================================
   GET MULTIPLAYER IDENTITY
========================================================= */

function getNovaPlayerIdentity() {


    const user =
        getNovaCurrentUser();


    if (
        !user
    ) {

        /*
         * Guest fallback.
         *
         * This is mainly useful when
         * testing the Player manually.
         */

        let guestId =
            sessionStorage.getItem(
                "nova_guest_player_id"
            );


        if (
            !guestId
        ) {

            guestId =
                "guest-"
                +
                crypto.randomUUID();


            sessionStorage.setItem(
                "nova_guest_player_id",
                guestId
            );

        }


        return {

            userId:
                guestId,

            username:
                "NovaPlayer"

        };

    }


    /*
     * Different versions of NovaAuth
     * may expose the Supabase UUID
     * slightly differently.
     */

    const userId =
        user.id
        ||
        user.userId
        ||
        user.uid
        ||
        user.authId
        ||
        "";


    const username =
        user.username
        ||
        user.display_name
        ||
        user.displayName
        ||
        "NovaPlayer";


    return {

        userId:
            String(
                userId
            ),

        username:
            String(
                username
            )

    };

}


/* =========================================================
   BUILD NOVA PROTOCOL URL
========================================================= */

function buildNovaPlayerUrl(
    placeId
) {


    const character =
        getNovaSavedCharacter();


    const identity =
        getNovaPlayerIdentity();


    const params =
        new URLSearchParams();


    /* GAME */

    params.set(
        "placeId",
        String(
            placeId
        )
    );


    /* PLAYER IDENTITY */

    params.set(
        "userId",
        identity.userId
    );


    params.set(
        "username",
        identity.username
    );


    /* CHARACTER */

    params.set(
        "skin",
        character.skin
    );


    params.set(
        "face",
        character.face
    );


    params.set(
        "shirt",
        character.shirt
    );


    params.set(
        "pants",
        character.pants
    );


    params.set(
        "hat",
        character.hat
    );


    const url =
        "nova-player://play?"
        +
        params.toString();


    console.log(
        "Nova player identity:"
    );


    console.log(
        identity
    );


    console.log(
        "Nova character:"
    );


    console.log(
        character
    );


    console.log(
        "Nova launch URL:"
    );


    console.log(
        url
    );


    return url;

}


/* =========================================================
   LAUNCH NOVA PLAYER
========================================================= */

function launchNovaPlayer(
    placeId
) {


    if (
        placeId === undefined
        ||
        placeId === null
        ||
        placeId === ""
    ) {

        console.error(
            "Nova: no place ID supplied."
        );


        return;

    }


    const url =
        buildNovaPlayerUrl(
            placeId
        );


    window.location.href =
        url;

}


/* =========================================================
   AUTOMATIC BUTTON SUPPORT
========================================================= */

function connectNovaPlayButtons() {


    const buttons =
        document.querySelectorAll(
            "[data-place-id]"
        );


    buttons.forEach(
        button => {


            /*
             * Prevent attaching
             * the launcher twice.
             */

            if (
                button.dataset
                    .novaLauncherAttached
                ===
                "true"
            ) {

                return;

            }


            button.dataset
                .novaLauncherAttached =
                "true";


            button.addEventListener(
                "click",
                event => {


                    const placeId =
                        button.dataset
                            .placeId;


                    if (
                        !placeId
                    ) {

                        return;

                    }


                    event.preventDefault();


                    launchNovaPlayer(
                        placeId
                    );

                }
            );

        }
    );

}


/* =========================================================
   CONNECT AFTER PAGE LOAD
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        connectNovaPlayButtons
    );

}
else {

    connectNovaPlayButtons();

}


/* =========================================================
   GLOBAL API
========================================================= */

window.NovaPlayer = {

    launch:
        launchNovaPlayer,

    buildUrl:
        buildNovaPlayerUrl,

    getCharacter:
        getNovaSavedCharacter,

    getIdentity:
        getNovaPlayerIdentity

};