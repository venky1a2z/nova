const NovaFriends = {

    async getCurrentUserId() {

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
            !data.user
        ) {

            return null;

        }


        return data.user.id;

    },


    async getFriends() {

        const me =
            await this.getCurrentUserId();


        if (
            !me
        ) {

            return {
                success: false,
                message: "You must be logged in.",
                friends: []
            };

        }


        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .select(
                    "id, requester_id, addressee_id, status, created_at"
                )
                .eq(
                    "status",
                    "accepted"
                )
                .or(
                    `requester_id.eq.${me},addressee_id.eq.${me}`
                );


        if (
            error
        ) {

            return {
                success: false,
                message: error.message,
                friends: []
            };

        }


        const friendIds =
            (data || [])
                .map(
                    row =>
                        row.requester_id === me
                            ? row.addressee_id
                            : row.requester_id
                );


        if (
            friendIds.length === 0
        ) {

            return {
                success: true,
                friends: []
            };

        }


        const {
            data:
                profiles,

            error:
                profileError
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .select(
                    "id, username, display_name, avatar_url"
                )
                .in(
                    "id",
                    friendIds
                );


        if (
            profileError
        ) {

            return {
                success: false,
                message: profileError.message,
                friends: []
            };

        }


        return {
            success: true,
            friends: profiles || []
        };

    },


    async getIncomingRequests() {

        const me =
            await this.getCurrentUserId();


        if (
            !me
        ) {

            return {
                success: false,
                requests: []
            };

        }


        const {
            data,
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .select(
                    "id, requester_id, addressee_id, status, created_at"
                )
                .eq(
                    "addressee_id",
                    me
                )
                .eq(
                    "status",
                    "pending"
                );


        if (
            error
        ) {

            return {
                success: false,
                message: error.message,
                requests: []
            };

        }


        const requesterIds =
            (data || [])
                .map(
                    row =>
                        row.requester_id
                );


        if (
            requesterIds.length === 0
        ) {

            return {
                success: true,
                requests: []
            };

        }


        const {
            data:
                profiles,

            error:
                profileError
        } =
            await NovaSupabase
                .from(
                    "profiles"
                )
                .select(
                    "id, username, display_name, avatar_url"
                )
                .in(
                    "id",
                    requesterIds
                );


        if (
            profileError
        ) {

            return {
                success: false,
                message: profileError.message,
                requests: []
            };

        }


        const profileMap =
            new Map(
                (profiles || [])
                    .map(
                        profile => [
                            profile.id,
                            profile
                        ]
                    )
            );


        return {
            success: true,

            requests:
                (data || [])
                    .map(
                        row => ({
                            ...row,
                            profile:
                                profileMap.get(
                                    row.requester_id
                                )
                        })
                    )
        };

    },


    async searchUsers(
        query
    ) {

        const me =
            await this.getCurrentUserId();


        query =
            String(
                query || ""
            )
                .trim();


        if (
            !me
            ||
            query.length < 2
        ) {

            return {
                success: true,
                users: []
            };

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
                    "id, username, display_name, avatar_url"
                )
                .ilike(
                    "username",
                    `%${query}%`
                )
                .neq(
                    "id",
                    me
                )
                .limit(
                    12
                );


        if (
            error
        ) {

            return {
                success: false,
                message: error.message,
                users: []
            };

        }


        return {
            success: true,
            users: data || []
        };

    },


    async sendRequest(
        addresseeId
    ) {

        const me =
            await this.getCurrentUserId();


        if (
            !me
        ) {

            return {
                success: false,
                message: "You must be logged in."
            };

        }


        if (
            me ===
            addresseeId
        ) {

            return {
                success: false,
                message: "You cannot friend yourself."
            };

        }


        const {
            data:
                existing,

            error:
                existingError
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .select(
                    "id, status, requester_id, addressee_id"
                )
                .or(
                    `and(requester_id.eq.${me},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${me})`
                )
                .maybeSingle();


        if (
            existingError
        ) {

            return {
                success: false,
                message: existingError.message
            };

        }


        if (
            existing
        ) {

            return {
                success: false,
                message:
                    existing.status === "accepted"
                        ? "You are already friends."
                        : "A friend request already exists."
            };

        }


        const {
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .insert(
                    {
                        requester_id:
                            me,

                        addressee_id:
                            addresseeId,

                        status:
                            "pending"
                    }
                );


        if (
            error
        ) {

            return {
                success: false,
                message: error.message
            };

        }


        return {
            success: true,
            message: "Friend request sent."
        };

    },


    async acceptRequest(
        friendshipId
    ) {

        const me =
            await this.getCurrentUserId();


        const {
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .update(
                    {
                        status:
                            "accepted",

                        updated_at:
                            new Date()
                                .toISOString()
                    }
                )
                .eq(
                    "id",
                    friendshipId
                )
                .eq(
                    "addressee_id",
                    me
                )
                .eq(
                    "status",
                    "pending"
                );


        return error
            ? {
                success: false,
                message: error.message
            }
            : {
                success: true
            };

    },


    async declineRequest(
        friendshipId
    ) {

        const me =
            await this.getCurrentUserId();


        const {
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .delete()
                .eq(
                    "id",
                    friendshipId
                )
                .eq(
                    "addressee_id",
                    me
                )
                .eq(
                    "status",
                    "pending"
                );


        return error
            ? {
                success: false,
                message: error.message
            }
            : {
                success: true
            };

    },


    async removeFriend(
        otherUserId
    ) {

        const me =
            await this.getCurrentUserId();


        const {
            error
        } =
            await NovaSupabase
                .from(
                    "friendships"
                )
                .delete()
                .eq(
                    "status",
                    "accepted"
                )
                .or(
                    `and(requester_id.eq.${me},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${me})`
                );


        return error
            ? {
                success: false,
                message: error.message
            }
            : {
                success: true
            };

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


window.NovaFriends =
    NovaFriends;