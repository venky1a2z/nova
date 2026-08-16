import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                character:
                    resolve(
                        __dirname,
                        "character.html"
                    ),

                create:
                    resolve(
                        __dirname,
                        "create.html"
                    ),

                creator:
                    resolve(
                        __dirname,
                        "creator.html"
                    ),

                game:
                    resolve(
                        __dirname,
                        "game.html"
                    ),

                games:
                    resolve(
                        __dirname,
                        "games.html"
                    ),

                index:
                    resolve(
                        __dirname,
                        "index.html"
                    ),

                install:
                    resolve(
                        __dirname,
                        "install.html"
                    ),

                inventory:
                    resolve(
                        __dirname,
                        "inventory.html"
                    ),

                login:
                    resolve(
                        __dirname,
                        "login.html"
                    ),

                myPlaces:
                    resolve(
                        __dirname,
                        "my-places.html"
                    ),

                profile:
                    resolve(
                        __dirname,
                        "profile.html"
                    ),

                publish:
                    resolve(
                        __dirname,
                        "publish.html"
                    ),

                signup:
                    resolve(
                        __dirname,
                        "signup.html"
                    ),

                studio:
                    resolve(
                        __dirname,
                        "studio.html"
                    )
            }
        }
    }
});