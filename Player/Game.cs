using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;
using OpenTK.Windowing.Common.Input;
using OpenTK.Windowing.Desktop;
using OpenTK.Windowing.GraphicsLibraryFramework;
using StbImageSharp;

namespace Nova.Player;

public sealed class Game :
    GameWindow
{
    private readonly WorldData
        _world;


    private readonly AvatarConfig
        _avatar;


    private readonly PlayerController
        _player =
            new();


    private readonly CameraController
        _camera =
            new();


    private GuestModel?
        _guestModel;


    private GuestRenderer?
        _guestRenderer;


    private HatRenderer?
        _hatRenderer;


    private BaseplateRenderer?
        _baseplateRenderer;


    private SkyboxRenderer?
        _skyboxRenderer;


    private MouseCursor?
        _novaCursor;

private MultiplayerClient?
    _multiplayer;


private readonly Dictionary<
    string,
    RemotePlayer
>
    _remotePlayers =
        new();


private float
    _networkSendTimer;


private const float
    NetworkSendInterval =
        0.05f;

    private bool
        _shiftLock;


    private bool
        _shiftWasDown;


    private int
        _vertexArrayObject;


    private int
        _vertexBufferObject;


    private int
        _shaderProgram;


    private int
        _modelLocation;


    private int
        _viewLocation;


    private int
        _projectionLocation;


    private int
        _colorLocation;


    private readonly float[]
        _cubeVertices =
    {
        -0.5f, -0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,

         0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,


         0.5f, -0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,
        -0.5f,  0.5f, -0.5f,

        -0.5f,  0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,


        -0.5f, -0.5f, -0.5f,
        -0.5f, -0.5f,  0.5f,
        -0.5f,  0.5f,  0.5f,

        -0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,


         0.5f, -0.5f,  0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f,  0.5f, -0.5f,

         0.5f,  0.5f, -0.5f,
         0.5f,  0.5f,  0.5f,
         0.5f, -0.5f,  0.5f,


        -0.5f,  0.5f,  0.5f,
         0.5f,  0.5f,  0.5f,
         0.5f,  0.5f, -0.5f,

         0.5f,  0.5f, -0.5f,
        -0.5f,  0.5f, -0.5f,
        -0.5f,  0.5f,  0.5f,


        -0.5f, -0.5f, -0.5f,
         0.5f, -0.5f, -0.5f,
         0.5f, -0.5f,  0.5f,

         0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f, -0.5f
    };


    private const string VertexShaderSource =
        """
        #version 330 core

        layout(location = 0)
        in vec3 aPosition;

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
        }
        """;


    private const string FragmentShaderSource =
        """
        #version 330 core

        uniform vec3 partColor;

        out vec4 outputColor;

        void main()
        {
            outputColor =
                vec4(
                    partColor,
                    1.0
                );
        }
        """;


    public Game(
        GameWindowSettings gameWindowSettings,
        NativeWindowSettings nativeWindowSettings,
        WorldData world,
        AvatarConfig avatar)

        : base(
            gameWindowSettings,
            nativeWindowSettings
        )
    {
        _world =
            world;


        _avatar =
            avatar;
    }


    protected override void OnLoad()
    {
        base.OnLoad();


        GL.ClearColor(
            0.42f,
            0.67f,
            0.92f,
            1f
        );


        GL.Enable(
            EnableCap.DepthTest
        );


        GL.Enable(
            EnableCap.Blend
        );


        GL.BlendFunc(
            BlendingFactor.SrcAlpha,
            BlendingFactor.OneMinusSrcAlpha
        );


        /*
         * Raw mouse input improves
         * camera movement when grabbed.
         */

        if (
            SupportsRawMouseInput
        )
        {
            RawMouseInput =
                true;
        }


        CreateCubeMesh();

        CreateShaderProgram();


        LoadGuest();

        LoadBaseplate();

        LoadSkybox();

        LoadNovaCursor();

        StartMultiplayer();


        Console.WriteLine(
            $"Rendering {_world.Parts.Count} " +
            $"parts from {_world.Name}."
        );
    }


    private void LoadNovaCursor()
    {
        try
        {
            string path =
                Path.Combine(
                    AppContext.BaseDirectory,
                    "Assets",
                    "cursor",
                    "nova-cursor.png"
                );


            if (
                !File.Exists(
                    path
                )
            )
            {
                Console.WriteLine(
                    $"Nova cursor not found: {path}"
                );


                Cursor =
                    MouseCursor.Default;


                return;
            }


            byte[] bytes =
                File.ReadAllBytes(
                    path
                );


            ImageResult image =
                ImageResult.FromMemory(
                    bytes,
                    ColorComponents.RedGreenBlueAlpha
                );


            _novaCursor =
                new MouseCursor(
                    0,
                    0,
                    image.Width,
                    image.Height,
                    image.Data
                );


            Cursor =
                _novaCursor;


            Console.WriteLine(
                "Nova cursor loaded."
            );
        }
        catch (
            Exception exception
        )
        {
            Console.WriteLine(
                "Nova cursor failed:"
            );


            Console.WriteLine(
                exception.Message
            );


            Cursor =
                MouseCursor.Default;
        }
    }

private void StartMultiplayer()
{


    _multiplayer =
        new MultiplayerClient();


    _ =
        ConnectMultiplayerAsync();

}

private void ProcessMultiplayerEvents()
{


    if (
        _multiplayer
        is null
    )
    {

        return;

    }


    while (
        _multiplayer
            .TryDequeueEvent(
                out MultiplayerEvent?
                    multiplayerEvent
            )
    )
    {


        if (
            multiplayerEvent
            is null
        )
        {

            continue;

        }


        switch (
            multiplayerEvent.Type
                .ToLowerInvariant()
        )
        {


            case "player_joined":

                AddRemotePlayer(
                    multiplayerEvent
                );

                break;


            case "player_moved":

                MoveRemotePlayer(
                    multiplayerEvent
                );

                break;


            case "player_left":

                RemoveRemotePlayer(
                    multiplayerEvent.PlayerId
                );

                break;


            case "disconnected":

                Console.WriteLine(
                    "Disconnected from Nova multiplayer."
                );

                break;

        }

    }

}


private void AddRemotePlayer(
    MultiplayerEvent multiplayerEvent)
{


    NetworkPlayerData?
        data =
            multiplayerEvent.Player;


    if (
        data
        is null
    )
    {

        return;

    }


    if (
        string.IsNullOrWhiteSpace(
            data.PlayerId
        )
    )
    {

        return;

    }


    /*
     * If this player already exists,
     * don't create duplicate GL resources.
     */

    if (
        _remotePlayers.ContainsKey(
            data.PlayerId
        )
    )
    {

        return;

    }


    if (
        _guestModel
        is null
    )
    {

        Console.WriteLine(
            "Cannot render remote player: " +
            "Guest model is unavailable."
        );


        return;

    }


    try
    {


        var remotePlayer =
            new RemotePlayer(
                data,
                _guestModel
            );


        _remotePlayers[
            data.PlayerId
        ] =
            remotePlayer;


        Console.WriteLine(
            $"[MULTIPLAYER] " +
            $"{data.Username} appeared."
        );

    }
    catch (
        Exception exception
    )
    {

        Console.WriteLine(
            $"Remote player failed: " +
            $"{exception.Message}"
        );

    }

}


private void MoveRemotePlayer(
    MultiplayerEvent multiplayerEvent)
{


    if (
        string.IsNullOrWhiteSpace(
            multiplayerEvent.PlayerId
        )
    )
    {

        return;

    }


    if (
        !_remotePlayers.TryGetValue(
            multiplayerEvent.PlayerId,
            out RemotePlayer?
                remotePlayer
        )
    )
    {

        return;

    }


    remotePlayer.ApplyMovement(
        multiplayerEvent
    );

}


private void RemoveRemotePlayer(
    string? playerId)
{


    if (
        string.IsNullOrWhiteSpace(
            playerId
        )
    )
    {

        return;

    }


    if (
        !_remotePlayers.Remove(
            playerId,
            out RemotePlayer?
                remotePlayer
        )
    )
    {

        return;

    }


    Console.WriteLine(
        $"[MULTIPLAYER] " +
        $"{remotePlayer.Username} left."
    );


    remotePlayer.Dispose();

}


private void UpdateRemotePlayers(
    float deltaTime)
{


    foreach (
        RemotePlayer remotePlayer
        in _remotePlayers.Values
    )
    {

        remotePlayer.Update(
            deltaTime
        );

    }

}


private void UpdateMultiplayerMovement(
    float deltaTime)
{


    if (
        _multiplayer
        is null
        ||
        !_multiplayer
            .IsConnected
    )
    {

        return;

    }


    _networkSendTimer +=
        deltaTime;


    if (
        _networkSendTimer <
        NetworkSendInterval
    )
    {

        return;

    }


    _networkSendTimer =
        0f;


    _ =
        _multiplayer
            .SendMovementAsync(
                _player.Position.X,
                _player.Position.Y,
                _player.Position.Z,
                _player.FacingYaw,
                _player.IsMoving,
                _player.IsGrounded,
                _player.VerticalVelocity
            );

}

private async Task
    ConnectMultiplayerAsync()
{


    if (
        _multiplayer
        is null
    )
    {

        return;

    }


await _multiplayer
    .ConnectAsync(
        "wss://nova-multiplayer.onrender.com/game"
    );


    if (
        !_multiplayer
            .IsConnected
    )
    {

        Console.WriteLine(
            "Nova multiplayer is offline."
        );


        return;

    }


    Console.WriteLine(
        $"Joining multiplayer as " +
        $"{_avatar.Username}"
    );


    await _multiplayer
        .JoinAsync(
            _avatar.UserId,
            _avatar.Username,
            _avatar.PlaceId,
            _avatar,
            _player.Position.X,
            _player.Position.Y,
            _player.Position.Z,
            _player.FacingYaw
        );

}

    private void LoadGuest()
    {
        try
        {
            _guestModel =
                GuestModel.Load();


            _guestRenderer =
                new GuestRenderer(
                    _guestModel,
                    _avatar
                );


            LoadHat();
        }
        catch (
            Exception exception
        )
        {
            _guestModel =
                null;


            _guestRenderer =
                null;


            _hatRenderer =
                null;


            Console.WriteLine(
                "Guest renderer failed:"
            );


            Console.WriteLine(
                exception
            );
        }
    }


    private void LoadHat()
    {
        try
        {
            if (
                string.IsNullOrWhiteSpace(
                    _avatar.Hat
                )
                ||
                _avatar.Hat.Equals(
                    "none",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                return;
            }


            _hatRenderer =
                new HatRenderer(
                    _avatar.Hat
                );
        }
        catch (
            Exception exception
        )
        {
            _hatRenderer =
                null;


            Console.WriteLine(
                exception
            );
        }
    }


    private void LoadBaseplate()
    {
        try
        {
            _baseplateRenderer =
                new BaseplateRenderer();
        }
        catch (
            Exception exception
        )
        {
            _baseplateRenderer =
                null;


            Console.WriteLine(
                exception
            );
        }
    }


    private void LoadSkybox()
    {
        try
        {
            _skyboxRenderer =
                new SkyboxRenderer();
        }
        catch (
            Exception exception
        )
        {
            _skyboxRenderer =
                null;


            Console.WriteLine(
                exception
            );
        }
    }


    private void CreateCubeMesh()
    {
        _vertexArrayObject =
            GL.GenVertexArray();


        _vertexBufferObject =
            GL.GenBuffer();


        GL.BindVertexArray(
            _vertexArrayObject
        );


        GL.BindBuffer(
            BufferTarget.ArrayBuffer,
            _vertexBufferObject
        );


        GL.BufferData(
            BufferTarget.ArrayBuffer,
            _cubeVertices.Length *
            sizeof(float),
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


        GL.EnableVertexAttribArray(
            0
        );


        GL.BindVertexArray(
            0
        );
    }


    private void CreateShaderProgram()
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
            throw new InvalidOperationException(
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


        _colorLocation =
            GL.GetUniformLocation(
                _shaderProgram,
                "partColor"
            );
    }


    private static int CompileShader(
        ShaderType shaderType,
        string source)
    {
        int shader =
            GL.CreateShader(
                shaderType
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


            throw new InvalidOperationException(
                error
            );
        }


        return shader;
    }


    protected override void OnRenderFrame(
        FrameEventArgs args)
    {
        base.OnRenderFrame(
            args
        );


        GL.Clear(
            ClearBufferMask.ColorBufferBit |
            ClearBufferMask.DepthBufferBit
        );


        Matrix4 view =
            _camera.GetViewMatrix();


        float aspectRatio =
            ClientSize.Y == 0
                ?
                1f
                :
                ClientSize.X /
                (float)
                ClientSize.Y;


        Matrix4 projection =
            Matrix4.CreatePerspectiveFieldOfView(
                MathHelper.DegreesToRadians(
                    60f
                ),

                aspectRatio,

                0.1f,

                1000f
            );


        /*
         * SKY
         */

        _skyboxRenderer?.Draw(
            view,
            projection
        );


        /*
         * BASEPLATE
         */

        _baseplateRenderer?.Draw(
            view,
            projection
        );


        /*
         * WORLD
         */

        PrepareWorldShader(
            view,
            projection
        );


        foreach (
            PartData part
            in _world.Parts
        )
        {
            if (
                part.Name.Equals(
                    "Baseplate",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                continue;
            }


            DrawPart(
                part
            );
        }


        /*
         * THIRD PERSON CHARACTER
         *
         * Hide body + hat in first person
         * so we don't look through the head.
         */

        if (
            !_camera.IsFirstPerson
        )
        {
            DrawCharacter(
                view,
                projection
            );
        }

DrawRemotePlayers(
    view,
    projection
);



        SwapBuffers();
    }

private void DrawRemotePlayers(
    Matrix4 view,
    Matrix4 projection)
{


    foreach (
        RemotePlayer remotePlayer
        in _remotePlayers.Values
    )
    {

        remotePlayer.Draw(
            view,
            projection
        );

    }

}

    private void PrepareWorldShader(
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
    }


    private void DrawPart(
        PartData part)
    {
        Vector3 position =
            ReadVector(
                part.Position,
                Vector3.Zero
            );


        Vector3 size =
            ReadVector(
                part.Size,
                Vector3.One
            );


        Vector3 color =
            ReadVector(
                part.Color,
                new Vector3(
                    0.6f
                )
            );


        Matrix4 model =
            Matrix4.CreateScale(
                size
            ) *
            Matrix4.CreateTranslation(
                position
            );


        GL.UseProgram(
            _shaderProgram
        );


        GL.UniformMatrix4(
            _modelLocation,
            false,
            ref model
        );


        GL.Uniform3(
            _colorLocation,
            color
        );


        GL.BindVertexArray(
            _vertexArrayObject
        );


        GL.DrawArrays(
            PrimitiveType.Triangles,
            0,
            36
        );


        GL.BindVertexArray(
            0
        );
    }


    private void DrawCharacter(
        Matrix4 view,
        Matrix4 projection)
    {
        if (
            _guestRenderer is not null
            &&
            _guestRenderer.IsLoaded
        )
        {
            _guestRenderer.Draw(
                _player.Position,
                _player.FacingYaw,
                _player.IsMoving,
                _player.IsGrounded,
                _player.VerticalVelocity,
                view,
                projection
            );


            _hatRenderer?.Draw(
                _player.Position,
                _player.FacingYaw,
                view,
                projection
            );


            return;
        }


        Matrix4 model =
            Matrix4.CreateScale(
                _player.Size
            ) *
            Matrix4.CreateTranslation(
                _player.Position
            );


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


        GL.Uniform3(
            _colorLocation,
            _player.Color
        );


        GL.BindVertexArray(
            _vertexArrayObject
        );


        GL.DrawArrays(
            PrimitiveType.Triangles,
            0,
            36
        );


        GL.BindVertexArray(
            0
        );
    }


    protected override void OnUpdateFrame(
        FrameEventArgs args)
    {
        base.OnUpdateFrame(
            args
        );


        if (
            KeyboardState.IsKeyDown(
                Keys.Escape
            )
        )
        {
            CursorState =
                CursorState.Normal;


            Close();

            return;
        }


        float deltaTime =
            Math.Min(
                (float)
                args.Time,
                0.05f
            );

            ProcessMultiplayerEvents();


    UpdateRemotePlayers(
        deltaTime
    );


        /*
         * SHIFT LOCK TOGGLE
         */

        bool shiftDown =
            KeyboardState.IsKeyDown(
                Keys.LeftShift
            )
            ||
            KeyboardState.IsKeyDown(
                Keys.RightShift
            );


        if (
            shiftDown
            &&
            !_shiftWasDown
        )
        {
            _shiftLock =
                !_shiftLock;


            Console.WriteLine(
                _shiftLock
                    ?
                    "Shift Lock ON"
                    :
                    "Shift Lock OFF"
            );
        }


        _shiftWasDown =
            shiftDown;


        /*
         * PLAYER
         */

        bool playerCameraLocked =
            _shiftLock
            ||
            _camera.IsFirstPerson;


        _player.Update(
            KeyboardState,
            deltaTime,
            _camera.FlatForward,
            _camera.FlatRight,
            playerCameraLocked,
            _camera.Yaw
        );

UpdateMultiplayerMovement(
    deltaTime
);

        /*
         * CAMERA TARGET
         *
         * Higher than before so first
         * person is around head level.
         */

        Vector3 cameraTarget =
            _player.Position +
            new Vector3(
                0f,
                1.45f,
                0f
            );


        bool cameraLocked =
            _shiftLock
            ||
            _camera.IsFirstPerson;


        _camera.Update(
            MouseState,
            deltaTime,
            cameraTarget,
            cameraLocked
        );


        /*
         * After zooming, first person
         * may have changed this frame.
         */

        bool lockCursor =
            _shiftLock
            ||
            _camera.IsFirstPerson
            ||
            MouseState.IsButtonDown(
                MouseButton.Right
            );


        if (
            lockCursor
        )
        {
            CursorState =
                CursorState.Grabbed;
        }
        else
        {
            CursorState =
                CursorState.Normal;


            if (
                _novaCursor is not null
            )
            {
                Cursor =
                    _novaCursor;
            }
            else
            {
                Cursor =
                    MouseCursor.Default;
            }
        }
    }


    private static Vector3 ReadVector(
        float[]? values,
        Vector3 fallback)
    {
        if (
            values is null
            ||
            values.Length < 3
        )
        {
            return fallback;
        }


        return
            new Vector3(
                values[0],
                values[1],
                values[2]
            );
    }


    protected override void OnResize(
        ResizeEventArgs args)
    {
        base.OnResize(
            args
        );


        GL.Viewport(
            0,
            0,
            args.Width,
            args.Height
        );
    }


    protected override void OnUnload()
    {
        CursorState =
            CursorState.Normal;


        Cursor =
            MouseCursor.Default;

foreach (
    RemotePlayer remotePlayer
    in _remotePlayers.Values
)
{

    remotePlayer.Dispose();

}


_remotePlayers.Clear();


if (
    _multiplayer
    is not null
)
{

    try
    {

        _multiplayer
            .DisconnectAsync()
            .GetAwaiter()
            .GetResult();

    }
    catch
    {
    }


    _multiplayer.Dispose();


    _multiplayer =
        null;

}

        _hatRenderer?.Dispose();

        _guestRenderer?.Dispose();

        _baseplateRenderer?.Dispose();

        _skyboxRenderer?.Dispose();


        _hatRenderer =
            null;


        _guestRenderer =
            null;


        _baseplateRenderer =
            null;


        _skyboxRenderer =
            null;


        if (
            _vertexBufferObject != 0
        )
        {
            GL.DeleteBuffer(
                _vertexBufferObject
            );


            _vertexBufferObject =
                0;
        }


        if (
            _vertexArrayObject != 0
        )
        {
            GL.DeleteVertexArray(
                _vertexArrayObject
            );


            _vertexArrayObject =
                0;
        }


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


        base.OnUnload();
    }
}