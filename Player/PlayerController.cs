using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;

namespace Nova.Player;

public sealed class PlayerController
{
    private const float MoveSpeed =
        8f;

    private const float JumpSpeed =
        10f;

    private const float Gravity =
        25f;

    private const float RotationSpeed =
        14f;


    private Vector3 _velocity =
        Vector3.Zero;


    private bool _isGrounded;

    private bool _spaceWasDown;


    private float _facingYaw =
        0f;


    public Vector3 Position
    {
        get;
        private set;
    }
    =
        new Vector3(
            0f,
            3f,
            0f
        );


    public Vector3 Size
    {
        get;
    }
    =
        new Vector3(
            2f,
            4f,
            2f
        );


    public Vector3 Color
    {
        get;
    }
    =
        new Vector3(
            0.95f,
            0.75f,
            0.15f
        );


    public Vector3 FacingDirection
    {
        get;
        private set;
    }
    =
        -Vector3.UnitZ;


    public float FacingYaw =>
        _facingYaw;


    public bool IsGrounded =>
        _isGrounded;


    public bool IsMoving
    {
        get;
        private set;
    }


    public float VerticalVelocity =>
        _velocity.Y;


    public void Update(
        KeyboardState keyboard,
        float deltaTime,
        Vector3 cameraForward,
        Vector3 cameraRight,
        bool cameraLocked,
        float cameraYaw)
    {
        Vector3 movement =
            Vector3.Zero;


        cameraForward.Y =
            0f;

        cameraRight.Y =
            0f;


        if (
            cameraForward.LengthSquared >
            0.0001f
        )
        {
            cameraForward =
                Vector3.Normalize(
                    cameraForward
                );
        }


        if (
            cameraRight.LengthSquared >
            0.0001f
        )
        {
            cameraRight =
                Vector3.Normalize(
                    cameraRight
                );
        }


        if (
            keyboard.IsKeyDown(
                Keys.W
            )
        )
        {
            movement +=
                cameraForward;
        }


        if (
            keyboard.IsKeyDown(
                Keys.S
            )
        )
        {
            movement -=
                cameraForward;
        }


        if (
            keyboard.IsKeyDown(
                Keys.A
            )
        )
        {
            movement -=
                cameraRight;
        }


        if (
            keyboard.IsKeyDown(
                Keys.D
            )
        )
        {
            movement +=
                cameraRight;
        }


        IsMoving =
            movement.LengthSquared >
            0.0001f;


        if (
            IsMoving
        )
        {
            movement =
                Vector3.Normalize(
                    movement
                );


            Position +=
                movement *
                MoveSpeed *
                deltaTime;


            if (
                !cameraLocked
            )
            {
                FacingDirection =
                    movement;


                float targetYaw =
                    MathF.Atan2(
                        -movement.X,
                        -movement.Z
                    );


                _facingYaw =
                    SmoothAngle(
                        _facingYaw,
                        targetYaw,
                        RotationSpeed,
                        deltaTime
                    );
            }
        }


        /*
         * SHIFT LOCK / FIRST PERSON
         *
         * Character faces the direction
         * the camera is looking.
         */

        if (
            cameraLocked
        )
        {
            float targetYaw =
                cameraYaw;


            _facingYaw =
                SmoothAngle(
                    _facingYaw,
                    targetYaw,
                    RotationSpeed,
                    deltaTime
                );


            FacingDirection =
                new Vector3(
                    -MathF.Sin(
                        _facingYaw
                    ),

                    0f,

                    -MathF.Cos(
                        _facingYaw
                    )
                );
        }


        /*
         * JUMP
         */

        bool spaceIsDown =
            keyboard.IsKeyDown(
                Keys.Space
            );


        if (
            spaceIsDown
            &&
            !_spaceWasDown
            &&
            _isGrounded
        )
        {
            _velocity.Y =
                JumpSpeed;


            _isGrounded =
                false;
        }


        _spaceWasDown =
            spaceIsDown;


        /*
         * GRAVITY
         */

        _velocity.Y -=
            Gravity *
            deltaTime;


        Position +=
            _velocity *
            deltaTime;


        /*
         * GROUND
         */

        float groundHeight =
            Size.Y /
            2f;


        if (
            Position.Y <=
            groundHeight
        )
        {
            Position =
                new Vector3(
                    Position.X,
                    groundHeight,
                    Position.Z
                );


            _velocity.Y =
                0f;


            _isGrounded =
                true;
        }
    }


    private static float SmoothAngle(
        float current,
        float target,
        float speed,
        float deltaTime)
    {
        float difference =
            target -
            current;


        while (
            difference >
            MathHelper.Pi
        )
        {
            difference -=
                MathHelper.TwoPi;
        }


        while (
            difference <
            -MathHelper.Pi
        )
        {
            difference +=
                MathHelper.TwoPi;
        }


        float smoothing =
            1f -
            MathF.Exp(
                -speed *
                deltaTime
            );


        return current +
               difference *
               smoothing;
    }
}