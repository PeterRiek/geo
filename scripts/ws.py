import asyncio
import websockets
import json
import sys
import random

# eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc0NzcwMTA4NCwiZXhwIjoxNzQ3NzA0Njg0fQ.G0oQJ3j9GAZgfbexfRdSfl0uVPflXUkpdg1o-yoaI2qyhg5T9654EJ5gNw-u-8Vy8ePikFySwfsb1EvKJzp4nw
# eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNzQ3NzAwOTcwLCJleHAiOjE3NDc3MDQ1NzB9.L6bKD0WEbw5f1JzeHmZdFigYDK5DY78Sodo5LBXUSE0M_yQnPXZ7CW5VXwuLqUH7G3dJZ56PBP-enptVuGvjgA

JWT_TOKEN = sys.argv[1]
WS_URL = f"ws://localhost:8080/ws/duel?token={JWT_TOKEN}"
ROOM_ID = "Room_X"



messages = [
    "wait",
    "exit",
    json.dumps({
        "type": "JOIN",
        "roomId": ROOM_ID,
    }),
    json.dumps({
        "type": "GUESS",
        "roomId": ROOM_ID,
        "payload": {
            "lat": random.randrange(0,100),
            "lng": random.randrange(0,100)
        }
    }),
    json.dumps({
        "type": "START_GAME",
        "roomId": ROOM_ID,
    }),
    json.dumps({
        "type": "NEXT_ROUND",
        "roomId": ROOM_ID,
    })
]

async def test_websocket():
    try:
        async with websockets.connect(WS_URL) as websocket:
            print(f"✅ Connected to WebSocket server with id {websocket.id}")
            while True:
                message = messages[int(input("Message: "))]
                if message == "exit": break
                if message != "wait":
                    await websocket.send(message)
                    print(f"📤 Sent: {message}")
                else:
                    print("Waiting for message...")
                response = await websocket.recv()
                print(f"📥 Received: {response}")



    except Exception as e:
        print(f"❌ Error: {e}")
    print(f"🟥 Socket closed!")
asyncio.run(test_websocket())
