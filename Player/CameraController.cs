using OpenTK.Mathematics;
using OpenTK.Windowing.GraphicsLibraryFramework;

namespace Nova.Player;

public sealed class CameraController
{
    private const float MouseSensitivity =
        0.0042f;


    private const float MinimumPitch =
        -1.30f;


    private const float MaximumPitch =
        1.30f;


    private const float MinimumDistance =
        0.15f;


    private const float MaximumDistance =
        24f;


    private const float ZoomSpeed =
        1.5f;


    private const float FollowSpeed =
        18f;


    private const float DistanceSpeed =
        14f;


    private const float FirstPersonThreshold =
        0.75f;


    private float _yaw =
        MathHelper.DegreesToRadians(
            180f
        );


    private float _pitch =
        MathHelper.DegreesToRadians(
            15f
        );


    private float _distance =
        10f;


    private float _targetDistance =
        10f;


    private Vector3 _targetPosition =
        Vector3.Zero;


    private Vector3 _desiredPosition =
        Vector3.Zero;


    private bool _initialized;


    public Vector3 Position
    {
        get;
        private set;
    }


    public float Yaw =>
        _yaw;


    public float Pitch =>
        _pitch;


    public float Distance =>
        _distance;


    public bool IsFirstPerson =>
        _distance <=
        FirstPersonThreshold;


    public Vector3 FlatForward
    {
        get
        {
            Vector3 forward =
                new Vector3(
                    -MathF.Sin(
                        _yaw
                    ),

                    0f,

                    -MathF.Cos(
                        _yaw
                    )
                );


            if (
                forward.LengthSquared <
                0.0001f
            )
            {
                return
                    -Vector3.UnitZ;
            }


            return
                Vector3.Normalize(
                    forward
                );
        }
    }


    public Vector3 FlatRight
    {
        get
        {
            Vector3 right =
                Vector3.Cross(
                    FlatForward,
                    Vector3.UnitY
                );


            if (
                right.LengthSquared <
                0.0001f
            )
            {
                return
                    Vector3.UnitX;
            }


            return
                Vector3.Normalize(
                    right
                );
        }
    }


    public Vector3 LookDirection
    {
        get
        {
            float horizontal =
                MathF.Cos(
                    _pitch
                );


            Vector3 direction =
                new Vector3(
                    -MathF.Sin(
                        _yaw
                    ) *
                    horizontal,

                    MathF.Sin(
                        _pitch
                    ),

                    -MathF.Cos(
                        _yaw
                    ) *
                    horizontal
                );


            return
                Vector3.Normalize(
                    direction
                );
        }
    }


    public void Update(
        MouseState mouse,
        float deltaTime,
        Vector3 targetPosition,
        bool cameraLocked)
    {
        if (
            !_initialized
        )
        {
            _targetPosition =
                targetPosition;


            CalculateDesiredPosition();


            Position =
                _desiredPosition;


            _initialized =
                true;
        }


        bool shouldRotate =
            mouse.IsButtonDown(
                MouseButton.Right
            )
            ||
            cameraLocked
            ||
            IsFirstPerson;


        if (
            shouldRotate
        )
        {
            /*
             * LEFT / RIGHT
             */

            _yaw -=
                mouse.Delta.X *
                MouseSensitivity;


            /*
             * UP / DOWN
             *
             * This is intentionally +
             * because your previous
             * controls were inverted.
             */

            _pitch +=
                mouse.Delta.Y *
                MouseSensitivity;


            _pitch =
                Math.Clamp(
                    _pitch,
                    MinimumPitch,
                    MaximumPitch
                );
        }


        /*
         * ZOOM
         */

        if (
            MathF.Abs(
                mouse.ScrollDelta.Y
            )
            >
            0.001f
        )
        {
            _targetDistance -=
                mouse.ScrollDelta.Y *
                ZoomSpeed;


            _targetDistance =
                Math.Clamp(
                    _targetDistance,
                    MinimumDistance,
                    MaximumDistance
                );
        }


        /*
         * SMOOTH ZOOM
         */

        float zoomSmoothing =
            1f -
            MathF.Exp(
                -DistanceSpeed *
                deltaTime
            );


        _distance =
            MathHelper.Lerp(
                _distance,
                _targetDistance,
                zoomSmoothing
            );


        /*
         * SMOOTH TARGET FOLLOW
         */

        float followSmoothing =
            1f -
            MathF.Exp(
                -FollowSpeed *
                deltaTime
            );


        _targetPosition =
            Vector3.Lerp(
                _targetPosition,
                targetPosition,
                followSmoothing
            );


        CalculateDesiredPosition();


        if (
            IsFirstPerson
        )
        {
            Position =
                _targetPosition;
        }
        else
        {
            Position =
                Vector3.Lerp(
                    Position,
                    _desiredPosition,
                    followSmoothing
                );
        }
    }


    private void CalculateDesiredPosition()
    {
        if (
            IsFirstPerson
        )
        {
            _desiredPosition =
                _targetPosition;

            return;
        }


        float horizontalDistance =
            MathF.Cos(
                _pitch
            ) *
            _distance;


        Vector3 orbitOffset =
            new Vector3(
                MathF.Sin(
                    _yaw
                ) *
                horizontalDistance,

                MathF.Sin(
                    _pitch
                ) *
                _distance,

                MathF.Cos(
                    _yaw
                ) *
                horizontalDistance
            );


        _desiredPosition =
            _targetPosition +
            orbitOffset;
    }


    public Matrix4 GetViewMatrix()
    {
        if (
            IsFirstPerson
        )
        {
            return
                Matrix4.LookAt(
                    Position,
                    Position +
                    LookDirection,
                    Vector3.UnitY
                );
        }


        return
            Matrix4.LookAt(
                Position,
                _targetPosition,
                Vector3.UnitY
            );
    }
}