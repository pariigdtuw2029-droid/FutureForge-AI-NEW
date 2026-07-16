import logging

from app.services.project_ai_service import generate_project
from app.services.project_service import save_project

from app.services.internship_ai_service import (
    generate_internship_recommendation
)

from app.services.internship_service import (
    save_internship
)

logger = logging.getLogger("futureforge")


async def opportunity_agent(state):

    logger.info("Opportunity Agent running")

    try:

        internship = await generate_internship_recommendation(
            state["internship_request"]
        )

        internship_id = save_internship(
            state["internship_request"].model_dump(),
            internship
        )

        project = await generate_project(
            state["project_request"]
        )

        project_id = await save_project(
            project
        )

        return {

            "internship_result":
                internship,

            "internship_id":
                internship_id,

            "project_result":
                project,

            "project_id":
                project_id,

            "error": None

        }

    except Exception as e:

        logger.exception("Opportunity Agent failed")

        return {

            "error": str(e)

        }
