using OpenTK.Mathematics;


namespace Nova.Player;


public sealed class RemotePlayer :
    IDisposable
{


    public string PlayerId
    {
        get;
    }


    public string Username
    {
        get;
    }


    public AvatarConfig Avatar
    {
        get;
    }


    public Vector3 Position
    {
        get;
        set;
    }


    public Vector3 TargetPosition
    {
        get;
        set;
    }


    public float FacingYaw
    {
        get;
        set;
    }


    public float TargetFacingYaw
    {
        get;
        set;
    }


    public bool IsMoving
    {
        get;
        set;
    }


    public bool IsGrounded
    {
        get;
        set;
    } =
        true;


    public float VerticalVelocity
    {
        get;
        set;
    }


    private readonly GuestRenderer
        _guestRenderer;


    private readonly HatRenderer?
        _hatRenderer;


    /* =====================================================
       CONSTRUCTOR
    ====================================================== */

    public RemotePlayer(
        NetworkPlayerData data,
        GuestModel guestModel)
    {


        PlayerId =
            data.PlayerId;


        Username =
            data.Username;


        Avatar =
            data.Avatar
                .ToAvatarConfig(
                    data.PlaceId
                );


        Position =
            new Vector3(
                data.X,
                data.Y,
                data.Z
            );


        TargetPosition =
            Position;


        FacingYaw =
            data.Yaw;


        TargetFacingYaw =
            data.Yaw;


        IsMoving =
            data.IsMoving;


        IsGrounded =
            data.IsGrounded;


        VerticalVelocity =
            data.VerticalVelocity;


        _guestRenderer =
            new GuestRenderer(
                guestModel,
                Avatar
            );


        /*
         * Give remote players
         * their own hats too.
         */

        if (
            !string.IsNullOrWhiteSpace(
                Avatar.Hat
            )
            &&
            !Avatar.Hat.Equals(
                "none",
                StringComparison
                    .OrdinalIgnoreCase
            )
        )
        {

            try
            {

                _hatRenderer =
                    new HatRenderer(
                        Avatar.Hat
                    );

            }
            catch (
                Exception exception
            )
            {

                Console.WriteLine(
                    $"Remote hat failed for " +
                    $"{Username}: " +
                    $"{exception.Message}"
                );

            }

        }

    }


    /* =====================================================
       NETWORK UPDATE
    ====================================================== */

    public void ApplyMovement(
        MultiplayerEvent multiplayerEvent)
    {


        TargetPosition =
            new Vector3(
                multiplayerEvent.X,
                multiplayerEvent.Y,
                multiplayerEvent.Z
            );


        TargetFacingYaw =
            multiplayerEvent.Yaw;


        IsMoving =
            multiplayerEvent.IsMoving;


        IsGrounded =
            multiplayerEvent.IsGrounded;


        VerticalVelocity =
            multiplayerEvent
                .VerticalVelocity;

    }


    /* =====================================================
       SMOOTHING
    ====================================================== */

    public void Update(
        float deltaTime)
    {


        float positionAmount =
            Math.Clamp(
                deltaTime * 14f,
                0f,
                1f
            );


        Position =
            Vector3.Lerp(
                Position,
                TargetPosition,
                positionAmount
            );


        float difference =
            WrapAngle(
                TargetFacingYaw -
                FacingYaw
            );


        FacingYaw +=
            difference *
            Math.Clamp(
                deltaTime * 14f,
                0f,
                1f
            );

    }


    /* =====================================================
       DRAW
    ====================================================== */

    public void Draw(
        Matrix4 view,
        Matrix4 projection)
    {


        _guestRenderer.Draw(
            Position,
            FacingYaw,
            IsMoving,
            IsGrounded,
            VerticalVelocity,
            view,
            projection
        );


        _hatRenderer?.Draw(
            Position,
            FacingYaw,
            view,
            projection
        );

    }


    private static float WrapAngle(
        float angle)
    {


        while (
            angle >
            MathHelper.Pi
        )
        {

            angle -=
                MathHelper.TwoPi;

        }


        while (
            angle <
            -MathHelper.Pi
        )
        {

            angle +=
                MathHelper.TwoPi;

        }


        return angle;

    }


    public void Dispose()
    {


        _hatRenderer?.Dispose();


        _guestRenderer.Dispose();


        GC.SuppressFinalize(
            this
        );

    }

}