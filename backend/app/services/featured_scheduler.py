from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, update, func
from app.core.database import async_session
from app.models.featured import FeaturedItem


async def refresh_featured_items():
    async with async_session() as db:
        now = datetime.now(timezone.utc)

        await db.execute(
            update(FeaturedItem)
            .where(FeaturedItem.end_date < now, FeaturedItem.is_active == True)
            .values(is_active=False)
        )

        await db.execute(
            update(FeaturedItem)
            .where(
                FeaturedItem.start_date <= now,
                FeaturedItem.end_date >= now,
                FeaturedItem.is_active == False,
            )
            .values(is_active=True)
        )

        await db.commit()


async def _find_next_run(now: datetime) -> datetime:
    target_hours = [0, 12]
    candidates = []
    for hour in target_hours:
        candidate = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        candidates.append(candidate)
    return min(candidates)


async def featured_scheduler_loop():
    while True:
        now = datetime.now(timezone.utc)
        next_run = await _find_next_run(now)
        sleep_seconds = (next_run - now).total_seconds()
        await asyncio.sleep(sleep_seconds)
        await refresh_featured_items()
