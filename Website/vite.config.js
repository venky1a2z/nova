import { defineConfig } from "vite";
import { resolve } from "path";
import {
    copyFileSync,
    cpSync,
    existsSync,
    mkdirSync
} from "fs";


function copyNovaStaticFiles() {

    return {
        name: "copy-nova-static-files",

        closeBundle() {

            const dist =
                resolve(
                    __dirname,
                    "dist"
                );


            if (!existsSync(dist)) {

                mkdirSync(
                    dist,
                    {
                        recursive: true
                    }
                );

            }


            // ---------------------------------------------
            // NORMAL JAVASCRIPT FILES
            // ---------------------------------------------

            const rootFiles = [

                "shell.js",
                "site-shell.js",
                "script.js",
                "data.js"

            ];


            for (
                const fileName
                of rootFiles
            ) {

                const source =
                    resolve(
                        __dirname,
                        fileName
                    );


                const destination =
                    resolve(
                        dist,
                        fileName
                    );


                if (
                    existsSync(source)
                ) {

                    copyFileSync(
                        source,
                        destination
                    );

                }

            }


            // ---------------------------------------------
            // JS FOLDER
            // ---------------------------------------------

            const jsSource =
                resolve(
                    __dirname,
                    "js"
                );


            const jsDestination =
                resolve(
                    dist,
                    "js"
                );


            if (
                existsSync(jsSource)
            ) {

                cpSync(
                    jsSource,
                    jsDestination,
                    {
                        recursive: true
                    }
                );

            }


            // ---------------------------------------------
            // ORIGINAL ASSETS
            //
            // Keeps paths such as:
            // assets/logo/nova-logo.png
            // assets/backgrounds/banner.png
            // assets/avatars/guest.png
            // etc.
            // ---------------------------------------------

            const assetsSource =
                resolve(
                    __dirname,
                    "assets"
                );


            const assetsDestination =
                resolve(
                    dist,
                    "assets"
                );


            if (
                existsSync(assetsSource)
            ) {

                cpSync(
                    assetsSource,
                    assetsDestination,
                    {
                        recursive: true
                    }
                );

            }


            console.log(
                "✓ Nova static files copied to dist"
            );

        }
    };

}


export default defineConfig({

    plugins: [
        copyNovaStaticFiles()
    ],


    build: {

        rollupOptions: {

            input: {

                index:
                    resolve(
                        __dirname,
                        "index.html"
                    ),

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

                catalog:
                    resolve(
                        __dirname,
                        "catalog.html"
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
                    
                friends:
                    resolve(
                        __dirname,
                        "friends.html"
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