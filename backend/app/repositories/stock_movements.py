from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.stock_movement import StockMovement
from app.repositories.base import OrganizationScopedRepository


class StockMovementRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def record(
        self,
        *,
        product_id: UUID,
        delta: int,
        resulting_quantity: int,
        reason: str,
        note: str | None = None,
        reference_order_id: UUID | None = None,
        created_by_user_id: UUID | None = None,
    ) -> StockMovement:
        movement = StockMovement(
            organization_id=self.organization_id,
            product_id=product_id,
            delta=delta,
            resulting_quantity=resulting_quantity,
            reason=reason,
            note=note,
            reference_order_id=reference_order_id,
            created_by_user_id=created_by_user_id,
        )
        self.session.add(movement)
        return movement

    def list_for_product(
        self,
        *,
        product_id: UUID,
        limit: int,
        offset: int,
    ) -> tuple[list[StockMovement], int]:
        conditions = [
            StockMovement.organization_id == self.organization_id,
            StockMovement.product_id == product_id,
        ]
        total = self.session.scalar(select(func.count(StockMovement.id)).where(*conditions)) or 0
        movements = list(
            self.session.scalars(
                select(StockMovement)
                .where(*conditions)
                .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
                .limit(limit)
                .offset(offset)
                .options(selectinload(StockMovement.created_by))
            ).all()
        )
        return movements, total
