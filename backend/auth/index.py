import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Регистрация, вход и проверка сессии пользователя."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "register":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            if not email or len(password) < 6:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Некорректные данные"})}

            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Email уже зарегистрирован"})}

            pw_hash = hash_password(password)
            cur.execute("INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id", (email, pw_hash))
            user_id = cur.fetchone()[0]

            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, user_id))
            conn.commit()

            return {"statusCode": 201, "headers": CORS, "body": json.dumps({"token": token, "userId": user_id})}

        if action == "login":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            pw_hash = hash_password(password)

            cur.execute("SELECT id FROM users WHERE email = %s AND password_hash = %s", (email, pw_hash))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}

            user_id = row[0]
            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, user_id))
            conn.commit()

            cur.execute("SELECT id FROM profiles WHERE user_id = %s LIMIT 1", (user_id,))
            profile = cur.fetchone()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "token": token,
                "userId": user_id,
                "hasProfile": profile is not None
            })}

        if action == "me":
            token = body.get("token", "")
            cur.execute("""
                SELECT u.id, u.email, p.id, p.name, p.age, p.city, p.gender, p.looking_for, p.bio, p.interests, p.photo_url
                FROM sessions s
                JOIN users u ON u.id = s.user_id
                LEFT JOIN profiles p ON p.user_id = u.id
                WHERE s.token = %s
            """, (token,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия не найдена"})}

            result = {"userId": row[0], "email": row[1]}
            if row[2]:
                result["profile"] = {
                    "id": row[2], "name": row[3], "age": row[4], "city": row[5],
                    "gender": row[6], "lookingFor": row[7], "bio": row[8], "interests": row[9],
                    "photoUrl": row[10]
                }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(result)}

        if action == "logout":
            token = body.get("token", "")
            cur.execute("DELETE FROM sessions WHERE token = %s", (token,))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}

    finally:
        cur.close()
        conn.close()