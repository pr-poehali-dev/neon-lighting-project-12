import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(cur, token: str):
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """Лайки: поставить, убрать, получить список лайкнувших и своих лайков."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            token = body.get("token", "")
            to_profile_id = body.get("profileId")

            user_id = get_user_id(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет авторизации"})}

            # Нельзя лайкать свою анкету
            cur.execute("SELECT id FROM profiles WHERE user_id = %s AND id = %s", (user_id, to_profile_id))
            if cur.fetchone():
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нельзя лайкать свою анкету"})}

            try:
                cur.execute(
                    "INSERT INTO likes (from_user_id, to_profile_id) VALUES (%s, %s)",
                    (user_id, to_profile_id)
                )
                conn.commit()
                liked = True
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                cur.execute(
                    "DELETE FROM likes WHERE from_user_id = %s AND to_profile_id = %s",
                    (user_id, to_profile_id)
                )
                conn.commit()
                liked = False

            # Считаем лайки на анкете
            cur.execute("SELECT COUNT(*) FROM likes WHERE to_profile_id = %s", (to_profile_id,))
            count = cur.fetchone()[0]

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"liked": liked, "count": count})}

        if method == "GET":
            params = event.get("queryStringParameters") or {}
            token = params.get("token", "")
            mode = params.get("mode", "received")  # received | given | check

            user_id = get_user_id(cur, token)
            if not user_id:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет авторизации"})}

            if mode == "received":
                # Кто лайкнул мою анкету
                cur.execute("""
                    SELECT u.id, p.id, p.name, p.age, p.city, p.photo_url, l.created_at
                    FROM likes l
                    JOIN users u ON u.id = l.from_user_id
                    JOIN profiles p ON p.user_id = u.id
                    WHERE l.to_profile_id IN (SELECT id FROM profiles WHERE user_id = %s)
                    ORDER BY l.created_at DESC
                """, (user_id,))
                rows = cur.fetchall()
                result = [{"userId": r[0], "profileId": r[1], "name": r[2], "age": r[3], "city": r[4], "photoUrl": r[5]} for r in rows]
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"likes": result})}

            if mode == "given":
                # Кого я лайкнул
                cur.execute("""
                    SELECT p.id, p.name, p.age, p.city, p.photo_url
                    FROM likes l
                    JOIN profiles p ON p.id = l.to_profile_id
                    WHERE l.from_user_id = %s
                    ORDER BY l.created_at DESC
                """, (user_id,))
                rows = cur.fetchall()
                result = [{"profileId": r[0], "name": r[1], "age": r[2], "city": r[3], "photoUrl": r[4]} for r in rows]
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"likes": result})}

            if mode == "check":
                # Какие profileId я лайкнул (для подсветки кнопок)
                cur.execute("SELECT to_profile_id FROM likes WHERE from_user_id = %s", (user_id,))
                ids = [r[0] for r in cur.fetchall()]
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"likedIds": ids})}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}

    finally:
        cur.close()
        conn.close()
