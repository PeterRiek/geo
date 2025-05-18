import asyncio
import websockets

JWT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNzQ3NTc3Mzg3LCJleHAiOjE3NDc1ODA5ODd9.vp0MfXmMmdL8ULowS7Vb5yg3CofC95_bYhOmZEgImqeDejhGcF9SC5HAMfq6Ohtx-3Mp_LU66B82BTSQULONxQ"
WS_URL = f"ws://localhost:8080/ws/echo?token={JWT_TOKEN}"

async def test_websocket():
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("✅ Connected to WebSocket server")
            message = "Hello from Python client!"
            await websocket.send(message)
            print(f"📤 Sent: {message}")
            response = await websocket.recv()
            print(f"📥 Received: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")
asyncio.run(test_websocket())
