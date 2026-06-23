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
        name = body.get("name", "").strip()
        age = int(body.get("age", 0))
        city = body.get("city", "").strip()
        gender = body.get("gender", "").strip()
        looking_for = body.get("lookingFor", "").strip()
        bio = body.get("bio", "").strip()
        interests = body.get("interests", [])

        if not all([name, age, city, gender, looking_for, bio]):
            return {
                "statusCode": 400,
                "headers": cors,
                "body": json.dumps({"error": "Заполни все поля"}),
            }

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO profiles (name, age, city, gender, looking_for, bio, interests)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (name, age, city, gender, looking_for, bio, interests),
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
            SELECT id, name, age, city, gender, looking_for, bio, interests, created_at
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
            }
            for r in rows
        ]

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"profiles": profiles}),
        }

    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}
