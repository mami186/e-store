"""Seed script: creates initial super_admin, roles, categories, restriction reasons,
demo users (admins, moderators, sellers), and sample products with variants/subvariants."""

import asyncio
import sys

sys.path.insert(0, ".")

PASSWORD = "Demo123!"


async def main():
    from sqlalchemy import select

    from app.core.database import async_session
    from app.core.security import get_password_hash
    from app.models.category import Category
    from app.models.product import Product, ProductVariant, ProductSubVariant
    from app.models.restriction import RestrictionReason
    from app.models.user import User, Role, UserRole, Seller

    async with async_session() as db:
        # ── Roles ──
        for role_data in [
            {"id": 0, "name": "user", "description": "Basic user"},
            {"id": 1, "name": "seller", "description": "Can create and manage products"},
            {"id": 2, "name": "moderator", "description": "Can moderate content"},
            {"id": 3, "name": "admin", "description": "Can manage users and promote to moderator"},
            {"id": 4, "name": "super_admin", "description": "Full access"},
        ]:
            r = await db.execute(select(Role).where(Role.id == role_data["id"]))
            if not r.scalar_one_or_none():
                db.add(Role(**role_data))
        await db.commit()
        print("Roles seeded")

        # ── Super Admin ──
        r = await db.execute(select(User).where(User.email == "admin@estore.com"))
        if not r.scalar_one_or_none():
            user = User(
                email="admin@estore.com",
                password_hash=get_password_hash("Admin123!"),
                first_name="Super",
                last_name="Admin",
                email_verified=True,
            )
            db.add(user)
            await db.flush()
            for rid in [0, 1, 2, 3, 4]:
                db.add(UserRole(user_id=user.id, role_id=rid))
            await db.commit()
            print("Super admin created: admin@estore.com / Admin123!")
        else:
            print("Super admin already exists")

        # ── Restriction Reasons ──
        for reason_text in [
            "Counterfeit products",
            "Prohibited or restricted items",
            "Intellectual property violation",
            "Fraudulent activity",
            "Poor customer service",
            "Product misrepresentation",
            "Policy violation",
            "Spam or misleading listings",
        ]:
            r = await db.execute(select(RestrictionReason).where(RestrictionReason.reason_text == reason_text))
            if not r.scalar_one_or_none():
                db.add(RestrictionReason(reason_text=reason_text))
        await db.commit()
        print("Restriction reasons seeded")

        # ── Categories ──
        cat_defs = [
            {"name": "Electronics", "slug": "electronics", "description": "Phones, laptops, accessories and more"},
            {"name": "Clothing", "slug": "clothing", "description": "Apparel, shoes and accessories"},
            {"name": "Home & Kitchen", "slug": "home-kitchen", "description": "Furniture, appliances and kitchenware"},
            {"name": "Books", "slug": "books", "description": "Books, e-books and educational materials"},
            {"name": "Sports", "slug": "sports", "description": "Sports equipment and outdoor gear"},
        ]
        for cd in cat_defs:
            r = await db.execute(select(Category).where(Category.slug == cd["slug"]))
            if not r.scalar_one_or_none():
                db.add(Category(**cd))
        await db.commit()
        # fetch category id map
        cats = {}
        for cd in cat_defs:
            r = await db.execute(select(Category.id).where(Category.slug == cd["slug"]))
            cats[cd["slug"]] = r.scalar_one()
        print("Categories seeded")

        # ── Demo Users ──
        demo_users = [
            # (email, first, last, role_ids, seller_shop_name | None)
            # -- Admins --
            ("admin1@estore.com", "Alice", "Admin", [0, 3], None),
            ("admin2@estore.com", "Bob", "Admin", [0, 3], None),
            # -- Moderators --
            ("mod1@estore.com", "Carol", "Moderator", [0, 2], None),
            ("mod2@estore.com", "Dave", "Moderator", [0, 2], None),
            # -- Sellers --
            ("seller1@estore.com", "Emma", "Seller", [0, 1], "Emma's Electronics"),
            ("seller2@estore.com", "Frank", "Seller", [0, 1], "Frank's Fashion"),
            ("seller3@estore.com", "Grace", "Seller", [0, 1], "Grace's Home Goods"),
            ("seller4@estore.com", "Henry", "Seller", [0, 1], "Henry's Bookshelf"),
            ("seller5@estore.com", "Ivy", "Seller", [0, 1], "Ivy's Sports Corner"),
            ("seller6@estore.com", "Jack", "Seller", [0, 1], "Jack's Gadgets"),
            ("seller7@estore.com", "Kate", "Seller", [0, 1], "Kate's Closet"),
            ("seller8@estore.com", "Liam", "Seller", [0, 1], "Liam's Kitchen"),
            ("seller9@estore.com", "Mia", "Seller", [0, 1], "Mia's Reads"),
            ("seller10@estore.com", "Noah", "Seller", [0, 1], "Noah's Fitness"),
            ("seller11@estore.com", "Olivia", "Seller", [0, 1], "Olivia's Tech"),
            ("seller12@estore.com", "Paul", "Seller", [0, 1], "Paul's Apparel"),
            ("seller13@estore.com", "Quinn", "Seller", [0, 1], "Quinn's Living"),
            ("seller14@estore.com", "Rose", "Seller", [0, 1], "Rose's Library"),
            ("seller15@estore.com", "Sam", "Seller", [0, 1], "Sam's Outdoors"),
        ]

        created_user_ids = []
        for email, first, last, role_ids, shop_name in demo_users:
            r = await db.execute(select(User.id).where(User.email == email))
            user_id = r.scalar_one_or_none()
            if not user_id:
                user = User(
                    email=email,
                    password_hash=get_password_hash(PASSWORD),
                    first_name=first,
                    last_name=last,
                    email_verified=True,
                )
                db.add(user)
                await db.flush()
                user_id = user.id
                for rid in role_ids:
                    db.add(UserRole(user_id=user_id, role_id=rid))
                if shop_name:
                    db.add(Seller(
                        user_id=user_id,
                        shop_name=shop_name,
                        shop_description=f"Quality products from {first} {last}",
                        verification_status="approved",
                        is_active=True,
                    ))
                await db.commit()
                print(f"Created: {email}")
            else:
                print(f"Already exists: {email}")
            created_user_ids.append(user_id)

        seller_rows = {}
        for uid in created_user_ids:
            r = await db.execute(select(Seller).where(Seller.user_id == uid))
            s = r.scalar_one_or_none()
            if s:
                seller_rows[uid] = s

        # ── Product Templates ──
        # Each template: (name, description, category_slug, variants)
        # variant: (variant_name, sku_suffix, price, compare_at_price, stock, attributes_dict, [subvariants])
        # subvariant: (subvariant_name, sku_suffix, price_override_or_None, stock, attributes_dict)
        product_templates = [
            # -- Electronics --
            ("Wireless Headphones", "Premium noise-cancelling wireless headphones with 30h battery life", "electronics", [
                ("Black", "WH-BLK", 89.99, 119.99, 25, {"color": "Black"}, [
                    ("Small", "WH-BLK-S", None, 5, {"size": "Small"}),
                    ("Medium", "WH-BLK-M", None, 15, {"size": "Medium"}),
                    ("Large", "WH-BLK-L", None, 5, {"size": "Large"}),
                ]),
                ("White", "WH-WHT", 89.99, 119.99, 20, {"color": "White"}, [
                    ("Medium", "WH-WHT-M", None, 12, {"size": "Medium"}),
                    ("Large", "WH-WHT-L", None, 8, {"size": "Large"}),
                ]),
            ]),
            ("USB-C Hub 7-in-1", "Multi-port USB-C hub with HDMI, USB 3.0, SD card reader", "electronics", [
                ("Gray", "HUB-GRY", 34.99, 49.99, 50, {"color": "Space Gray"}, [
                    ("Standard", "HUB-GRY-STD", None, 50, {}),
                ]),
            ]),
            ("Portable Bluetooth Speaker", "Waterproof portable speaker with 360° sound", "electronics", [
                ("Blue", "SPK-BLU", 49.99, 69.99, 30, {"color": "Ocean Blue"}, [
                    ("Standard", "SPK-BLU-STD", None, 30, {}),
                ]),
                ("Red", "SPK-RED", 49.99, 69.99, 20, {"color": "Coral Red"}, [
                    ("Standard", "SPK-RED-STD", None, 20, {}),
                ]),
                ("Black", "SPK-BLK", 44.99, 59.99, 35, {"color": "Midnight Black"}, [
                    ("Standard", "SPK-BLK-STD", None, 35, {}),
                ]),
            ]),
            # -- Clothing --
            ("Cotton T-Shirt", "Soft 100% organic cotton t-shirt, pre-shrunk", "clothing", [
                ("White", "TS-WHT", 19.99, 29.99, 100, {"color": "White"}, [
                    ("S", "TS-WHT-S", None, 25, {"size": "S"}),
                    ("M", "TS-WHT-M", None, 35, {"size": "M"}),
                    ("L", "TS-WHT-L", None, 40, {"size": "L"}),
                ]),
                ("Black", "TS-BLK", 19.99, 29.99, 80, {"color": "Black"}, [
                    ("S", "TS-BLK-S", None, 20, {"size": "S"}),
                    ("M", "TS-BLK-M", None, 30, {"size": "M"}),
                    ("L", "TS-BLK-L", None, 30, {"size": "L"}),
                ]),
                ("Navy", "TS-NAV", 22.99, 29.99, 60, {"color": "Navy"}, [
                    ("M", "TS-NAV-M", None, 25, {"size": "M"}),
                    ("L", "TS-NAV-L", None, 20, {"size": "L"}),
                    ("XL", "TS-NAV-XL", None, 15, {"size": "XL"}),
                ]),
            ]),
            ("Denim Jacket", "Classic denim jacket with modern fit", "clothing", [
                ("Light Wash", "DJ-LW", 69.99, 89.99, 30, {"color": "Light Wash"}, [
                    ("M", "DJ-LW-M", None, 10, {"size": "M"}),
                    ("L", "DJ-LW-L", None, 15, {"size": "L"}),
                    ("XL", "DJ-LW-XL", None, 5, {"size": "XL"}),
                ]),
                ("Dark Wash", "DJ-DW", 74.99, 99.99, 25, {"color": "Dark Wash"}, [
                    ("M", "DJ-DW-M", None, 8, {"size": "M"}),
                    ("L", "DJ-DW-L", None, 12, {"size": "L"}),
                    ("XL", "DJ-DW-XL", None, 5, {"size": "XL"}),
                ]),
            ]),
            ("Running Shoes", "Lightweight running shoes with responsive cushioning", "clothing", [
                ("Black/White", "RS-BW", 89.99, 129.99, 40, {"color": "Black/White"}, [
                    ("US 8", "RS-BW-8", None, 10, {"size": "US 8"}),
                    ("US 9", "RS-BW-9", None, 15, {"size": "US 9"}),
                    ("US 10", "RS-BW-10", None, 15, {"size": "US 10"}),
                ]),
                ("Blue/White", "RS-BL", 89.99, 129.99, 30, {"color": "Blue/White"}, [
                    ("US 8", "RS-BL-8", None, 8, {"size": "US 8"}),
                    ("US 9", "RS-BL-9", None, 12, {"size": "US 9"}),
                    ("US 10", "RS-BL-10", None, 10, {"size": "US 10"}),
                ]),
            ]),
            # -- Home & Kitchen --
            ("Ceramic Mug Set", "Set of 4 handcrafted ceramic mugs, 12oz each", "home-kitchen", [
                ("Matte Black", "MUG-BLK", 29.99, 39.99, 40, {"color": "Matte Black"}, [
                    ("Set of 4", "MUG-BLK-4", None, 40, {}),
                ]),
                ("Cream", "MUG-CRM", 29.99, 39.99, 35, {"color": "Cream"}, [
                    ("Set of 4", "MUG-CRM-4", None, 35, {}),
                ]),
            ]),
            ("Bamboo Cutting Board", "Large bamboo cutting board with juice groove", "home-kitchen", [
                ("Medium", "BCB-MED", 19.99, 29.99, 60, {"size": "Medium (12x18)"}, [
                    ("Standard", "BCB-MED-STD", None, 60, {}),
                ]),
                ("Large", "BCB-LRG", 29.99, 39.99, 40, {"size": "Large (15x20)"}, [
                    ("Standard", "BCB-LRG-STD", None, 40, {}),
                ]),
            ]),
            ("Stainless Steel Coffee Maker", "12-cup programmable coffee maker with thermal carafe", "home-kitchen", [
                ("Silver", "CM-SLV", 59.99, 79.99, 25, {"color": "Brushed Silver"}, [
                    ("Standard", "CM-SLV-STD", None, 25, {}),
                ]),
                ("Black", "CM-BLK", 64.99, 84.99, 20, {"color": "Black Matte"}, [
                    ("Standard", "CM-BLK-STD", None, 20, {}),
                ]),
            ]),
            # -- Books --
            ("The Art of Italian Cooking", "Authentic Italian recipes from a Michelin-star chef", "books", [
                ("Hardcover", "COOK-HC", 34.99, 44.99, 50, {"binding": "Hardcover"}, [
                    ("Standard", "COOK-HC-STD", None, 50, {}),
                ]),
                ("Paperback", "COOK-PB", 24.99, None, 80, {"binding": "Paperback"}, [
                    ("Standard", "COOK-PB-STD", None, 80, {}),
                ]),
            ]),
            ("Galactic Frontier", "A gripping sci-fi adventure across the Andromeda galaxy", "books", [
                ("Hardcover", "SCI-HC", 28.99, 36.99, 40, {"binding": "Hardcover"}, [
                    ("Standard", "SCI-HC-STD", None, 40, {}),
                ]),
                ("Paperback", "SCI-PB", 16.99, None, 100, {"binding": "Paperback"}, [
                    ("Standard", "SCI-PB-STD", None, 100, {}),
                ]),
                ("eBook", "SCI-EBK", 9.99, None, 999, {"format": "eBook"}, [
                    ("Standard", "SCI-EBK-STD", None, 999, {}),
                ]),
            ]),
            ("Mindful Growth", "Practical guide to building better habits and achieving goals", "books", [
                ("Hardcover", "SELF-HC", 26.99, 34.99, 45, {"binding": "Hardcover"}, [
                    ("Standard", "SELF-HC-STD", None, 45, {}),
                ]),
                ("Paperback", "SELF-PB", 15.99, None, 90, {"binding": "Paperback"}, [
                    ("Standard", "SELF-PB-STD", None, 90, {}),
                ]),
                ("Audio", "SELF-AUD", 19.99, None, 200, {"format": "Audiobook"}, [
                    ("Standard", "SELF-AUD-STD", None, 200, {}),
                ]),
            ]),
            # -- Sports --
            ("Premium Yoga Mat", "Extra thick non-slip yoga mat with carrying strap", "sports", [
                ("Purple", "YM-PUR", 39.99, 54.99, 40, {"color": "Lavender Purple"}, [
                    ("Standard", "YM-PUR-STD", None, 40, {}),
                ]),
                ("Green", "YM-GRN", 39.99, 54.99, 35, {"color": "Forest Green"}, [
                    ("Standard", "YM-GRN-STD", None, 35, {}),
                ]),
                ("Gray", "YM-GRY", 34.99, 49.99, 45, {"color": "Charcoal Gray"}, [
                    ("Standard", "YM-GRY-STD", None, 45, {}),
                ]),
            ]),
            ("Resistance Bands Set", "Set of 5 resistance bands with door anchor and carrying bag", "sports", [
                ("Light", "RB-LT", 14.99, 24.99, 70, {"level": "Light (10-20 lbs)"}, [
                    ("Standard", "RB-LT-STD", None, 70, {}),
                ]),
                ("Heavy", "RB-HV", 19.99, 29.99, 50, {"level": "Heavy (30-50 lbs)"}, [
                    ("Standard", "RB-HV-STD", None, 50, {}),
                ]),
                ("Pro Set", "RB-PRO", 29.99, 44.99, 35, {"level": "All levels"}, [
                    ("Standard", "RB-PRO-STD", None, 35, {}),
                ]),
            ]),
            ("Insulated Water Bottle", "32oz double-wall vacuum insulated water bottle", "sports", [
                ("Stainless", "WB-SS", 24.99, 34.99, 60, {"color": "Brushed Stainless"}, [
                    ("Standard", "WB-SS-STD", None, 60, {}),
                ]),
                ("Matte Black", "WB-BLK", 27.99, 36.99, 50, {"color": "Matte Black"}, [
                    ("Standard", "WB-BLK-STD", None, 50, {}),
                ]),
            ]),
        ]

        # assign 3 products per seller (15 sellers * 3 = 45, we have 15 templates; each seller gets 3 templates cycled)
        seller_ids = [s.user_id for s in seller_rows.values()]
        template_count = len(product_templates)  # 15
        seller_product_count = 3

        prod_idx = 0
        for sid in seller_ids:
            for _ in range(seller_product_count):
                tmpl = product_templates[prod_idx % template_count]
                prod_idx += 1
                pname, pdesc, pcat_slug, variants_data = tmpl

                # check if product already exists for this seller
                r = await db.execute(
                    select(Product).where(Product.seller_id == sid, Product.name == pname)
                )
                if r.scalar_one_or_none():
                    print(f"  Product already exists for seller {sid}: {pname}")
                    continue

                product = Product(
                    seller_id=sid,
                    name=pname,
                    description=pdesc,
                    category_id=cats[pcat_slug],
                    status="published",
                    is_active=True,
                )
                db.add(product)
                await db.flush()

                for vname, vsku_sfx, vprice, vcompare, vstock, vattrs, subvariants_data in variants_data:
                    sku = f"{vsku_sfx}-{product.id}"
                    r = await db.execute(
                        select(ProductVariant).where(ProductVariant.product_id == product.id, ProductVariant.sku == sku)
                    )
                    if r.scalar_one_or_none():
                        continue
                    variant = ProductVariant(
                        product_id=product.id,
                        sku=sku,
                        variant_name=vname,
                        price=vprice,
                        compare_at_price=vcompare,
                        stock=vstock,
                        attributes=vattrs,
                        is_default=False,
                        is_active=True,
                    )
                    db.add(variant)
                    await db.flush()

                    for svname, svsku_sfx, svprice, svstock, svattrs in subvariants_data:
                        sv_sku = f"{svsku_sfx}-{variant.id}"
                        r = await db.execute(
                            select(ProductSubVariant).where(
                                ProductSubVariant.variant_id == variant.id, ProductSubVariant.sku == sv_sku
                            )
                        )
                        if r.scalar_one_or_none():
                            continue
                        subvar = ProductSubVariant(
                            variant_id=variant.id,
                            sku=sv_sku,
                            subvariant_name=svname,
                            price=svprice,
                            stock=svstock,
                            attributes=svattrs,
                            is_default=False,
                            is_active=True,
                        )
                        db.add(subvar)
                await db.commit()
                print(f"  Created product: {pname} for seller {sid}")

        print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(main())
