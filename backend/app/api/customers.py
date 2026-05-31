from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.schemas.customers import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdateRequest,
)
from app.services.customers import (
    CustomerDeleteConflictError,
    CustomerNotFoundError,
    CustomerService,
    CustomerValidationError,
    DuplicateCustomerEmailError,
)

CustomerSortField = Literal["created_at", "full_name", "email"]
SortDirection = Literal["asc", "desc"]

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create customer",
)
def create_customer(
    payload: CustomerCreateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> CustomerResponse:
    service = CustomerService(session, current_user.organization_id)
    try:
        customer = service.create_customer(**payload.model_dump())
    except DuplicateCustomerEmailError as exc:
        raise customer_error(status.HTTP_409_CONFLICT, "duplicate_email", str(exc)) from exc
    except CustomerValidationError as exc:
        raise customer_error(status.HTTP_400_BAD_REQUEST, "invalid_customer", str(exc)) from exc
    return CustomerResponse.model_validate(customer)


@router.get("", response_model=CustomerListResponse, summary="List customers")
def list_customers(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    sort_by: CustomerSortField | None = None,
    sort_dir: SortDirection = "desc",
) -> CustomerListResponse:
    service = CustomerService(session, current_user.organization_id)
    customers, total = service.list_customers(
        limit=limit,
        offset=offset,
        search=q,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return CustomerListResponse(
        items=[CustomerResponse.model_validate(customer) for customer in customers],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{customer_id}", response_model=CustomerResponse, summary="Get customer")
def get_customer(
    customer_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> CustomerResponse:
    service = CustomerService(session, current_user.organization_id)
    try:
        customer = service.get_customer(customer_id)
    except CustomerNotFoundError as exc:
        raise customer_error(status.HTTP_404_NOT_FOUND, "customer_not_found", str(exc)) from exc
    return CustomerResponse.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerResponse, summary="Update customer")
def update_customer(
    customer_id: UUID,
    payload: CustomerUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> CustomerResponse:
    service = CustomerService(session, current_user.organization_id)
    try:
        customer = service.update_customer(customer_id, payload.model_dump(exclude_unset=True))
    except CustomerNotFoundError as exc:
        raise customer_error(status.HTTP_404_NOT_FOUND, "customer_not_found", str(exc)) from exc
    except DuplicateCustomerEmailError as exc:
        raise customer_error(status.HTTP_409_CONFLICT, "duplicate_email", str(exc)) from exc
    except CustomerValidationError as exc:
        raise customer_error(status.HTTP_400_BAD_REQUEST, "invalid_customer", str(exc)) from exc
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete customer")
def delete_customer(
    customer_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    service = CustomerService(session, current_user.organization_id)
    try:
        service.delete_customer(customer_id)
    except CustomerNotFoundError as exc:
        raise customer_error(status.HTTP_404_NOT_FOUND, "customer_not_found", str(exc)) from exc
    except CustomerDeleteConflictError as exc:
        raise customer_error(
            status.HTTP_409_CONFLICT, "customer_delete_conflict", str(exc)
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def customer_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
        },
    )
