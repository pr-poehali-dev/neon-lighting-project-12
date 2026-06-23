import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Создание анкеты и поиск пользователей по параметрам."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        token = body.get("token", "")
        name = body.get("name", "").strip()
        age = int(body.get("age", 0))
        city = body.get("city", "").strip()
        gender = body.get("gender", "").strip()
        looking_for = body.get("lookingFor", "").strip()
        bio = body.get("bio", "").strip()
        interests = body.get("interests", [])

        if not all([name, age, city, gender, looking_for, bio]):
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Заполни все поля"})}

        conn = get_conn()
        cur = conn.cursor()

        user_id = None
        if token:
            cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
            row = cur.fetchone()
            if row:
                user_id = row[0]
                cur.execute("DELETE FROM profiles WHERE user_id = %s", (user_id,))

        # Сохраняем photo_url если была у предыдущей анкеты
        old_photo = None
        if user_id:
            cur.execute("SELECT photo_url FROM profiles WHERE user_id = %s LIMIT 1", (user_id,))
            old_row = cur.fetchone()
            if old_row:
                old_photo = old_row[0]

        cur.execute(
            """
            INSERT INTO profiles (name, age, city, gender, looking_for, bio, interests, user_id, photo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (name, age, city, gender, looking_for, bio, interests, user_id, old_photo),
        )
        profile_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 201,
            "headers": cors,
            "body": json.dumps({"id": profile_id, "success": True}),
        }

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        city = params.get("city", "").strip()
        gender = params.get("gender", "").strip()
        min_age = int(params.get("minAge", 18))
        max_age = int(params.get("maxAge", 99))

        conn = get_conn()
        cur = conn.cursor()

        filters = ["age >= %s", "age <= %s"]
        values = [min_age, max_age]

        if city:
            filters.append("LOWER(city) LIKE %s")
            values.append(f"%{city.lower()}%")
        if gender:
            filters.append("gender = %s")
            values.append(gender)

        where = " AND ".join(filters)
        cur.execute(
            f"""
            SELECT id, name, age, city, gender, looking_for, bio, interests, created_at, photo_url
            FROM profiles
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT 50
            """,
            values,
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        profiles = [
            {
                "id": r[0],
                "name": r[1],
                "age": r[2],
                "city": r[3],
                "gender": r[4],
                "lookingFor": r[5],
                "bio": r[6],
                "interests": r[7],
                "createdAt": r[8].isoformat(),
                "photoUrl": r[9],
            }
            for r in rows
        ]

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"profiles": profiles}),
        }

    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}