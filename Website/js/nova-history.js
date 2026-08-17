const NovaHistory = {

    STORAGE_KEY:
        "nova_recently_played",


    recordPlayed(
        game
    ) {

        if (
            !game
            ||
            game.id ===
            undefined
        ) {

            return;

        }


        const current =
            NovaStorage.get(
                this.STORAGE_KEY,
                []
            );


        const filtered =
            current.filter(
                entry =>
                    Number(
                        entry.placeId
                    )
                    !==
                    Number(
                        game.id
                    )
            );


        filtered.unshift(
            {
                placeId:
                    Number(
                        game.id
                    ),

                playedAt:
                    new Date()
                        .toISOString()
            }
        );


        NovaStorage.set(
            this.STORAGE_KEY,
            filtered.slice(
                0,
                8
            )
        );

    },


    getRecentPlaceIds() {

        const current =
            NovaStorage.get(
                this.STORAGE_KEY,
                []
            );


        return current
            .map(
                entry =>
                    Number(
                        entry.placeId
                    )
            )
            .filter(
                Number.isFinite
            );

    }

};


window.NovaHistory =
    NovaHistory;