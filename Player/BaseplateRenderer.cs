using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;

namespace Nova.Player;

public sealed class BaseplateRenderer : IDisposable
{
    private int _vao;
    private int _vbo;
    private int _shaderProgram;
    private int _texture;

    private int _viewLocation;
    private int _projectionLocation;

    private readonly float[] _vertices =
    {
        // Position              // UV
        -20f, 0f, -20f,          0f,  0f,
         20f, 0f, -20f,         10f,  0f,
         20f, 0f,  20f,         10f, 10f,

         20f, 0f,  20f,         10f, 10f,
        -20f, 0f,  20f,          0f, 10f,
        -20f, 0f, -20f,          0f,  0f
    };

    private const string VertexShaderSource = """
        #version 330 core

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec2 aTexCoord;

        out vec2 texCoord;

        uniform mat4 view;
        uniform mat4 projection;

        void main()
        {
            gl_Position =
                projection *
                view *
                vec4(aPosition, 1.0);

            texCoord = aTexCoord;
        }
        """;

    private const string FragmentShaderSource = """
        #version 330 core

        in vec2 texCoord;

        out vec4 outputColor;

        uniform sampler2D baseTexture;

        void main()
        {
            vec4 color =
                texture(baseTexture, texCoord);

            color.rgb *= 1.30;

            outputColor = color;
        }
        """;

    public BaseplateRenderer()
    {
        CreateMesh();
        CreateShader();

        _texture =
            TextureLoader.LoadTexture(
                Path.Combine(
                    "Assets",
                    "Environment",
                    "Baseplate",
                    "grass.png"
                )
            );
    }

    private void CreateMesh()
    {
        _vao =
            GL.GenVertexArray();

        _vbo =
            GL.GenBuffer();

        GL.BindVertexArray(
            _vao
        );

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
            index: 0,
            size: 3,
            type:
                VertexAttribPointerType.Float,
            normalized: false,
            stride: 5 * sizeof(float),
            offset: 0
        );

        GL.EnableVertexAttribArray(0);

        GL.VertexAttribPointer(
            index: 1,
            size: 2,
            type:
                VertexAttribPointerType.Float,
            normalized: false,
            stride: 5 * sizeof(float),
            offset: 3 * sizeof(float)
        );

        GL.EnableVertexAttribArray(1);

        GL.BindVertexArray(0);
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

        if (success == 0)
        {
            throw new Exception(
                $"Baseplate shader link error: " +
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
                "baseTexture"
            );

        GL.UseProgram(
            _shaderProgram
        );

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

        GL.CompileShader(
            shader
        );

        GL.GetShader(
            shader,
            ShaderParameter.CompileStatus,
            out int success
        );

        if (success == 0)
        {
            string error =
                GL.GetShaderInfoLog(
                    shader
                );

            GL.DeleteShader(
                shader
            );

            throw new Exception(
                $"Baseplate shader compile error: {error}"
            );
        }

        return shader;
    }

    public void Draw(
        Matrix4 view,
        Matrix4 projection)
    {
        GL.UseProgram(
            _shaderProgram
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

        GL.ActiveTexture(
            TextureUnit.Texture0
        );

        GL.BindTexture(
            TextureTarget.Texture2D,
            _texture
        );

        GL.BindVertexArray(
            _vao
        );

        GL.DrawArrays(
            PrimitiveType.Triangles,
            0,
            6
        );

        GL.BindVertexArray(0);
    }

    public void Dispose()
    {
        if (_texture != 0)
        {
            GL.DeleteTexture(
                _texture
            );

            _texture = 0;
        }

        if (_vbo != 0)
        {
            GL.DeleteBuffer(
                _vbo
            );

            _vbo = 0;
        }

        if (_vao != 0)
        {
            GL.DeleteVertexArray(
                _vao
            );

            _vao = 0;
        }

        if (_shaderProgram != 0)
        {
            GL.DeleteProgram(
                _shaderProgram
            );

            _shaderProgram = 0;
        }
    }
}