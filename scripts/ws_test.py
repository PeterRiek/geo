import asyncio
import websockets
import json

JWT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNzQ3NjUyMjk3LCJleHAiOjE3NDc2NTU4OTd9.zmj2yv_FZV5E7Qb3LnptLcVGtMwbt_9651pvH-Gs609UTxG4p8T15k_WAYmvHuRLGLEYzYlINjLkMk6c6k4hLA"
WS_URL = f"ws://localhost:8080/ws/duel?token={JWT_TOKEN}"

async def test_websocket():
    try:
        async with websockets.connect(WS_URL) as websocket:
            print(f"✅ Connected to WebSocket server with id {websocket.id}")
            message = json.dumps({
                "type": "JOIN_ROOM",
                "data": {
                    "roomId": "hello"
                }
            })
            await websocket.send(message)
            print(f"📤 Sent: {message}")
            response = await websocket.recv()
            print(f"📥 Received: {response}")

            latlng = input("Enter your guess:").split(",")
            message = json.dumps({
                "type": "SUBMIT_RESULT",
                "data": {
                    "guessLocation": {
                        "lat": float(latlng[0]),
                        "lng": float(latlng[1])
                    }
                }
            })
            await websocket.send(message)
            print(f"📤 Sent: {message}")
            response = await websocket.recv()
            print(f"📥 Received: {response}")

    except Exception as e:
        print(f"❌ Error: {e}")
asyncio.run(test_websocket())
