const NovaPresence = {

    userId:
        null,

    heartbeatTimer:
        null,

    HEARTBEAT_MS:
        25000,


    async init() {

        if (
            typeof NovaSupabase ===
            "undefined"
        ) {

            return;

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

                return;

            }


            this.userId =
                data.user.id;


            await this.heartbeat();


            this.startHeartbeat();


            document.addEventListener(
                "visibilitychange",
                () => {

                    if (
                        document.visibilityState ===
                        "visible"
                    ) {

                        this.heartbeat();

                    }

                }
            );

        }
        catch (
            error
        ) {

            console.warn(
                "Nova presence:",
                error
            );

        }

    },


    async heartbeat() {

        if (
            !this.userId
        ) {

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
                        last_seen:
                            new Date()
                                .toISOString()
                    }
                )
                .eq(
                    "id",
                    this.userId
                );


        if (
            error
        ) {

            console.warn(
                "Nova heartbeat:",
                error
            );

        }

    },


    startHeartbeat() {

        if (
            this.heartbeatTimer
        ) {

            clearInterval(
                this.heartbeatTimer
            );

        }


        this.heartbeatTimer =
            setInterval(
                () => {

                    if (
                        document.visibilityState ===
                        "visible"
                    ) {

                        this.heartbeat();

                    }

                },
                this.HEARTBEAT_MS
            );

    },


    isOnline(
        lastSeen,
        maxAgeSeconds = 75
    ) {

        if (
            !lastSeen
        ) {

            return false;

        }


        const time =
            new Date(
                lastSeen
            )
                .getTime();


        if (
            Number.isNaN(
                time
            )
        ) {

            return false;

        }


        const age =
            Date.now()
            -
            time;


        return age <
            maxAgeSeconds *
            1000;

    }

};


window.NovaPresence =
    NovaPresence;