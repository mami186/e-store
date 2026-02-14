"""
Role-Based Access Control (RBAC) Constants and Utilities

Role Hierarchy:
0: User - Basic user with no special privileges
1: Seller - Can create and manage own products
2: Moderator - Can moderate content (products, comments, images)
3: Admin - Can promote to moderator and manage users
4: Super Admin - Can promote to admin, full system access
"""

from enum import IntEnum
from typing import List
from fastapi import HTTPException, status
from app.models.models import User, Role


class UserRole(IntEnum):
    """Role enumeration matching database role IDs"""
    USER = 0
    SELLER = 1
    MODERATOR = 2
    ADMIN = 3
    SUPER_ADMIN = 4


# Role constants for easy reference
USER = UserRole.USER
SELLER = UserRole.SELLER
MODERATOR = UserRole.MODERATOR
ADMIN = UserRole.ADMIN
SUPER_ADMIN = UserRole.SUPER_ADMIN


def get_user_role_ids(user: User) -> List[int]:
    """
    Get list of role IDs assigned to a user
    
    Args:
        user: User model instance with loaded roles relationship
    
    Returns:
        List of role IDs
    """
    if not user.roles:
        return [USER]  # Default to USER role if no roles assigned
    return [role.id for role in user.roles]


def get_highest_role(user: User) -> int:
    """
    Get the highest role ID for a user
    
    Args:
        user: User model instance with loaded roles relationship
    
    Returns:
        Highest role ID (0-4)
    """
    role_ids = get_user_role_ids(user)
    return max(role_ids) if role_ids else USER


def user_has_role(user: User, required_role: int) -> bool:
    """
    Check if user has a specific role or higher
    
    Args:
        user: User model instance
        required_role: Minimum role ID required (0-4)
    
    Returns:
        True if user has the required role or higher
    """
    user_role = get_highest_role(user)
    return user_role >= required_role


def check_seller_permission(user: User) -> bool:
    """Check if user is a seller or higher"""
    return user_has_role(user, SELLER)


def check_moderator_permission(user: User) -> bool:
    """Check if user is a moderator or higher"""
    return user_has_role(user, MODERATOR)


def check_admin_permission(user: User) -> bool:
    """Check if user is an admin or higher"""
    return user_has_role(user, ADMIN)


def check_super_admin_permission(user: User) -> bool:
    """Check if user is a super admin"""
    return user_has_role(user, SUPER_ADMIN)


def require_seller(user: User) -> None:
    """
    Raise exception if user is not a seller or higher
    
    Raises:
        HTTPException: 403 if user doesn't have seller role
    """
    if not check_seller_permission(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller privileges required"
        )


def require_moderator(user: User) -> None:
    """
    Raise exception if user is not a moderator or higher
    
    Raises:
        HTTPException: 403 if user doesn't have moderator role
    """
    if not check_moderator_permission(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator privileges required"
        )


def require_admin(user: User) -> None:
    """
    Raise exception if user is not an admin or higher
    
    Raises:
        HTTPException: 403 if user doesn't have admin role
    """
    if not check_admin_permission(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )


def require_super_admin(user: User) -> None:
    """
    Raise exception if user is not a super admin
    
    Raises:
        HTTPException: 403 if user is not super admin
    """
    if not check_super_admin_permission(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required"
        )


def can_promote_to_role(current_user: User, target_role: int) -> bool:
    """
    Check if current user can promote someone to target role
    
    Rules:
    - Super Admin can promote to Admin (3)
    - Admin can promote to Moderator (2)
    - Seller promotion is application-based, not from admin
    
    Args:
        current_user: User attempting to promote
        target_role: Target role ID to promote to
    
    Returns:
        True if promotion is allowed
    """
    user_role = get_highest_role(current_user)
    
    # Super admin can promote to admin
    if user_role == SUPER_ADMIN and target_role == ADMIN:
        return True
    
    # Admin can promote to moderator
    if user_role == ADMIN and target_role == MODERATOR:
        return True
    
    return False


def validate_role_promotion(current_user: User, target_role: int) -> None:
    """
    Validate and raise exception if promotion is not allowed
    
    Args:
        current_user: User attempting to promote
        target_role: Target role ID to promote to
    
    Raises:
        HTTPException: 403 if promotion is not allowed
    """
    if not can_promote_to_role(current_user, target_role):
        user_role = get_highest_role(current_user)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your role ({user_role}) cannot promote users to role {target_role}"
        )
