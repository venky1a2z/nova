const NovaStorage = {

    get(key, fallback = null) {

        const raw =
            localStorage.getItem(
                `nova_${key}`
            );

        if (raw === null) {
            return fallback;
        }

        try {
            return JSON.parse(raw);
        }
        catch {
            return raw;
        }
    },


    set(key, value) {

        localStorage.setItem(
            `nova_${key}`,
            JSON.stringify(value)
        );

    },


    remove(key) {

        localStorage.removeItem(
            `nova_${key}`
        );

    }

};