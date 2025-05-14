import jwt
import datetime
import sys


def create_jwt(email, secret):
    payload = {
        "sub": email,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token

def main():
    if len(sys.argv) < 2:
        print("missing arg: secret")
        return
    email = "testuser@example.com"
    token = create_jwt(email, sys.argv[1])
    print("JWT token:", token)


if __name__ == "__main__":
    main()