console.log(
    "### CORRECT NOVA ITEMS FILE LOADED ###"
);
export const NOVA_ITEMS = {

    hats: {

        beanie: {
            id: "beanie",
            name: "Red Beanie",
            type: "hat",

            icon:
                "/assets/character/hats/beanie/icon.png",

            model:
                "/assets/character/hats/beanie/model.glb",

            attachment: {
                targetWidth: 1.35,

                position: [
                    0,
                    3.4,
                    0
                ],

                rotation: [
                    0,
                    0,
                    0
                ],

                scale: [
                    0.7,
                    0.7,
                    0.7
                ]
            }
        },


        crown: {
            id: "crown",
            name: "Rainbow Crown",
            type: "hat",

            icon:
                "/assets/character/hats/crown/icon.png",

            model:
                "/assets/character/hats/crown/model.glb",

            attachment: {
                targetWidth: 1.55,

                position: [
                    0,
                    4.25,
                    0
                ],

                rotation: [
                    0,
                    0,
                    0
                ],

                scale: [
                    0.7,
                    0.7,
                    0.7
                ]
            }
        },


        "pizza-cap": {
            id: "pizza-cap",
            name: "Firey Hair",
            type: "hat",

            icon:
                "/assets/character/hats/pizza-cap/icon.png",

            model:
                "/assets/character/hats/pizza-cap/model.glb",

            attachment: {
                targetWidth: 1.45,

                position: [
                    0.05,
                    2,
                    -0.6
                ],

                rotation: [
                    0,
                    0,
                    0
                ],

                scale: [
                    1.1,
                    1.1,
                    1.1
                ]
            }
        }

    },


    shirts: {

        classic: {
            id: "classic",
            name: "Nova Classic",
            type: "shirt",

            icon:
                "/assets/character/shirts/classic/icon.png",

            texture:
                "/assets/character/shirts/classic/texture.png"
        },


        blue: {
            id: "blue",
            name: "Blue Shirt",
            type: "shirt",

            icon:
                "/assets/character/shirts/blue/icon.png",

            texture:
                "/assets/character/shirts/blue/texture.png"
        },


        cafe: {
            id: "cafe",
            name: "Cafe Shirt",
            type: "shirt",

            icon:
                "/assets/character/shirts/cafe/icon.png",

            texture:
                "/assets/character/shirts/cafe/texture.png"
        }

    },


    pants: {

        black: {
            id: "black",
            name: "Black Pants",
            type: "pants",

            icon:
                "/assets/character/pants/black/icon.png",

            texture:
                "/assets/character/pants/black/texture.png"
        },


        jeans: {
            id: "jeans",
            name: "Classic Jeans",
            type: "pants",

            icon:
                "/assets/character/pants/jeans/icon.png",

            texture:
                "/assets/character/pants/jeans/texture.png"
        },


        brown: {
            id: "brown",
            name: "Brown Pants",
            type: "pants",

            icon:
                "/assets/character/pants/brown/icon.png",

            texture:
                "/assets/character/pants/brown/texture.png"
        }

    },


    faces: {

        smile: {
            id: "smile",
            name: "Classic Smile",
            type: "face",

            icon:
                "/assets/character/faces/smile/icon.png",

            texture:
                "/assets/character/faces/smile/texture.png"
        },


        happy: {
            id: "happy",
            name: "Happy",
            type: "face",

            icon:
                "/assets/character/faces/happy/icon.png",

            texture:
                "/assets/character/faces/happy/texture.png"
        },


        surprised: {
            id: "surprised",
            name: "Surprised",
            type: "face",

            icon:
                "/assets/character/faces/surprised/icon.png",

            texture:
                "/assets/character/faces/surprised/texture.png"
        }

    }

};


export const NOVA_SKIN_TONES = {

    light: {
        name: "Light",
        color: "#f2c7a5"
    },

    tan: {
        name: "Tan",
        color: "#c98f65"
    },

    brown: {
        name: "Brown",
        color: "#8c5a3c"
    },

    dark: {
        name: "Dark",
        color: "#5a3728"
    },

    yellow: {
        name: "Classic Yellow",
        color: "#f4d84a"
    }

};


export function getItem(category, id) {

    return (
        NOVA_ITEMS[category]?.[id]
        ||
        null
    );

}


export function getAllItems() {

    return Object
        .values(NOVA_ITEMS)
        .flatMap(
            category =>
                Object.values(category)
        );

}