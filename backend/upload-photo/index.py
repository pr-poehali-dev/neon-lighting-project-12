import json
import os
import base64
import uuid
import boto3
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Загрузка фото профиля в S3 и сохранение ссылки в profiles."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    token = body.get("token", "")
    image_b64 = body.get("image", "")
    content_type = body.get("contentType", "image/jpeg")

    if not token or not image_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет токена или изображения"})}

    # Проверяем сессию
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия не найдена"})}

    user_id = row[0]

    # Загружаем в S3
    image_data = base64.b64decode(image_b64)
    ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
    key = f"photos/{user_id}_{uuid.uuid4().hex[:8]}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType=content_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    # Сохраняем в профиль
    cur.execute("UPDATE profiles SET photo_url = %s WHERE user_id = %s", (cdn_url, user_id))
    conn.commit()
    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"url": cdn_url})}
