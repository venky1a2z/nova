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

public sealed class HatRenderer :
    IDisposable
{
    private readonly List<HatMeshBuffer>
        _meshBuffers =
            new();


    private readonly string
        _hatId;


    private int _shaderProgram;

    private int _modelLocation;

    private int _viewLocation;

    private int _projectionLocation;

    private int _textureLocation;

    private int _useTextureLocation;


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

        void main()
        {
            if (
                useTexture == 1
            )
            {
                vec4 color =
                    texture(
                        baseTexture,
                        texCoord
                    );

                if (
                    color.a < 0.05
                )
                {
                    discard;
                }

                outputColor =
                    color;
            }
            else
            {
                outputColor =
                    vec4(
                        1.0,
                        1.0,
                        1.0,
                        1.0
                    );
            }
        }
        """;


    public HatRenderer(
        string hatId)
    {
        _hatId =
            hatId;


        if (
            string.IsNullOrWhiteSpace(
                _hatId
            )
            ||
            _hatId.Equals(
                "none",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return;
        }


        CreateShader();

        LoadHat();
    }


    private void LoadHat()
    {
        string filePath =
            Path.Combine(
                AppContext.BaseDirectory,
                "Assets",
                "character",
                "hats",
                _hatId,
                "model.glb"
            );


        if (
            !File.Exists(
                filePath
            )
        )
        {
            Console.WriteLine(
                $"Hat not found: {filePath}"
            );

            return;
        }


        ModelRoot model =
            ModelRoot.Load(
                filePath
            );


        List<PendingHatMesh>
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


                int texture =
                    LoadPrimitiveTexture(
                        primitive
                    );


                pendingMeshes.Add(
                    new PendingHatMesh(
                        positions,
                        uvs,
                        indices,
                        texture
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


        float centerY =
            (minY + maxY) *
            0.5f;


        float centerZ =
            (minZ + maxZ) *
            0.5f;


        float width =
            maxX -
            minX;


        float targetWidth =
            GetTargetWidth();


        float scale =
            width >
            0.0001f
                ?
                targetWidth /
                width
                :
                1f;


        foreach (
            PendingHatMesh pending
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
                        centerY
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


                vertices[
                    (i * 5) + 4
                ] =
                    uv.Y;
            }


            _meshBuffers.Add(
                CreateMeshBuffer(
                    vertices,
                    pending.Indices,
                    pending.Texture
                )
            );
        }
    }


    private float GetTargetWidth()
    {
        return _hatId
            .ToLowerInvariant()
            switch
            {
                "beanie" =>
                    1.35f,

                "crown" =>
                    1.55f,

                "pizza-cap" =>
                    1.45f,

                _ =>
                    1.35f
            };
    }


    private Vector3 GetPositionOffset()
    {
        /*
         * KEEPING YOUR CURRENT
         * WORKING HAT POSITIONS.
         */

        return _hatId
            .ToLowerInvariant()
            switch
            {
                "beanie" =>
                    new Vector3(
                        0f,
                        2.16f,
                        0f
                    ),

                "crown" =>
                    new Vector3(
                        0f,
                        2.28f,
                        0f
                    ),

                "pizza-cap" =>
                    new Vector3(
                        0.03f,
                        2.10f,
                        -0.12f
                    ),

                _ =>
                    new Vector3(
                        0f,
                        2.16f,
                        0f
                    )
            };
    }


    private Vector3 GetExtraScale()
    {
        return _hatId
            .ToLowerInvariant()
            switch
            {
                "beanie" =>
                    new Vector3(
                        0.7f
                    ),

                "crown" =>
                    new Vector3(
                        0.7f
                    ),

                "pizza-cap" =>
                    new Vector3(
                        1.1f
                    ),

                _ =>
                    Vector3.One
            };
    }


    public void Draw(
        Vector3 playerPosition,
        float facingYaw,
        Matrix4 view,
        Matrix4 projection)
    {
        if (
            !IsLoaded
        )
        {
            return;
        }


        Vector3 offset =
            GetPositionOffset();


        Vector3 extraScale =
            GetExtraScale();


        /*
         * Same orientation correction
         * as GuestRenderer.
         */

        float rotationAngle =
            facingYaw +
            MathHelper.Pi;


        /*
         * Rotate the hat's POSITION
         * offset with the player too.
         */

        float cos =
            MathF.Cos(
                rotationAngle
            );


        float sin =
            MathF.Sin(
                rotationAngle
            );


        Vector3 rotatedOffset =
            new Vector3(
                offset.X * cos +
                offset.Z * sin,

                offset.Y,

                -offset.X * sin +
                offset.Z * cos
            );


        Vector3 finalPosition =
            playerPosition +
            rotatedOffset;


        Matrix4 scale =
            Matrix4.CreateScale(
                extraScale
            );


        Matrix4 rotation =
            Matrix4.CreateRotationY(
                rotationAngle
            );


        Matrix4 translation =
            Matrix4.CreateTranslation(
                finalPosition
            );


        Matrix4 model =
            scale *
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
            HatMeshBuffer mesh
            in _meshBuffers
        )
        {
            if (
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


    private static int LoadPrimitiveTexture(
        MeshPrimitive primitive)
    {
        try
        {
            Material? material =
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


            int glTexture =
                GL.GenTexture();


            GL.BindTexture(
                TextureTarget.Texture2D,
                glTexture
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


            return glTexture;
        }
        catch
        {
            return 0;
        }
    }


    private static HatMeshBuffer CreateMeshBuffer(
        float[] vertices,
        uint[] indices,
        int texture)
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
            new HatMeshBuffer(
                vao,
                vbo,
                ebo,
                indices.Length,
                texture
            );
    }


    public void Dispose()
    {
        foreach (
            HatMeshBuffer mesh
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


    private sealed class PendingHatMesh
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


        public PendingHatMesh(
            NumericsVector3[] positions,
            NumericsVector2[] uvs,
            uint[] indices,
            int texture)
        {
            Positions =
                positions;

            Uvs =
                uvs;

            Indices =
                indices;

            Texture =
                texture;
        }
    }


    private sealed class HatMeshBuffer
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


        public HatMeshBuffer(
            int vao,
            int vbo,
            int ebo,
            int indexCount,
            int texture)
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
        }
    }
}