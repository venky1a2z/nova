using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using SharpGLTF.Schema2;
using StbImageSharp;

using NumericsMatrix4 =
    System.Numerics.Matrix4x4;

using NumericsVector2 =
    System.Numerics.Vector2;

using NumericsVector3 =
    System.Numerics.Vector3;

using GLPrimitiveType =
    OpenTK.Graphics.OpenGL4.PrimitiveType;

using GLTextureWrapMode =
    OpenTK.Graphics.OpenGL4.TextureWrapMode;

namespace Nova.Player;

public sealed class GuestRenderer :
    IDisposable
{
    private readonly List<MeshBuffer>
        _meshBuffers =
            new();


    private readonly AvatarConfig
        _avatar;


    private int _shaderProgram;

    private int _modelLocation;

    private int _viewLocation;

    private int _projectionLocation;

    private int _textureLocation;

    private int _useTextureLocation;

    private int _baseColorLocation;


    public bool IsLoaded =>
        _meshBuffers.Count > 0;


    private const string VertexShaderSource =
        """
        #version 330 core

        layout(location = 0)
        in vec3 aPosition;

        layout(location = 1)
        in vec2 aTexCoord;

        out vec2 texCoord;

        uniform mat4 model;
        uniform mat4 view;
        uniform mat4 projection;

        void main()
        {
            gl_Position =
                projection *
                view *
                model *
                vec4(
                    aPosition,
                    1.0
                );

            texCoord =
                aTexCoord;
        }
        """;


    private const string FragmentShaderSource =
        """
        #version 330 core

        in vec2 texCoord;

        out vec4 outputColor;

        uniform sampler2D baseTexture;

        uniform int useTexture;

        uniform vec4 baseColor;

        void main()
        {
            vec4 finalColor =
                baseColor;

            if (
                useTexture == 1
            )
            {
                finalColor *=
                    texture(
                        baseTexture,
                        texCoord
                    );
            }

            if (
                finalColor.a < 0.05
            )
            {
                discard;
            }

            outputColor =
                finalColor;
        }
        """;


    public GuestRenderer(
        GuestModel guestModel,
        AvatarConfig avatar)
    {
        _avatar =
            avatar;


        CreateShader();


        CreateMeshes(
            guestModel.Model
        );
    }


    private void CreateShader()
    {
        int vertexShader =
            CompileShader(
                ShaderType.VertexShader,
                VertexShaderSource
            );


        int fragmentShader =
            CompileShader(
                ShaderType.FragmentShader,
                FragmentShaderSource
            );


        _shaderProgram =
            GL.CreateProgram();


        GL.AttachShader(
            _shaderProgram,
            vertexShader
        );


        GL.AttachShader(
            _shaderProgram,
            fragmentShader
        );


        GL.LinkProgram(
            _shaderProgram
        );


        GL.GetProgram(
            _shaderProgram,
            GetProgramParameterName.LinkStatus,
            out int success
        );


        if (
            success == 0
        )
        {
            throw new Exception(
                GL.GetProgramInfoLog(
                    _shaderProgram
                )
            );
        }


        GL.DeleteShader(
            vertexShader
        );


        GL.DeleteShader(
            fragmentShader
        );


        _modelLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "model"
            );


        _viewLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "view"
            );


        _projectionLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "projection"
            );


        _textureLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "baseTexture"
            );


        _useTextureLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "useTexture"
            );


        _baseColorLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "baseColor"
            );


        GL.UseProgram(
            _shaderProgram
        );


        GL.Uniform1(
            _textureLocation,
            0
        );
    }


    private static int CompileShader(
        ShaderType type,
        string source)
    {
        int shader =
            GL.CreateShader(
                type
            );


        GL.ShaderSource(
            shader,
            source
        );


        GL.CompileShader(
            shader
        );


        GL.GetShader(
            shader,
            ShaderParameter.CompileStatus,
            out int success
        );


        if (
            success == 0
        )
        {
            string error =
                GL.GetShaderInfoLog(
                    shader
                );


            GL.DeleteShader(
                shader
            );


            throw new Exception(
                error
            );
        }


        return shader;
    }


    private void CreateMeshes(
        ModelRoot model)
    {
        List<PendingMesh>
            pendingMeshes =
                new();


        float minX =
            float.MaxValue;

        float minY =
            float.MaxValue;

        float minZ =
            float.MaxValue;


        float maxX =
            float.MinValue;

        float maxY =
            float.MinValue;

        float maxZ =
            float.MinValue;


        Vector4 skinColor =
            _avatar.GetSkinColor();


        foreach (
            Node node
            in model.LogicalNodes
        )
        {
            Mesh? mesh =
                node.Mesh;


            if (
                mesh is null
            )
            {
                continue;
            }


            string nodeName =
                node.Name ?? "";


            string meshName =
                mesh.Name ?? "";


            NumericsMatrix4 worldMatrix =
                node.WorldMatrix;


            foreach (
                MeshPrimitive primitive
                in mesh.Primitives
            )
            {
                Accessor? positionAccessor =
                    primitive.GetVertexAccessor(
                        "POSITION"
                    );


                if (
                    positionAccessor is null
                )
                {
                    continue;
                }


                NumericsVector3[]
                    localPositions =
                        positionAccessor
                            .AsVector3Array()
                            .ToArray();


                NumericsVector3[]
                    positions =
                        new NumericsVector3[
                            localPositions.Length
                        ];


                for (
                    int i = 0;
                    i < localPositions.Length;
                    i++
                )
                {
                    positions[i] =
                        NumericsVector3.Transform(
                            localPositions[i],
                            worldMatrix
                        );


                    NumericsVector3 p =
                        positions[i];


                    minX =
                        MathF.Min(
                            minX,
                            p.X
                        );

                    minY =
                        MathF.Min(
                            minY,
                            p.Y
                        );

                    minZ =
                        MathF.Min(
                            minZ,
                            p.Z
                        );


                    maxX =
                        MathF.Max(
                            maxX,
                            p.X
                        );

                    maxY =
                        MathF.Max(
                            maxY,
                            p.Y
                        );

                    maxZ =
                        MathF.Max(
                            maxZ,
                            p.Z
                        );
                }


                Accessor? uvAccessor =
                    primitive.GetVertexAccessor(
                        "TEXCOORD_0"
                    );


                NumericsVector2[] uvs =
                    uvAccessor is not null
                        ?
                        uvAccessor
                            .AsVector2Array()
                            .ToArray()
                        :
                        new NumericsVector2[
                            positions.Length
                        ];


                IList<uint>? rawIndices =
                    primitive.GetIndices();


                uint[] indices;


                if (
                    rawIndices is not null
                    &&
                    rawIndices.Count > 0
                )
                {
                    indices =
                        rawIndices.ToArray();
                }
                else
                {
                    indices =
                        new uint[
                            positions.Length
                        ];


                    for (
                        uint i = 0;
                        i < indices.Length;
                        i++
                    )
                    {
                        indices[i] =
                            i;
                    }
                }


                string materialName =
                    primitive.Material
                        ?.Name ?? "";


                int texture =
                    0;


                bool useTexture =
                    false;


                Vector4 baseColor =
                    Vector4.One;


                if (
                    meshName.Equals(
                        "Skin",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    nodeName.Equals(
                        "Skin",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    baseColor =
                        skinColor;
                }

                else if (
                    materialName.Equals(
                        "Shirt",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    meshName.Equals(
                        "Shirt",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    nodeName.Equals(
                        "Shirt",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    texture =
                        LoadAvatarTexture(
                            "shirts",
                            _avatar.Shirt
                        );


                    useTexture =
                        texture != 0;
                }

                else if (
                    materialName.Equals(
                        "Pant",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    meshName.Equals(
                        "Pant",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    nodeName.Equals(
                        "Pant",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    texture =
                        LoadAvatarTexture(
                            "pants",
                            _avatar.Pants
                        );


                    useTexture =
                        texture != 0;
                }

                else if (
                    materialName.Equals(
                        "Face",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    meshName.Equals(
                        "Face",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    nodeName.Equals(
                        "Face",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    texture =
                        LoadAvatarTexture(
                            "faces",
                            _avatar.Face
                        );


                    useTexture =
                        texture != 0;
                }

                else
                {
                    texture =
                        LoadPrimitiveTexture(
                            primitive
                        );


                    useTexture =
                        texture != 0;
                }


                pendingMeshes.Add(
                    new PendingMesh(
                        positions,
                        uvs,
                        indices,
                        texture,
                        useTexture,
                        baseColor
                    )
                );
            }
        }


        if (
            pendingMeshes.Count == 0
        )
        {
            return;
        }


        float centerX =
            (minX + maxX) *
            0.5f;


        float centerZ =
            (minZ + maxZ) *
            0.5f;


        float feetY =
            minY;


        float originalHeight =
            maxY -
            minY;


        /*
         * YOUR WORKING SIZE.
         * DO NOT CHANGE.
         */

        const float desiredHeight =
            3.84f;


        float scale =
            originalHeight >
            0.0001f
                ?
                desiredHeight /
                originalHeight
                :
                1f;


        foreach (
            PendingMesh pending
            in pendingMeshes
        )
        {
            float[] vertices =
                new float[
                    pending.Positions.Length *
                    5
                ];


            for (
                int i = 0;
                i < pending.Positions.Length;
                i++
            )
            {
                NumericsVector3 position =
                    pending.Positions[i];


                NumericsVector2 uv =
                    i < pending.Uvs.Length
                        ?
                        pending.Uvs[i]
                        :
                        NumericsVector2.Zero;


                vertices[
                    (i * 5) + 0
                ] =
                    (
                        position.X -
                        centerX
                    ) *
                    scale;


                vertices[
                    (i * 5) + 1
                ] =
                    (
                        position.Y -
                        feetY
                    ) *
                    scale;


                vertices[
                    (i * 5) + 2
                ] =
                    (
                        position.Z -
                        centerZ
                    ) *
                    scale;


                vertices[
                    (i * 5) + 3
                ] =
                    uv.X;


                /*
                 * IMPORTANT:
                 * DO NOT FLIP THIS.
                 */

                vertices[
                    (i * 5) + 4
                ] =
                    uv.Y;
            }


            _meshBuffers.Add(
                CreateMeshBuffer(
                    vertices,
                    pending.Indices,
                    pending.Texture,
                    pending.UseTexture,
                    pending.BaseColor
                )
            );
        }
    }


    private static int LoadAvatarTexture(
        string category,
        string itemId)
    {
        string path =
            Path.Combine(
                AppContext.BaseDirectory,
                "Assets",
                "character",
                category,
                itemId,
                "texture.png"
            );


        if (
            !File.Exists(
                path
            )
        )
        {
            Console.WriteLine(
                $"Missing avatar texture: {path}"
            );

            return 0;
        }


        return
            LoadTextureFile(
                path
            );
    }


    private static int LoadTextureFile(
        string path)
    {
        try
        {
            byte[] bytes =
                File.ReadAllBytes(
                    path
                );


            ImageResult decoded =
                ImageResult.FromMemory(
                    bytes,
                    ColorComponents.RedGreenBlueAlpha
                );


            return
                CreateOpenGlTexture(
                    decoded
                );
        }
        catch (
            Exception exception
        )
        {
            Console.WriteLine(
                exception.Message
            );

            return 0;
        }
    }


    private static int LoadPrimitiveTexture(
        MeshPrimitive primitive)
    {
        try
        {
            SharpGLTF.Schema2.Material? material =
                primitive.Material;


            if (
                material is null
            )
            {
                return 0;
            }


            MaterialChannel? channel =
                material.FindChannel(
                    "BaseColor"
                );


            if (
                channel is null
            )
            {
                return 0;
            }


            SharpGLTF.Schema2.Texture? texture =
                channel.Value.Texture;


            if (
                texture is null
            )
            {
                return 0;
            }


            SharpGLTF.Schema2.Image? image =
                texture.PrimaryImage;


            if (
                image is null
            )
            {
                return 0;
            }


            byte[] bytes =
                image
                    .Content
                    .Content
                    .ToArray();


            if (
                bytes.Length == 0
            )
            {
                return 0;
            }


            ImageResult decoded =
                ImageResult.FromMemory(
                    bytes,
                    ColorComponents.RedGreenBlueAlpha
                );


            return
                CreateOpenGlTexture(
                    decoded
                );
        }
        catch
        {
            return 0;
        }
    }


    private static int CreateOpenGlTexture(
        ImageResult decoded)
    {
        int texture =
            GL.GenTexture();


        GL.BindTexture(
            TextureTarget.Texture2D,
            texture
        );


        GL.TexImage2D(
            TextureTarget.Texture2D,
            0,
            PixelInternalFormat.Rgba,
            decoded.Width,
            decoded.Height,
            0,
            PixelFormat.Rgba,
            PixelType.UnsignedByte,
            decoded.Data
        );


        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureMinFilter,
            (int)
            TextureMinFilter.LinearMipmapLinear
        );


        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureMagFilter,
            (int)
            TextureMagFilter.Linear
        );


        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureWrapS,
            (int)
            GLTextureWrapMode.Repeat
        );


        GL.TexParameter(
            TextureTarget.Texture2D,
            TextureParameterName.TextureWrapT,
            (int)
            GLTextureWrapMode.Repeat
        );


        GL.GenerateMipmap(
            GenerateMipmapTarget.Texture2D
        );


        GL.BindTexture(
            TextureTarget.Texture2D,
            0
        );


        return texture;
    }


    private static MeshBuffer CreateMeshBuffer(
        float[] vertices,
        uint[] indices,
        int texture,
        bool useTexture,
        Vector4 baseColor)
    {
        int vao =
            GL.GenVertexArray();


        int vbo =
            GL.GenBuffer();


        int ebo =
            GL.GenBuffer();


        GL.BindVertexArray(
            vao
        );


        GL.BindBuffer(
            BufferTarget.ArrayBuffer,
            vbo
        );


        GL.BufferData(
            BufferTarget.ArrayBuffer,
            vertices.Length *
            sizeof(float),
            vertices,
            BufferUsageHint.StaticDraw
        );


        GL.BindBuffer(
            BufferTarget.ElementArrayBuffer,
            ebo
        );


        GL.BufferData(
            BufferTarget.ElementArrayBuffer,
            indices.Length *
            sizeof(uint),
            indices,
            BufferUsageHint.StaticDraw
        );


        GL.VertexAttribPointer(
            0,
            3,
            VertexAttribPointerType.Float,
            false,
            5 * sizeof(float),
            0
        );


        GL.EnableVertexAttribArray(
            0
        );


        GL.VertexAttribPointer(
            1,
            2,
            VertexAttribPointerType.Float,
            false,
            5 * sizeof(float),
            3 * sizeof(float)
        );


        GL.EnableVertexAttribArray(
            1
        );


        GL.BindVertexArray(
            0
        );


        return
            new MeshBuffer(
                vao,
                vbo,
                ebo,
                indices.Length,
                texture,
                useTexture,
                baseColor
            );
    }


    public void Draw(
        Vector3 playerPosition,
        float facingYaw,
        bool isMoving,
        bool isGrounded,
        float verticalVelocity,
        Matrix4 view,
        Matrix4 projection)
    {
        if (
            !IsLoaded
        )
        {
            return;
        }


        /*
         * YOUR WORKING GROUND OFFSET.
         */

        const float verticalOffset =
            -1.7f;


        Vector3 modelPosition =
            new Vector3(
                playerPosition.X,

                playerPosition.Y +
                verticalOffset,

                playerPosition.Z
            );


        /*
         * + PI fixes the GLB facing
         * backwards.
         */

        Matrix4 rotation =
            Matrix4.CreateRotationY(
                facingYaw +
                MathHelper.Pi
            );


        /*
         * Small jump lean only.
         *
         * No fake walking bob.
         */

        float jumpTilt =
            0f;


        if (
            !isGrounded
        )
        {
            jumpTilt =
                verticalVelocity >= 0f
                    ?
                    MathHelper.DegreesToRadians(-3f)
                    :
                    MathHelper.DegreesToRadians(3f);
        }


        Matrix4 jumpRotation =
            Matrix4.CreateRotationX(
                jumpTilt
            );


        Matrix4 translation =
            Matrix4.CreateTranslation(
                modelPosition
            );


        Matrix4 model =
            jumpRotation *
            rotation *
            translation;


        GL.UseProgram(
            _shaderProgram
        );


        GL.UniformMatrix4(
            _modelLocation,
            false,
            ref model
        );


        GL.UniformMatrix4(
            _viewLocation,
            false,
            ref view
        );


        GL.UniformMatrix4(
            _projectionLocation,
            false,
            ref projection
        );


        foreach (
            MeshBuffer mesh
            in _meshBuffers
        )
        {
            GL.Uniform4(
                _baseColorLocation,
                mesh.BaseColor
            );


            if (
                mesh.UseTexture
                &&
                mesh.Texture != 0
            )
            {
                GL.Uniform1(
                    _useTextureLocation,
                    1
                );


                GL.ActiveTexture(
                    TextureUnit.Texture0
                );


                GL.BindTexture(
                    TextureTarget.Texture2D,
                    mesh.Texture
                );
            }
            else
            {
                GL.Uniform1(
                    _useTextureLocation,
                    0
                );


                GL.BindTexture(
                    TextureTarget.Texture2D,
                    0
                );
            }


            GL.BindVertexArray(
                mesh.VertexArrayObject
            );


            GL.DrawElements(
                GLPrimitiveType.Triangles,
                mesh.IndexCount,
                DrawElementsType.UnsignedInt,
                0
            );
        }


        GL.BindVertexArray(
            0
        );


        GL.BindTexture(
            TextureTarget.Texture2D,
            0
        );
    }


    public void Dispose()
    {
        foreach (
            MeshBuffer mesh
            in _meshBuffers
        )
        {
            if (
                mesh.Texture != 0
            )
            {
                GL.DeleteTexture(
                    mesh.Texture
                );
            }


            GL.DeleteBuffer(
                mesh.ElementBufferObject
            );


            GL.DeleteBuffer(
                mesh.VertexBufferObject
            );


            GL.DeleteVertexArray(
                mesh.VertexArrayObject
            );
        }


        _meshBuffers.Clear();


        if (
            _shaderProgram != 0
        )
        {
            GL.DeleteProgram(
                _shaderProgram
            );


            _shaderProgram =
                0;
        }


        GC.SuppressFinalize(
            this
        );
    }


    private sealed class PendingMesh
    {
        public NumericsVector3[] Positions
        {
            get;
        }


        public NumericsVector2[] Uvs
        {
            get;
        }


        public uint[] Indices
        {
            get;
        }


        public int Texture
        {
            get;
        }


        public bool UseTexture
        {
            get;
        }


        public Vector4 BaseColor
        {
            get;
        }


        public PendingMesh(
            NumericsVector3[] positions,
            NumericsVector2[] uvs,
            uint[] indices,
            int texture,
            bool useTexture,
            Vector4 baseColor)
        {
            Positions =
                positions;

            Uvs =
                uvs;

            Indices =
                indices;

            Texture =
                texture;

            UseTexture =
                useTexture;

            BaseColor =
                baseColor;
        }
    }


    private sealed class MeshBuffer
    {
        public int VertexArrayObject
        {
            get;
        }


        public int VertexBufferObject
        {
            get;
        }


        public int ElementBufferObject
        {
            get;
        }


        public int IndexCount
        {
            get;
        }


        public int Texture
        {
            get;
        }


        public bool UseTexture
        {
            get;
        }


        public Vector4 BaseColor
        {
            get;
        }


        public MeshBuffer(
            int vao,
            int vbo,
            int ebo,
            int indexCount,
            int texture,
            bool useTexture,
            Vector4 baseColor)
        {
            VertexArrayObject =
                vao;

            VertexBufferObject =
                vbo;

            ElementBufferObject =
                ebo;

            IndexCount =
                indexCount;

            Texture =
                texture;

            UseTexture =
                useTexture;

            BaseColor =
                baseColor;
        }
    }
}