const NovaAuth = {

    getUsers() {

        return NovaStorage.get(
            "users",
            []
        );

    },


    getCurrentUser() {

        const session =
            NovaStorage.get(
                "session",
                null
            );

        if (!session) {
            return null;
        }

        const users =
            this.getUsers();

        return users.find(
            user =>
                user.id === session.userId
        ) || null;

    },


    isLoggedIn() {

        return (
            this.getCurrentUser() !== null
        );

    },


    createAccount(
        username,
        password,
        email = ""
    ) {

        username =
            username.trim();

        email =
            email.trim();


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
            password.length < 4
        ) {
            return {
                success: false,
                message:
                    "Password must be at least 4 characters."
            };
        }


        const users =
            this.getUsers();


        const exists =
            users.some(
                user =>
                    user.username
                        .toLowerCase() ===
                    username
                        .toLowerCase()
            );


        if (exists) {

            return {
                success: false,
                message:
                    "That username already exists."
            };

        }


        const nextId =
            users.length === 0
                ? 1
                : Math.max(
                    ...users.map(
                        user => user.id
                    )
                ) + 1;


        const user = {

            id: nextId,

            username:
                username,

            password:
                password,

            email:
                email,

            avatar:
                "assets/avatars/guest.png",

            joinedAt:
                new Date()
                    .toISOString(),

            bio:
                "Hey! I'm new to Nova.",

            places:
                [],

            inventory:
                []

        };


        users.push(
            user
        );


        NovaStorage.set(
            "users",
            users
        );


        NovaStorage.set(
            "session",
            {
                userId:
                    user.id
            }
        );


        return {
            success: true,
            user:
                user
        };

    },


    login(
        username,
        password
    ) {

        username =
            username.trim();


        const users =
            this.getUsers();


        const user =
            users.find(
                currentUser =>

                    currentUser.username
                        .toLowerCase() ===
                    username.toLowerCase()

                    &&

                    currentUser.password ===
                    password
            );


        if (!user) {

            return {
                success: false,
                message:
                    "Invalid username or password."
            };

        }


        NovaStorage.set(
            "session",
            {
                userId:
                    user.id
            }
        );


        return {
            success: true,
            user:
                user
        };

    },


    logout() {

        NovaStorage.remove(
            "session"
        );

    },


    updateCurrentUser(
        changes
    ) {

        const user =
            this.getCurrentUser();

        if (!user) {
            return false;
        }


        const users =
            this.getUsers();


        const index =
            users.findIndex(
                item =>
                    item.id === user.id
            );


        if (index === -1) {
            return false;
        }


        users[index] = {
            ...users[index],
            ...changes
        };


        NovaStorage.set(
            "users",
            users
        );


        return true;
    }

};