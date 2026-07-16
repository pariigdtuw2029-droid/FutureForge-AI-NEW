from datetime import datetime

from app.database import db
from app.database import resume_collection




def save_resume_analysis(request: dict, analysis: dict):
    document = {
        "request": request,
        "analysis": analysis,
        "created_at": datetime.utcnow().isoformat()
    }

    # NOTE: `resume_collection` is a synchronous pymongo collection
    # (see app/database.py). This was previously called with `await`,
    # which raises a TypeError at runtime against pymongo. Fixed to be
    # a plain synchronous call.
    result = resume_collection.insert_one(document)

    return str(result.inserted_id)


def get_all_resume_analysis():
    analyses = []

    for item in resume_collection.find():
        item["_id"] = str(item["_id"])
        analyses.append(item)

    return analyses