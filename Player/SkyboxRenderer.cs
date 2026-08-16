using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using StbImageSharp;

namespace Nova.Player;

public sealed class SkyboxRenderer : IDisposable
{
    private int _vao;
    private int _vbo;
    private int _texture;
    private int _shaderProgram;

    private int _viewLocation;
    private int _projectionLocation;

    private readonly float[] _vertices =
    {
        // Back
        -1f,  1f, -1f,
        -1f, -1f, -1f,
         1f, -1f, -1f,
         1f, -1f, -1f,
         1f,  1f, -1f,
        -1f,  1f, -1f,

        // Left
        -1f, -1f,  1f,
        -1f, -1f, -1f,
        -1f,  1f, -1f,
        -1f,  1f, -1f,
        -1f,  1f,  1f,
        -1f, -1f,  1f,

        // Right
         1f, -1f, -1f,
         1f, -1f,  1f,
         1f,  1f,  1f,
         1f,  1f,  1f,
         1f,  1f, -1f,
         1f, -1f, -1f,

        // Front
        -1f, -1f,  1f,
        -1f,  1f,  1f,
         1f,  1f,  1f,
         1f,  1f,  1f,
         1f, -1f,  1f,
        -1f, -1f,  1f,

        // Top
        -1f,  1f, -1f,
         1f,  1f, -1f,
         1f,  1f,  1f,
         1f,  1f,  1f,
        -1f,  1f,  1f,
        -1f,  1f, -1f,

        // Bottom
        -1f, -1f, -1f,
        -1f, -1f,  1f,
         1f, -1f, -1f,
         1f, -1f, -1f,
        -1f, -1f,  1f,
         1f, -1f,  1f
    };

    private const string VertexShaderSource = """
        #version 330 core

        layout(location = 0) in vec3 aPosition;

        out vec3 texCoord;

        uniform mat4 view;
        uniform mat4 projection;

        void main()
        {
            texCoord = aPosition;

            vec4 position =
                projection *
                view *
                vec4(aPosition, 1.0);

            gl_Position = position.xyww;
        }
        """;

    private const string FragmentShaderSource = """
        #version 330 core

        in vec3 texCoord;

        out vec4 outputColor;

        uniform samplerCube skybox;

        void main()
        {
            outputColor =
                texture(skybox, texCoord);
        }
        """;

    public SkyboxRenderer()
    {
        CreateMesh();
        CreateShader();

        _texture = LoadCubemap();
    }

    private void CreateMesh()
    {
        _vao = GL.GenVertexArray();
        _vbo = GL.GenBuffer();

        GL.BindVertexArray(_vao);

        GL.BindBuffer(
            BufferTarget.ArrayBuffer,
            _vbo
        );

        GL.BufferData(
            BufferTarget.ArrayBuffer,
            _vertices.Length * sizeof(float),
            _vertices,
            BufferUsageHint.StaticDraw
        );

        GL.VertexAttribPointer(
            0,
            3,
            VertexAttribPointerType.Float,
            false,
            3 * sizeof(float),
            0
        );

        GL.EnableVertexAttribArray(0);

        GL.BindVertexArray(0);
    }

    private void CreateShader()
    {
        int vertexShader = CompileShader(
            ShaderType.VertexShader,
            VertexShaderSource
        );

        int fragmentShader = CompileShader(
            ShaderType.FragmentShader,
            FragmentShaderSource
        );

        _shaderProgram = GL.CreateProgram();

        GL.AttachShader(
            _shaderProgram,
            vertexShader
        );

        GL.AttachShader(
            _shaderProgram,
            fragmentShader
        );

        GL.LinkProgram(_shaderProgram);

        GL.GetProgram(
            _shaderProgram,
            GetProgramParameterName.LinkStatus,
            out int success
        );

        if (success == 0)
        {
            throw new Exception(
                GL.GetProgramInfoLog(
                    _shaderProgram
                )
            );
        }

        GL.DeleteShader(vertexShader);
        GL.DeleteShader(fragmentShader);

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

        int samplerLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "skybox"
            );

        GL.UseProgram(_shaderProgram);

        GL.Uniform1(
            samplerLocation,
            0
        );
    }

    private static int CompileShader(
        ShaderType type,
        string source)
    {
        int shader =
            GL.CreateShader(type);

        GL.ShaderSource(
            shader,
            source
        );

        GL.CompileShader(shader);

        GL.GetShader(
            shader,
            ShaderParameter.CompileStatus,
            out int success
        );

        if (success == 0)
        {
            string error =
                GL.GetShaderInfoLog(shader);

            throw new Exception(
                $"Skybox shader error: {error}"
            );
        }

        return shader;
    }

    private static int LoadCubemap()
    {
        int texture =
            GL.GenTexture();

        GL.BindTexture(
            TextureTarget.TextureCubeMap,
            texture
        );

        string skyboxFolder =
            Path.Combine(
                AppContext.BaseDirectory,
                "Assets",
                "Environment",
                "Skybox"
            );

        string[] files =
        {
            "right.png",
            "left.png",
            "top.png",
            "bottom.png",
            "front.png",
            "back.png"
        };

        TextureTarget[] targets =
        {
            TextureTarget.TextureCubeMapPositiveX,
            TextureTarget.TextureCubeMapNegativeX,
            TextureTarget.TextureCubeMapPositiveY,
            TextureTarget.TextureCubeMapNegativeY,
            TextureTarget.TextureCubeMapPositiveZ,
            TextureTarget.TextureCubeMapNegativeZ
        };

        /*
         * Cubemap images should NOT use the same vertical
         * flipping as ordinary OpenGL textures.
         */
        StbImage.stbi_set_flip_vertically_on_load(0);

        for (int index = 0;
             index < files.Length;
             index++)
        {
            string path =
                Path.Combine(
                    skyboxFolder,
                    files[index]
                );

            if (!File.Exists(path))
            {
                throw new FileNotFoundException(
                    $"Skybox image missing: {path}"
                );
            }

            using FileStream stream =
                File.OpenRead(path);

            ImageResult image =
                ImageResult.FromStream(
                    stream,
                    ColorComponents.RedGreenBlueAlpha
                );

            GL.TexImage2D(
                targets[index],
                0,
                PixelInternalFormat.Rgba,
                image.Width,
                image.Height,
                0,
                PixelFormat.Rgba,
                PixelType.UnsignedByte,
                image.Data
            );

            Console.WriteLine(
                $"Loaded skybox face: {files[index]}"
            );
        }

        GL.TexParameter(
            TextureTarget.TextureCubeMap,
            TextureParameterName.TextureMinFilter,
            (int)TextureMinFilter.Linear
        );

        GL.TexParameter(
            TextureTarget.TextureCubeMap,
            TextureParameterName.TextureMagFilter,
            (int)TextureMagFilter.Linear
        );

        GL.TexParameter(
            TextureTarget.TextureCubeMap,
            TextureParameterName.TextureWrapS,
            (int)TextureWrapMode.ClampToEdge
        );

        GL.TexParameter(
            TextureTarget.TextureCubeMap,
            TextureParameterName.TextureWrapT,
            (int)TextureWrapMode.ClampToEdge
        );

        GL.TexParameter(
            TextureTarget.TextureCubeMap,
            TextureParameterName.TextureWrapR,
            (int)TextureWrapMode.ClampToEdge
        );

        GL.BindTexture(
            TextureTarget.TextureCubeMap,
            0
        );

        return texture;
    }

    public void Draw(
        Matrix4 view,
        Matrix4 projection)
    {
        GL.DepthFunc(
            DepthFunction.Lequal
        );

        /*
         * Remove camera position.
         * The sky should rotate with the camera,
         * but never move closer or farther away.
         */
        Matrix4 skyView = view;

        skyView.M41 = 0f;
        skyView.M42 = 0f;
        skyView.M43 = 0f;

        GL.UseProgram(
            _shaderProgram
        );

        GL.UniformMatrix4(
            _viewLocation,
            false,
            ref skyView
        );

        GL.UniformMatrix4(
            _projectionLocation,
            false,
            ref projection
        );

        GL.BindVertexArray(
            _vao
        );

        GL.ActiveTexture(
            TextureUnit.Texture0
        );

        GL.BindTexture(
            TextureTarget.TextureCubeMap,
            _texture
        );

        GL.DrawArrays(
            PrimitiveType.Triangles,
            0,
            36
        );

        GL.BindVertexArray(0);

        GL.DepthFunc(
            DepthFunction.Less
        );
    }

    public void Dispose()
    {
        GL.DeleteTexture(_texture);
        GL.DeleteBuffer(_vbo);
        GL.DeleteVertexArray(_vao);
        GL.DeleteProgram(_shaderProgram);
    }
}