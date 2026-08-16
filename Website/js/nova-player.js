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
   GET CURRENT CHARACTER
========================================================= */

function getNovaSavedCharacter() {

    if (
        typeof NovaAuth ===
        "undefined"
    ) {

        console.warn(
            "NovaAuth is not loaded."
        );


        return {
            ...NOVA_DEFAULT_CHARACTER
        };

    }


    const user =
        NovaAuth
            .getCurrentUser();


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
   BUILD NOVA PROTOCOL URL
========================================================= */

function buildNovaPlayerUrl(
    placeId
) {

    const character =
        getNovaSavedCharacter();


    const params =
        new URLSearchParams();


    params.set(
        "placeId",
        String(
            placeId
        )
    );


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
             * Prevent the launcher from
             * attaching twice.
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
        getNovaSavedCharacter

};