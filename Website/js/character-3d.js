import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";

import {
    getItem
} from "./nova-items.js";


export class NovaCharacterViewer {

    constructor(container) {

        this.container =
            container;


        /* =====================================================
           SCENE
        ===================================================== */

        this.scene =
            new THREE.Scene();


        this.scene.background =
            new THREE.Color(
                0xfff7e8
            );


        /* =====================================================
           CAMERA
        ===================================================== */

        this.camera =
            new THREE.PerspectiveCamera(
                35,
                1,
                0.01,
                1000
            );


        this.camera.position.set(
            0,
            2,
            6
        );


        /* =====================================================
           RENDERER
        ===================================================== */

        this.renderer =
            new THREE.WebGLRenderer({

                antialias: true,

                /*
                    IMPORTANT:

                    This allows us to convert
                    the rendered character into
                    a PNG using toDataURL().
                */

                preserveDrawingBuffer: true

            });


        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );


        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;


        this.renderer.shadowMap.enabled =
            true;


        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;


        this.container.appendChild(
            this.renderer.domElement
        );


        /* =====================================================
           LOADERS
        ===================================================== */

        this.gltfLoader =
            new GLTFLoader();


        this.textureLoader =
            new THREE.TextureLoader();


        /* =====================================================
           CONTROLS
        ===================================================== */

        this.controls =
            new OrbitControls(
                this.camera,
                this.renderer.domElement
            );


        this.controls.enableDamping =
            true;


        this.controls.dampingFactor =
            0.08;


        this.controls.enablePan =
            false;


        this.controls.minDistance =
            2.5;


        this.controls.maxDistance =
            10;


        this.controls.minPolarAngle =
            Math.PI * 0.12;


        this.controls.maxPolarAngle =
            Math.PI * 0.88;


        /* =====================================================
           CHARACTER
        ===================================================== */

        this.characterRoot =
            new THREE.Group();


        this.scene.add(
            this.characterRoot
        );


        this.body =
            null;


        this.hat =
            null;


        this.faceTexture =
            null;


        this.shirtTexture =
            null;


        this.pantsTexture =
            null;


        /* =====================================================
           SETUP
        ===================================================== */

        this.addLights();

        this.addGround();

        this.resize();


        window.addEventListener(
            "resize",
            () => this.resize()
        );


        this.animate();

    }


    /* =========================================================
       LIGHTS
    ========================================================= */

    addLights() {

        const hemisphere =
            new THREE.HemisphereLight(
                0xffffff,
                0x6b5545,
                2.5
            );


        this.scene.add(
            hemisphere
        );


        const key =
            new THREE.DirectionalLight(
                0xffffff,
                3.5
            );


        key.position.set(
            5,
            8,
            5
        );


        key.castShadow =
            true;


        this.scene.add(
            key
        );


        const fill =
            new THREE.DirectionalLight(
                0xffd9b0,
                1.2
            );


        fill.position.set(
            -4,
            4,
            3
        );


        this.scene.add(
            fill
        );


        const back =
            new THREE.DirectionalLight(
                0xffffff,
                0.6
            );


        back.position.set(
            0,
            3,
            -5
        );


        this.scene.add(
            back
        );

    }


    /* =========================================================
       GROUND
    ========================================================= */

    addGround() {

        const geometry =
            new THREE.CircleGeometry(
                2.4,
                64
            );


        const material =
            new THREE.MeshStandardMaterial({

                color: 0xe6cfaa,

                roughness: 1

            });


        const ground =
            new THREE.Mesh(
                geometry,
                material
            );


        ground.rotation.x =
            -Math.PI / 2;


        ground.position.y =
            -0.01;


        ground.receiveShadow =
            true;


        this.scene.add(
            ground
        );

    }


    /* =========================================================
       LOAD BODY
    ========================================================= */

    async loadBody() {

        console.log(
            "Nova: loading Guest.glb..."
        );


        const gltf =
            await this.gltfLoader.loadAsync(
                "/assets/character/body/Guest.glb"
            );


        if (this.body) {

            this.characterRoot.remove(
                this.body
            );

        }


        this.body =
            gltf.scene;


        this.characterRoot.add(
            this.body
        );


        this.prepareBody();

        this.fitBody();

        this.frameBody();

        this.logModelStructure();


        console.log(
            "Nova: Guest loaded."
        );

    }


    /* =========================================================
       PREPARE BODY
    ========================================================= */

    prepareBody() {

        if (!this.body) {
            return;
        }


        this.body.traverse(
            object => {

                if (!object.isMesh) {
                    return;
                }


                object.castShadow =
                    true;


                object.receiveShadow =
                    true;


                if (
                    Array.isArray(
                        object.material
                    )
                ) {

                    object.material =
                        object.material.map(
                            material =>
                                material.clone()
                        );

                }
                else if (
                    object.material
                ) {

                    object.material =
                        object.material.clone();

                }

            }
        );

    }


    /* =========================================================
       BODY SCALE
    ========================================================= */

    fitBody() {

        if (!this.body) {
            return;
        }


        const box =
            new THREE.Box3()
                .setFromObject(
                    this.body
                );


        const size =
            box.getSize(
                new THREE.Vector3()
            );


        if (size.y <= 0) {
            return;
        }


        const desiredHeight =
            3.4;


        const scale =
            desiredHeight /
            size.y;


        this.body.scale.multiplyScalar(
            scale
        );


        const scaledBox =
            new THREE.Box3()
                .setFromObject(
                    this.body
                );


        const center =
            scaledBox.getCenter(
                new THREE.Vector3()
            );


        this.body.position.x -=
            center.x;


        this.body.position.z -=
            center.z;


        this.body.position.y -=
            scaledBox.min.y;

    }


    /* =========================================================
       CAMERA
    ========================================================= */

    frameBody() {

        if (!this.body) {
            return;
        }


        const box =
            new THREE.Box3()
                .setFromObject(
                    this.characterRoot
                );


        const size =
            box.getSize(
                new THREE.Vector3()
            );


        const center =
            box.getCenter(
                new THREE.Vector3()
            );


        const biggest =
            Math.max(
                size.x,
                size.y,
                size.z
            );


        const distance =
            biggest * 1.75;


        this.camera.position.set(
            center.x,
            center.y + 0.2,
            center.z + distance
        );


        this.controls.target.copy(
            center
        );


        this.controls.update();

    }


    /* =========================================================
       OBJECT GETTERS
    ========================================================= */

    getHead() {

        return (
            this.body
                ?.getObjectByName(
                    "Head"
                )
            ||
            null
        );

    }


    getFaceMesh() {

        return (
            this.body
                ?.getObjectByName(
                    "Face"
                )
            ||
            null
        );

    }


    getShirtMesh() {

        return (
            this.body
                ?.getObjectByName(
                    "Shirt"
                )
            ||
            null
        );

    }


    getPantMesh() {

        return (
            this.body
                ?.getObjectByName(
                    "Pant"
                )
            ||
            null
        );

    }


    /* =========================================================
       SKIN TONE
    ========================================================= */

    setSkinTone(colorValue) {

        const color =
            new THREE.Color(
                colorValue
            );


        const head =
            this.getHead();


        if (head) {

            this.colorAllMaterials(
                head,
                color
            );

        }


        const shirt =
            this.getShirtMesh();


        if (shirt) {

            this.colorNamedMaterial(
                shirt,
                "Skin.001",
                color
            );

        }


        const pant =
            this.getPantMesh();


        if (pant) {

            this.colorNamedMaterial(
                pant,
                "Skin.002",
                color
            );

        }

    }


    colorAllMaterials(
        root,
        color
    ) {

        root.traverse(
            object => {

                if (!object.isMesh) {
                    return;
                }


                const materials =
                    Array.isArray(
                        object.material
                    )
                        ?
                        object.material
                        :
                        [object.material];


                const updated =
                    materials.map(
                        material => {

                            if (!material) {
                                return material;
                            }


                            const clone =
                                material.clone();


                            if (
                                clone.color
                            ) {

                                clone.color.copy(
                                    color
                                );

                            }


                            clone.needsUpdate =
                                true;


                            return clone;

                        }
                    );


                object.material =
                    Array.isArray(
                        object.material
                    )
                        ?
                        updated
                        :
                        updated[0];

            }
        );

    }


    colorNamedMaterial(
        root,
        targetName,
        color
    ) {

        let matches =
            0;


        root.traverse(
            object => {

                if (!object.isMesh) {
                    return;
                }


                const materials =
                    Array.isArray(
                        object.material
                    )
                        ?
                        object.material
                        :
                        [object.material];


                const updated =
                    materials.map(
                        material => {

                            if (!material) {
                                return material;
                            }


                            const clone =
                                material.clone();


                            const name =
                                (
                                    material.name
                                    ||
                                    ""
                                )
                                .trim()
                                .toLowerCase();


                            if (
                                name ===
                                targetName
                                    .trim()
                                    .toLowerCase()
                            ) {

                                if (
                                    clone.color
                                ) {

                                    clone.color.copy(
                                        color
                                    );

                                }


                                matches++;

                            }


                            clone.needsUpdate =
                                true;


                            return clone;

                        }
                    );


                object.material =
                    Array.isArray(
                        object.material
                    )
                        ?
                        updated
                        :
                        updated[0];

            }
        );


        console.log(
            `Nova: ${targetName} matches:`,
            matches
        );

    }


    /* =========================================================
       FACE
    ========================================================= */

    async setFace(faceId) {

        const item =
            getItem(
                "faces",
                faceId
            );


        if (!item) {

            console.error(
                "Nova: unknown face:",
                faceId
            );

            return;

        }


        const face =
            this.getFaceMesh();


        if (!face) {

            console.warn(
                'Nova: Face object not found.'
            );

            return;

        }


        const texture =
            await this.loadColorTexture(
                item.texture
            );


        if (
            this.faceTexture
        ) {

            this.faceTexture.dispose();

        }


        this.faceTexture =
            texture;


        face.traverse(
            object => {

                if (!object.isMesh) {
                    return;
                }


                const materials =
                    Array.isArray(
                        object.material
                    )
                        ?
                        object.material
                        :
                        [object.material];


                const updated =
                    materials.map(
                        material => {

                            if (!material) {
                                return material;
                            }


                            const clone =
                                material.clone();


                            clone.map =
                                texture;


                            if (
                                clone.color
                            ) {

                                clone.color.set(
                                    0xffffff
                                );

                            }


                            clone.transparent =
                                true;


                            clone.alphaTest =
                                0.05;


                            clone.depthWrite =
                                false;


                            clone.needsUpdate =
                                true;


                            return clone;

                        }
                    );


                object.material =
                    Array.isArray(
                        object.material
                    )
                        ?
                        updated
                        :
                        updated[0];

            }
        );

    }


    /* =========================================================
       SHIRT
    ========================================================= */

    async setShirt(shirtId) {

        const item =
            getItem(
                "shirts",
                shirtId
            );


        if (!item) {

            console.error(
                "Nova: unknown shirt:",
                shirtId
            );

            return;

        }


        const shirt =
            this.getShirtMesh();


        if (!shirt) {

            console.warn(
                'Nova: Shirt object not found.'
            );

            return;

        }


        const texture =
            await this.loadColorTexture(
                item.texture
            );


        if (
            this.shirtTexture
        ) {

            this.shirtTexture.dispose();

        }


        this.shirtTexture =
            texture;


        this.applyTextureToNamedMaterial(
            shirt,
            "Shirt",
            texture
        );

    }


    /* =========================================================
       PANTS
    ========================================================= */

    async setPants(pantsId) {

        const item =
            getItem(
                "pants",
                pantsId
            );


        if (!item) {

            console.error(
                "Nova: unknown pants:",
                pantsId
            );

            return;

        }


        const pant =
            this.getPantMesh();


        if (!pant) {

            console.warn(
                'Nova: Pant object not found.'
            );

            return;

        }


        const texture =
            await this.loadColorTexture(
                item.texture
            );


        if (
            this.pantsTexture
        ) {

            this.pantsTexture.dispose();

        }


        this.pantsTexture =
            texture;


        this.applyTextureToNamedMaterial(
            pant,
            "Pant",
            texture
        );

    }


    /* =========================================================
       APPLY TEXTURE
    ========================================================= */

    applyTextureToNamedMaterial(
        root,
        targetName,
        texture
    ) {

        let matches =
            0;


        root.traverse(
            object => {

                if (!object.isMesh) {
                    return;
                }


                const materials =
                    Array.isArray(
                        object.material
                    )
                        ?
                        object.material
                        :
                        [object.material];


                const updated =
                    materials.map(
                        material => {

                            if (!material) {
                                return material;
                            }


                            const clone =
                                material.clone();


                            const name =
                                (
                                    material.name
                                    ||
                                    ""
                                )
                                .trim()
                                .toLowerCase();


                            if (
                                name ===
                                targetName
                                    .trim()
                                    .toLowerCase()
                            ) {

                                clone.map =
                                    texture;


                                if (
                                    clone.color
                                ) {

                                    clone.color.set(
                                        0xffffff
                                    );

                                }


                                clone.needsUpdate =
                                    true;


                                matches++;

                            }


                            return clone;

                        }
                    );


                object.material =
                    Array.isArray(
                        object.material
                    )
                        ?
                        updated
                        :
                        updated[0];

            }
        );


        console.log(
            `Nova: ${targetName} texture matches:`,
            matches
        );

    }


    /* =========================================================
       HAT
    ========================================================= */

    async setHat(hatId) {

        if (this.hat) {

            this.characterRoot.remove(
                this.hat
            );


            this.disposeObject(
                this.hat
            );


            this.hat =
                null;

        }


        if (
            !hatId ||
            hatId === "none"
        ) {

            return;

        }


        const item =
            getItem(
                "hats",
                hatId
            );


        if (!item) {

            console.error(
                "Nova: unknown hat:",
                hatId
            );

            return;

        }


        const gltf =
            await this.gltfLoader.loadAsync(
                item.model
            );


        const model =
            gltf.scene;


        const bounds =
            new THREE.Box3()
                .setFromObject(
                    model,
                    true
                );


        const size =
            bounds.getSize(
                new THREE.Vector3()
            );


        const center =
            bounds.getCenter(
                new THREE.Vector3()
            );


        model.position.set(
            -center.x,
            -center.y,
            -center.z
        );


        if (size.x > 0) {

            const targetWidth =
                item.attachment
                    ?.targetWidth
                ||
                1.4;


            model.scale.setScalar(
                targetWidth /
                size.x
            );

        }


        const attachment =
            item.attachment
            ||
            {};


        const scale =
            attachment.scale
            ||
            [1, 1, 1];


        model.scale.multiply(
            new THREE.Vector3(
                scale[0],
                scale[1],
                scale[2]
            )
        );


        const rotation =
            attachment.rotation
            ||
            [0, 0, 0];


        model.rotation.set(
            rotation[0],
            rotation[1],
            rotation[2]
        );


        const position =
            attachment.position
            ||
            [0, 3, 0];


        model.position.add(
            new THREE.Vector3(
                position[0],
                position[1],
                position[2]
            )
        );


        model.traverse(
            object => {

                if (
                    object.isMesh
                ) {

                    object.castShadow =
                        true;

                }

            }
        );


        this.hat =
            model;


        this.characterRoot.add(
            model
        );

    }


    /* =========================================================
       AVATAR IMAGE

       Returns a PNG as a data URL.

       Example:
       data:image/png;base64,...
    ========================================================= */

    getAvatarImage() {

        /*
            Make sure everything is rendered
            one final time before capturing.
        */

        this.controls.update();


        this.renderer.render(
            this.scene,
            this.camera
        );


        const image =
            this.renderer
                .domElement
                .toDataURL(
                    "image/png"
                );


        console.log(
            "Nova: avatar image created."
        );


        return image;

    }


    /* =========================================================
       LOAD TEXTURE
    ========================================================= */

    async loadColorTexture(path) {

        console.log(
            "Nova: loading texture:",
            path
        );


        const texture =
            await this.textureLoader.loadAsync(
                path
            );


        texture.colorSpace =
            THREE.SRGBColorSpace;


        texture.flipY =
            false;


        texture.needsUpdate =
            true;


        return texture;

    }


    /* =========================================================
       DEBUG
    ========================================================= */

    logModelStructure() {

        if (!this.body) {
            return;
        }


        console.group(
            "NOVA AVATAR STRUCTURE"
        );


        this.body.traverse(
            object => {

                console.log(
                    "OBJECT:",
                    object.name,
                    "| TYPE:",
                    object.type
                );


                if (!object.isMesh) {
                    return;
                }


                const materials =
                    Array.isArray(
                        object.material
                    )
                        ?
                        object.material
                        :
                        [object.material];


                console.log(
                    "   MATERIALS:",
                    materials.map(
                        material =>
                            material?.name
                    )
                );


                console.log(
                    "   UV:",
                    !!object.geometry
                        ?.attributes
                        ?.uv
                );

            }
        );


        console.groupEnd();

    }


    /* =========================================================
       RESIZE
    ========================================================= */

    resize() {

        const width =
            this.container
                .clientWidth;


        const height =
            this.container
                .clientHeight;


        if (
            width <= 0 ||
            height <= 0
        ) {

            return;

        }


        this.renderer.setSize(
            width,
            height,
            false
        );


        this.camera.aspect =
            width /
            height;


        this.camera
            .updateProjectionMatrix();

    }


    /* =========================================================
       RENDER LOOP
    ========================================================= */

    animate() {

        requestAnimationFrame(
            () => this.animate()
        );


        this.controls.update();


        this.renderer.render(
            this.scene,
            this.camera
        );

    }


    /* =========================================================
       CLEANUP
    ========================================================= */

    disposeObject(object) {

        object.traverse(
            child => {

                if (!child.isMesh) {
                    return;
                }


                child.geometry
                    ?.dispose();


                const materials =
                    Array.isArray(
                        child.material
                    )
                        ?
                        child.material
                        :
                        [child.material];


                materials.forEach(
                    material => {

                        material
                            ?.dispose();

                    }
                );

            }
        );

    }

}