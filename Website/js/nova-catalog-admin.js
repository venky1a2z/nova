const NovaCatalogAdmin = {

    user:
        null,

    imageFile:
        null,


    async init() {


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

            window.location.href =
                "login.html";

            return;

        }


        this.user =
            data.user;


        const allowed =
            await this.checkAdmin();


        if (
            !allowed
        ) {

            document
                .getElementById(
                    "catalogAccessDenied"
                )
                .hidden =
                    false;


            return;

        }


        document
            .getElementById(
                "catalogAdminCard"
            )
            .hidden =
                false;


        this.setupControls();

    },



    async checkAdmin() {


        const {
            data,
            error
        } =
            await NovaSupabase
                .rpc(
                    "is_nova_admin"
                );


        if (
            error
        ) {

            console.error(
                "Catalog admin check:",
                error
            );


            return false;

        }


        return data === true;

    },



    setupControls() {


        const imageInput =
            document.getElementById(
                "catalogImage"
            );


        imageInput.addEventListener(
            "change",
            event => {


                const file =
                    event.target
                        .files?.[0];


                this.imageFile =
                    file
                    ||
                    null;


                this.updatePreview();

            }
        );


        [
            "catalogName",
            "catalogDescription",
            "catalogPrice"
        ]
            .forEach(
                id => {


                    document
                        .getElementById(
                            id
                        )
                        ?.addEventListener(
                            "input",
                            () =>
                                this.updatePreview()
                        );

                }
            );


        document
            .getElementById(
                "catalogPublishButton"
            )
            .addEventListener(
                "click",
                () =>
                    this.publish()
            );

    },



    updatePreview() {


        const preview =
            document.getElementById(
                "catalogPreview"
            );


        const name =
            document.getElementById(
                "catalogName"
            )
                .value
                .trim();


        const description =
            document.getElementById(
                "catalogDescription"
            )
                .value
                .trim();


        const price =
            document.getElementById(
                "catalogPrice"
            )
                .value;


        if (
            !name
            &&
            !this.imageFile
        ) {

            preview.hidden =
                true;

            return;

        }


        preview.hidden =
            false;


        document
            .getElementById(
                "catalogPreviewName"
            )
            .textContent =
                name
                ||
                "Unnamed Item";


        document
            .getElementById(
                "catalogPreviewDescription"
            )
            .textContent =
                description
                ||
                "No description yet.";


        document
            .getElementById(
                "catalogPreviewPrice"
            )
            .textContent =
                `${price || 0}`;


        if (
            this.imageFile
        ) {


            const imageUrl =
                URL.createObjectURL(
                    this.imageFile
                );


            document
                .getElementById(
                    "catalogPreviewImage"
                )
                .src =
                    imageUrl;

        }

    },



    async publish() {


        const name =
            document
                .getElementById(
                    "catalogName"
                )
                .value
                .trim();


        const category =
            document
                .getElementById(
                    "catalogCategory"
                )
                .value;


        const description =
            document
                .getElementById(
                    "catalogDescription"
                )
                .value
                .trim();


        const creator =
            document
                .getElementById(
                    "catalogCreator"
                )
                .value
                .trim();


        const price =
            Number(
                document
                    .getElementById(
                        "catalogPrice"
                    )
                    .value
            );


        if (
            !name
        ) {

            this.showStatus(
                "Give the item a name.",
                true
            );

            return;

        }


        if (
            !this.imageFile
        ) {

            this.showStatus(
                "Choose an image first.",
                true
            );

            return;

        }


        if (
            !Number.isFinite(
                price
            )
            ||
            price < 0
        ) {

            this.showStatus(
                "Price must be zero or higher.",
                true
            );

            return;

        }


        const button =
            document.getElementById(
                "catalogPublishButton"
            );


        button.disabled =
            true;


        button.textContent =
            "Publishing...";


        this.showStatus(
            "Uploading image...",
            false
        );


        try {


            const extension =
                this.imageFile
                    .name
                    .split(".")
                    .pop()
                    ?.toLowerCase()
                ||
                "png";


            const fileName =
                `${crypto.randomUUID()}.${extension}`;


            const filePath =
                `${this.user.id}/${fileName}`;


            const {
                error:
                    uploadError
            } =
                await NovaSupabase
                    .storage
                    .from(
                        "catalog-images"
                    )
                    .upload(
                        filePath,
                        this.imageFile,
                        {
                            cacheControl:
                                "3600",

                            upsert:
                                false
                        }
                    );


            if (
                uploadError
            ) {

                throw uploadError;

            }


            const {
                data:
                    publicUrlData
            } =
                NovaSupabase
                    .storage
                    .from(
                        "catalog-images"
                    )
                    .getPublicUrl(
                        filePath
                    );


            const imageUrl =
                publicUrlData
                    .publicUrl;


            this.showStatus(
                "Creating catalog item...",
                false
            );


            const {
                error:
                    insertError
            } =
                await NovaSupabase
                    .from(
                        "catalog_items"
                    )
                    .insert(
                        {
                            name:
                                name,

                            category:
                                category,

                            description:
                                description,

                            image_url:
                                imageUrl,

                            price:
                                Math.floor(
                                    price
                                ),

                            creator_name:
                                creator
                                ||
                                "Nova",

                            created_by:
                                this.user.id,

                            is_published:
                                true
                        }
                    );


            if (
                insertError
            ) {

                throw insertError;

            }


            this.showStatus(
                "Published! Somehow the catalog survived.",
                false,
                true
            );


            button.textContent =
                "Published ✓";


            setTimeout(
                () => {

                    window.location.href =
                        "catalog.html";

                },
                1200
            );


        }
        catch (
            error
        ) {


            console.error(
                "Catalog publish:",
                error
            );


            this.showStatus(
                error.message
                ||
                "Publishing failed.",
                true
            );


            button.disabled =
                false;


            button.textContent =
                "Publish to Catalog";

        }

    },



    showStatus(
        message,
        isError = false,
        isSuccess = false
    ) {


        const status =
            document.getElementById(
                "catalogStatus"
            );


        status.textContent =
            message;


        status.classList
            .toggle(
                "error",
                isError
            );


        status.classList
            .toggle(
                "success",
                isSuccess
            );

    }

};


window.NovaCatalogAdmin =
    NovaCatalogAdmin;