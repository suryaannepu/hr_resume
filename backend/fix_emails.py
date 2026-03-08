from database import get_applications_collection, get_users_collection, connect_db
from bson.objectid import ObjectId

def fix_emails():
    db = connect_db(is_startup=True)
    if db is None:
        print("Could not connect to DB")
        return


    apps = get_applications_collection()
    users = get_users_collection()

    updated = 0
    for app in apps.find():
        cid = app.get("candidate_id")
        if cid:
            try:
                user = users.find_one({"_id": ObjectId(cid)})
                if user and user.get("email"):
                    if user["email"] != app.get("candidate_email"):
                        apps.update_one({"_id": app["_id"]}, {"$set": {"candidate_email": user["email"]}})
                        updated += 1
                        print(f"Updated app {app['_id']} email to {user['email']}")
            except Exception as e:
                print(f"Error {cid}: {e}")

    print(f"Total updated: {updated}")

if __name__ == "__main__":
    fix_emails()
