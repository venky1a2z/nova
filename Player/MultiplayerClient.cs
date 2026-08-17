using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;


namespace Nova.Player;


public sealed class MultiplayerClient :
    IDisposable
{


    private readonly ClientWebSocket
        _socket =
            new();


    private readonly CancellationTokenSource
        _cancellation =
            new();


    private readonly SemaphoreSlim
        _sendLock =
            new(
                1,
                1
            );


    private readonly ConcurrentQueue<
        MultiplayerEvent
    >
        _events =
            new();


    private Task?
        _receiveTask;


    private bool
        _disposed;


    public bool IsConnected =>
        _socket.State ==
        WebSocketState.Open;



    /* =====================================================
       CONNECT
    ====================================================== */

    public async Task ConnectAsync(
        string serverUrl)
    {


        if (
            _disposed
        )
        {

            return;

        }


        if (
            IsConnected
        )
        {

            return;

        }


        Console.WriteLine(
            $"Connecting to Nova multiplayer: {serverUrl}"
        );


        try
        {

            await _socket
                .ConnectAsync(
                    new Uri(
                        serverUrl
                    ),
                    _cancellation.Token
                );


            Console.WriteLine(
                "Connected to Nova multiplayer!"
            );


            _receiveTask =
                Task.Run(
                    ReceiveLoop
                );

        }
        catch (
            Exception exception
        )
        {

            Console.WriteLine(
                "Nova multiplayer connection failed:"
            );


            Console.WriteLine(
                exception.Message
            );

        }

    }



    /* =====================================================
       JOIN
    ====================================================== */

    public async Task JoinAsync(
        string playerId,
        string username,
        int placeId,
        AvatarConfig avatar,
        float x,
        float y,
        float z,
        float yaw)
    {


        var packet =
            new ClientMultiplayerPacket
            {

                Type =
                    "join",

                PlayerId =
                    playerId,

                Username =
                    username,

                PlaceId =
                    placeId,

                X =
                    x,

                Y =
                    y,

                Z =
                    z,

                Yaw =
                    yaw,

                Avatar =
                    NetworkAvatar
                        .FromAvatarConfig(
                            avatar
                        )

            };


        await SendAsync(
            packet
        );

    }



    /* =====================================================
       MOVEMENT
    ====================================================== */

    public async Task SendMovementAsync(
        float x,
        float y,
        float z,
        float yaw,
        bool isMoving,
        bool isGrounded,
        float verticalVelocity)
    {


        if (
            !IsConnected
        )
        {

            return;

        }


        var packet =
            new ClientMultiplayerPacket
            {

                Type =
                    "move",

                X =
                    x,

                Y =
                    y,

                Z =
                    z,

                Yaw =
                    yaw,

                IsMoving =
                    isMoving,

                IsGrounded =
                    isGrounded,

                VerticalVelocity =
                    verticalVelocity

            };


        await SendAsync(
            packet
        );

    }



    /* =====================================================
       GAME THREAD EVENT QUEUE
    ====================================================== */

    public bool TryDequeueEvent(
        out MultiplayerEvent?
            multiplayerEvent)
    {


        return _events
            .TryDequeue(
                out multiplayerEvent
            );

    }



    /* =====================================================
       SEND PACKET
    ====================================================== */

    private async Task SendAsync(
        ClientMultiplayerPacket packet)
    {


        if (
            !IsConnected
        )
        {

            return;

        }


        string json =
            JsonSerializer.Serialize(
                packet,
                MultiplayerJson.Options
            );


        byte[] bytes =
            Encoding.UTF8
                .GetBytes(
                    json
                );


        try
        {

            await _sendLock
                .WaitAsync(
                    _cancellation.Token
                );


            try
            {

                if (
                    !IsConnected
                )
                {

                    return;

                }


                await _socket
                    .SendAsync(
                        new ArraySegment<byte>(
                            bytes
                        ),

                        WebSocketMessageType.Text,

                        true,

                        _cancellation.Token
                    );

            }
            finally
            {

                _sendLock.Release();

            }

        }
        catch (
            OperationCanceledException
        )
        {
        }
        catch (
            Exception exception
        )
        {

            Console.WriteLine(
                $"Nova multiplayer send failed: {exception.Message}"
            );

        }

    }



    /* =====================================================
       RECEIVE LOOP
    ====================================================== */

    private async Task ReceiveLoop()
    {


        try
        {

            while (
                !_cancellation
                    .IsCancellationRequested
                &&
                _socket.State ==
                    WebSocketState.Open
            )
            {


                string? json =
                    await ReceiveTextMessage();


                if (
                    json is null
                )
                {

                    break;

                }


                ServerMultiplayerPacket?
                    packet;


                try
                {

                    packet =
                        JsonSerializer
                            .Deserialize<
                                ServerMultiplayerPacket
                            >(
                                json,
                                MultiplayerJson.Options
                            );

                }
                catch (
                    JsonException exception
                )
                {

                    Console.WriteLine(
                        $"Bad multiplayer packet: {exception.Message}"
                    );


                    continue;

                }


                if (
                    packet is null
                )
                {

                    continue;

                }


                HandleServerPacket(
                    packet
                );

            }

        }
        catch (
            OperationCanceledException
        )
        {
        }
        catch (
            Exception exception
        )
        {

            Console.WriteLine(
                $"Nova multiplayer receive error: {exception.Message}"
            );

        }
        finally
        {

            _events.Enqueue(
                new MultiplayerEvent
                {
                    Type =
                        "disconnected"
                }
            );

        }

    }



    /* =====================================================
       SERVER PACKET HANDLING
    ====================================================== */

    private void HandleServerPacket(
        ServerMultiplayerPacket packet)
    {


        switch (
            packet.Type
                .ToLowerInvariant()
        )
        {


            case "snapshot":

                if (
                    packet.Players
                    is not null
                )
                {

                    foreach (
                        NetworkPlayerData player
                        in packet.Players
                    )
                    {

                        _events.Enqueue(
                            new MultiplayerEvent
                            {

                                Type =
                                    "player_joined",

                                Player =
                                    player

                            }
                        );

                    }

                }

                break;



            case "player_joined":

                if (
                    packet.Player
                    is not null
                )
                {

                    _events.Enqueue(
                        new MultiplayerEvent
                        {

                            Type =
                                "player_joined",

                            Player =
                                packet.Player

                        }
                    );

                }

                break;



            case "player_moved":

                _events.Enqueue(
                    new MultiplayerEvent
                    {

                        Type =
                            "player_moved",

                        PlayerId =
                            packet.PlayerId,

                        X =
                            packet.X,

                        Y =
                            packet.Y,

                        Z =
                            packet.Z,

                        Yaw =
                            packet.Yaw,

                        IsMoving =
                            packet.IsMoving,

                        IsGrounded =
                            packet.IsGrounded,

                        VerticalVelocity =
                            packet.VerticalVelocity

                    }
                );

                break;



            case "player_left":

                _events.Enqueue(
                    new MultiplayerEvent
                    {

                        Type =
                            "player_left",

                        PlayerId =
                            packet.PlayerId

                    }
                );

                break;

        }

    }



    /* =====================================================
       RECEIVE COMPLETE MESSAGE
    ====================================================== */

    private async Task<string?>
        ReceiveTextMessage()
    {


        byte[] buffer =
            new byte[
                8192
            ];


        using var stream =
            new MemoryStream();


        while (
            true
        )
        {


            WebSocketReceiveResult result =
                await _socket
                    .ReceiveAsync(
                        new ArraySegment<byte>(
                            buffer
                        ),
                        _cancellation.Token
                    );


            if (
                result.MessageType ==
                WebSocketMessageType.Close
            )
            {

                return null;

            }


            if (
                result.MessageType !=
                WebSocketMessageType.Text
            )
            {

                continue;

            }


            stream.Write(
                buffer,
                0,
                result.Count
            );


            if (
                result.EndOfMessage
            )
            {

                break;

            }

        }


        return Encoding.UTF8
            .GetString(
                stream.ToArray()
            );

    }



    /* =====================================================
       DISCONNECT
    ====================================================== */

    public async Task DisconnectAsync()
    {


        if (
            _socket.State ==
            WebSocketState.Open
        )
        {

            try
            {

                await _socket
                    .CloseAsync(
                        WebSocketCloseStatus
                            .NormalClosure,
                        "Leaving Nova.",
                        CancellationToken.None
                    );

            }
            catch
            {
            }

        }


        _cancellation.Cancel();

    }



    public void Dispose()
    {


        if (
            _disposed
        )
        {

            return;

        }


        _disposed =
            true;


        _cancellation.Cancel();


        _socket.Dispose();

        _sendLock.Dispose();

        _cancellation.Dispose();


        GC.SuppressFinalize(
            this
        );

    }

}



/* =========================================================
   MULTIPLAYER EVENT
========================================================= */

public sealed class MultiplayerEvent
{


    public string Type
    {
        get;
        set;
    } =
        "";


    public string?
        PlayerId
    {
        get;
        set;
    }


    public NetworkPlayerData?
        Player
    {
        get;
        set;
    }


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
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
    }


    public float VerticalVelocity
    {
        get;
        set;
    }

}



/* =========================================================
   NETWORK PLAYER
========================================================= */

public sealed class NetworkPlayerData
{


    public string PlayerId
    {
        get;
        set;
    } =
        "";


    public string Username
    {
        get;
        set;
    } =
        "NovaPlayer";


    public int PlaceId
    {
        get;
        set;
    } =
        1;


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
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


    public NetworkAvatar Avatar
    {
        get;
        set;
    } =
        new();

}



/* =========================================================
   NETWORK AVATAR
========================================================= */

public sealed class NetworkAvatar
{


    public string Skin
    {
        get;
        set;
    } =
        "yellow";


    public string Face
    {
        get;
        set;
    } =
        "happy";


    public string Shirt
    {
        get;
        set;
    } =
        "cafe";


    public string Pants
    {
        get;
        set;
    } =
        "black";


    public string Hat
    {
        get;
        set;
    } =
        "none";


    public static NetworkAvatar FromAvatarConfig(
        AvatarConfig avatar)
    {


        return new NetworkAvatar
        {

            Skin =
                avatar.Skin,

            Face =
                avatar.Face,

            Shirt =
                avatar.Shirt,

            Pants =
                avatar.Pants,

            Hat =
                avatar.Hat

        };

    }


    public AvatarConfig ToAvatarConfig(
        int placeId)
    {


        return new AvatarConfig
        {

            PlaceId =
                placeId,

            Skin =
                Skin,

            Face =
                Face,

            Shirt =
                Shirt,

            Pants =
                Pants,

            Hat =
                Hat

        };

    }

}



/* =========================================================
   CLIENT PACKET
========================================================= */

internal sealed class ClientMultiplayerPacket
{


    public string Type
    {
        get;
        set;
    } =
        "";


    public string PlayerId
    {
        get;
        set;
    } =
        "";


    public string Username
    {
        get;
        set;
    } =
        "";


    public int PlaceId
    {
        get;
        set;
    }


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
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
    }


    public float VerticalVelocity
    {
        get;
        set;
    }


    public NetworkAvatar?
        Avatar
    {
        get;
        set;
    }

}



/* =========================================================
   SERVER PACKET
========================================================= */

internal sealed class ServerMultiplayerPacket
{


    public string Type
    {
        get;
        set;
    } =
        "";


    public string?
        PlayerId
    {
        get;
        set;
    }


    public NetworkPlayerData?
        Player
    {
        get;
        set;
    }


    public List<NetworkPlayerData>?
        Players
    {
        get;
        set;
    }


    public float X
    {
        get;
        set;
    }


    public float Y
    {
        get;
        set;
    }


    public float Z
    {
        get;
        set;
    }


    public float Yaw
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
    }


    public float VerticalVelocity
    {
        get;
        set;
    }

}



/* =========================================================
   JSON SETTINGS
========================================================= */

internal static class MultiplayerJson
{


    public static readonly
        JsonSerializerOptions
        Options =
            new()
            {

                PropertyNamingPolicy =
                    JsonNamingPolicy
                        .CamelCase,

                PropertyNameCaseInsensitive =
                    true,

                DefaultIgnoreCondition =
                    JsonIgnoreCondition
                        .WhenWritingNull

            };

}