document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupPlaceButtons();

    }
);


function setupPlaceButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-place-id]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const placeId =
                        button.dataset.placeId;


                    launchPlace(
                        placeId
                    );

                }
            );

        }
    );

}


function launchPlace(
    placeId
) {

    if (!placeId) {

        console.error(
            "Nova place ID missing."
        );

        return;

    }


    const launchUrl =
        `nova-player://play?placeId=${
            encodeURIComponent(
                placeId
            )
        }`;


    window.location.href =
        launchUrl;

}