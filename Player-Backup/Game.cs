using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;
using OpenTK.Windowing.Desktop;
using OpenTK.Windowing.GraphicsLibraryFramework;

namespace Nova.Player;

public sealed class Game : GameWindow
{
    private readonly WorldData _world;

    private int _vertexArrayObject;
    private int _vertexBufferObject;
    private int _shaderProgram;

    private int _modelLocation;
    private int _viewLocation;
    private int _projectionLocation;
    private int _colorLocation;

    private Vector3 _cameraPosition = new(25f, 20f, 25f);

    private readonly float[] _cubeVertices =
    {
        // Front
        -0.5f, -0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,

         0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,

        // Back
         0.5f, -0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,
        -0.5f,  0.5f, -0.5f,

        -0.5f,  0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,

        // Left
        -0.5f, -0.5f, -0.5f,
        -0.5f, -0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,

        -0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,

        // Right
         0.5f, -0.5f,  0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,

         0.5f,  0.5f, -0.5f,
         0.5f,  0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,

        // Top
        -0.5f,  0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,
         0.5f,  0.5f, -0.5f,

         0.5f,  0.5f, -0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f,  0.5f,  0.5f,

        // Bottom
        -0.5f, -0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f, -0.5f,  0.5f,

         0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f, -0.5f
    };

    private const string VertexShaderSource = """
        #version 330 core

        layout(location = 0) in vec3 aPosition;

        uniform mat4 model;
        uniform mat4 view;
        uniform mat4 projection;

        void main()
        {
            gl_Position =
                projection *
                view *
                model *
                vec4(aPosition, 1.0);
        }
        """;

    private const string FragmentShaderSource = """
        #version 330 core

        uniform vec3 partColor;

        out vec4 outputColor;

        void main()
        {
            outputColor = vec4(partColor, 1.0);
        }
        """;

    public Game(
        GameWindowSettings gameWindowSettings,
        NativeWindowSettings nativeWindowSettings,
        WorldData world)
        : base(gameWindowSettings, nativeWindowSettings)
    {
        _world = world;
    }

    protected override void OnLoad()
    {
        base.OnLoad();

        GL.ClearColor(0.42f, 0.67f, 0.92f, 1f);
        GL.Enable(EnableCap.DepthTest);

        CreateCubeMesh();
        CreateShaderProgram();

        Console.WriteLine(
            $"Rendering {_world.Parts.Count} parts from {_world.Name}."
        );
    }

    private void CreateCubeMesh()
    {
        _vertexArrayObject = GL.GenVertexArray();
        GL.BindVertexArray(_vertexArrayObject);

        _vertexBufferObject = GL.GenBuffer();
        GL.BindBuffer(
            BufferTarget.ArrayBuffer,
            _vertexBufferObject
        );

        GL.BufferData(
            BufferTarget.ArrayBuffer,
            _cubeVertices.Length * sizeof(float),
            _cubeVertices,
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
    }

    private void CreateShaderProgram()
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

        GL.AttachShader(_shaderProgram, vertexShader);
        GL.AttachShader(_shaderProgram, fragmentShader);
        GL.LinkProgram(_shaderProgram);

        GL.GetProgram(
            _shaderProgram,
            GetProgramParameterName.LinkStatus,
            out int success
        );

        if (success == 0)
        {
            string error = GL.GetProgramInfoLog(_shaderProgram);

            throw new InvalidOperationException(
                $"Shader linking failed: {error}"
            );
        }

        GL.DetachShader(_shaderProgram, vertexShader);
        GL.DetachShader(_shaderProgram, fragmentShader);

        GL.DeleteShader(vertexShader);
        GL.DeleteShader(fragmentShader);

        _modelLocation = GL.GetUniformLocation(
            _shaderProgram,
            "model"
        );

        _viewLocation = GL.GetUniformLocation(
            _shaderProgram,
            "view"
        );

        _projectionLocation = GL.GetUniformLocation(
            _shaderProgram,
            "projection"
        );

        _colorLocation = GL.GetUniformLocation(
            _shaderProgram,
            "partColor"
        );
    }

    private static int CompileShader(
        ShaderType shaderType,
        string source)
    {
        int shader = GL.CreateShader(shaderType);

        GL.ShaderSource(shader, source);
        GL.CompileShader(shader);

        GL.GetShader(
            shader,
            ShaderParameter.CompileStatus,
            out int success
        );

        if (success == 0)
        {
            string error = GL.GetShaderInfoLog(shader);

            GL.DeleteShader(shader);

            throw new InvalidOperationException(
                $"Shader compilation failed: {error}"
            );
        }

        return shader;
    }

    protected override void OnRenderFrame(FrameEventArgs args)
    {
        base.OnRenderFrame(args);

        GL.Clear(
            ClearBufferMask.ColorBufferBit |
            ClearBufferMask.DepthBufferBit
        );

        GL.UseProgram(_shaderProgram);
        GL.BindVertexArray(_vertexArrayObject);

        Matrix4 view = Matrix4.LookAt(
            _cameraPosition,
            Vector3.Zero,
            Vector3.UnitY
        );

        float aspectRatio = ClientSize.Y == 0
            ? 1f
            : ClientSize.X / (float)ClientSize.Y;

        Matrix4 projection =
            Matrix4.CreatePerspectiveFieldOfView(
                MathHelper.DegreesToRadians(60f),
                aspectRatio,
                0.1f,
                1000f
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

        foreach (PartData part in _world.Parts)
        {
            DrawPart(part);
        }

        SwapBuffers();
    }

    private void DrawPart(PartData part)
    {
        Vector3 position = ReadVector(
            part.Position,
            Vector3.Zero
        );

        Vector3 size = ReadVector(
            part.Size,
            Vector3.One
        );

        Vector3 color = ReadVector(
            part.Color,
            new Vector3(0.6f)
        );

        Matrix4 model =
            Matrix4.CreateScale(size) *
            Matrix4.CreateTranslation(position);

        GL.UniformMatrix4(
            _modelLocation,
            false,
            ref model
        );

        GL.Uniform3(
            _colorLocation,
            color
        );

        GL.DrawArrays(
            PrimitiveType.Triangles,
            0,
            36
        );
    }

    private static Vector3 ReadVector(
        float[]? values,
        Vector3 fallback)
    {
        if (values is null || values.Length < 3)
        {
            return fallback;
        }

        return new Vector3(
            values[0],
            values[1],
            values[2]
        );
    }

    protected override void OnUpdateFrame(FrameEventArgs args)
    {
        base.OnUpdateFrame(args);

        if (KeyboardState.IsKeyDown(Keys.Escape))
        {
            Close();
        }

        float speed = 12f * (float)args.Time;

        if (KeyboardState.IsKeyDown(Keys.W))
        {
            _cameraPosition.Z -= speed;
        }

        if (KeyboardState.IsKeyDown(Keys.S))
        {
            _cameraPosition.Z += speed;
        }

        if (KeyboardState.IsKeyDown(Keys.A))
        {
            _cameraPosition.X -= speed;
        }

        if (KeyboardState.IsKeyDown(Keys.D))
        {
            _cameraPosition.X += speed;
        }

        if (KeyboardState.IsKeyDown(Keys.Space))
        {
            _cameraPosition.Y += speed;
        }

        if (
            KeyboardState.IsKeyDown(Keys.LeftShift) ||
            KeyboardState.IsKeyDown(Keys.RightShift)
        )
        {
            _cameraPosition.Y -= speed;
        }
    }

    protected override void OnResize(ResizeEventArgs args)
    {
        base.OnResize(args);

        GL.Viewport(
            0,
            0,
            args.Width,
            args.Height
        );
    }

    protected override void OnUnload()
    {
        base.OnUnload();

        GL.DeleteBuffer(_vertexBufferObject);
        GL.DeleteVertexArray(_vertexArrayObject);
        GL.DeleteProgram(_shaderProgram);
    }
}