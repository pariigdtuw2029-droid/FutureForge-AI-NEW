from datetime import datetime

from app.database import internship_collection


def save_internship(request: dict, recommendation: dict):
    document = {
        "request": request,
        "recommendation": recommendation,
        "created_at": datetime.utcnow().isoformat()
    }

    # NOTE: `internship_collection` is a synchronous pymongo collection
    # (see app/database.py). This was previously called with `await`,
    # which raises a TypeError at runtime against pymongo. Fixed to be
    # a plain synchronous call.
    result = internship_collection.insert_one(document)

    return str(result.inserted_id)


def get_all_internships():
    internships = []

    for internship in internship_collection.find():
        internship["_id"] = str(internship["_id"])
        internships.append(internship)

    return internships