// ─── Auth ───
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

// ─── User ───
export interface RoleResponse {
  id: number
  name: string
  description: string | null
}

export interface UserResponse {
  id: number
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  email_verified: boolean
  is_active: boolean
  avatar_url: string | null
  roles: RoleResponse[]
  created_at: string
  updated_at: string
}

export interface UserUpdate {
  first_name?: string
  last_name?: string
  username?: string
}

export interface PasswordUpdate {
  current_password: string
  new_password: string
}

// ─── Seller ───
export interface SellerResponse {
  user_id: number
  shop_name: string
  shop_description: string | null
  payout_account: string | null
  is_active: boolean
  verification_status: string
  created_at: string
  updated_at: string
}

export interface SellerApply {
  shop_name: string
  shop_description?: string
  payout_account?: string
}

export interface SellerUpdate {
  shop_name?: string
  shop_description?: string
  payout_account?: string
}

// ─── Category ───
export interface CategoryCreate {
  name: string
  slug: string
  description?: string | null
  parent_id?: number | null
}

export interface CategoryUpdate {
  name?: string
  slug?: string
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
}

export interface CategoryResponse {
  id: number
  name: string
  slug: string
  description: string | null
  parent_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Product ───
export interface ProductImageResponse {
  id: number
  url: string
  alt_text: string | null
  is_main: boolean
  variant_id: number | null
  subvariant_id: number | null
}

export interface AdminProductImageResponse extends ProductImageResponse {
  is_deleted: boolean
  deleted_at: string | null
}

export interface SubVariantResponse {
  id: number
  variant_id: number
  sku: string
  subvariant_name: string
  price: number | null
  stock: number
  attributes: Record<string, unknown>
  is_default: boolean
  is_active: boolean
  effective_price: number
  image_url: string | null
  images: ProductImageResponse[]
  created_at: string
  updated_at: string
}

export interface ProductVariantResponse {
  id: number
  product_id: number
  sku: string
  variant_name: string
  price: number
  compare_at_price: number | null
  stock: number
  attributes: Record<string, unknown>
  is_default: boolean
  is_active: boolean
  subvariants: SubVariantResponse[]
  discount_percent: number | null
}

export interface ProductResponse {
  id: number
  seller_id: number
  name: string
  short_description: string | null
  long_description: string | null
  category: CategoryResponse | null
  status: string
  is_active: boolean
  variants: ProductVariantResponse[]
  images: ProductImageResponse[]
  main_image: string | null
  min_price: number | null
  max_price: number | null
  created_at: string
  updated_at: string
}

export interface ProductListItem {
  id: number
  name: string
  category: CategoryResponse | null
  status: string
  is_active: boolean
  main_image: string | null
  min_price: number | null
  max_price: number | null
  avg_rating: number | null
  rating_count: number
  created_at: string
}

export interface ProductCreate {
  name: string
  short_description?: string
  long_description?: string
  category_id?: number
}

export interface ProductUpdate {
  name?: string
  short_description?: string
  long_description?: string
  category_id?: number
  status?: string
}

export interface VariantCreate {
  sku: string
  variant_name: string
  price: number
  compare_at_price?: number
  stock?: number
  attributes?: Record<string, unknown>
  is_default?: boolean
}

export interface VariantUpdate {
  sku?: string
  variant_name?: string
  price?: number
  compare_at_price?: number
  stock?: number
  attributes?: Record<string, unknown>
  is_default?: boolean
  is_active?: boolean
}

export interface SubVariantCreate {
  sku: string
  subvariant_name: string
  price?: number
  stock?: number
  attributes?: Record<string, unknown>
  is_default?: boolean
}

export interface SubVariantUpdate {
  sku?: string
  subvariant_name?: string
  price?: number
  stock?: number
  attributes?: Record<string, unknown>
  is_default?: boolean
  is_active?: boolean
}

// ─── Comments ───
export interface CommentResponse {
  id: number
  product_id: number
  user_id: number
  user_name: string
  user_avatar_url: string | null
  parent_comment_id: number | null
  user_rating: number | null
  content: string
  image_url: string | null
  status: string
  depth: number
  reply_count: number
  created_at: string
  replies: CommentResponse[]
  images: CommentImageResponse[]
}

export interface CommentImageResponse {
  id: number
  url: string
}

export interface CommentCreate {
  content: string
  parent_comment_id?: number
  image_url?: string
  image_urls?: string[]
}

export interface CommentReportCreate {
  reason: string
  description?: string
}

export interface CommentReportResponse {
  id: number
  comment_id: number
  reporter_id: number
  reason: string
  description: string | null
  status: string
  created_at: string
}

// ─── Ratings ───
export interface RatingCreate {
  rating: number
}

export interface RatingResponse {
  id: number
  user_id: number
  product_id: number
  rating: number
  created_at: string
  updated_at: string
}

export interface RatingStats {
  average: number
  total: number
  distribution: number[]
}

// ─── Reports ───
export interface ReportResponse {
  id: number
  product_id: number
  reason_text: string
  status: string
  created_at: string
}

export interface ReportCreate {
  reason_text: string
}

// ─── Cart ───
export interface CartItemResponse {
  id: number
  subvariant_id: number
  quantity: number
  subvariant_name: string
  variant_name: string
  variant_sku: string
  attributes: Record<string, unknown>
  price: number
  image_url: string | null
  stock: number
}

export interface CartResponse {
  id: number
  items: CartItemResponse[]
  total: number
}

export interface CartItemCreate {
  subvariant_id: number
  quantity?: number
}

export interface CartItemUpdate {
  quantity: number
}

// ─── Wishlist ───
export interface WishlistItemResponse {
  id: number
  subvariant_id: number
  subvariant_name: string
  variant_name: string
  variant_sku: string
  attributes: Record<string, unknown>
  price: number
  image_url: string | null
  added_at: string
}

export interface WishlistResponse {
  id: number
  items: WishlistItemResponse[]
}

export interface WishlistItemCreate {
  subvariant_id: number
}

// ─── Orders ───
export interface AddressResponse {
  id: number
  full_name: string
  phone: string
  street: string
  city: string
  state: string | null
  postal_code: string
  country: string
  is_default: boolean
}

export interface AddressCreate {
  full_name: string
  phone: string
  street: string
  city: string
  state?: string
  postal_code: string
  country?: string
}

export interface AddressUpdate {
  full_name?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface OrderItemResponse {
  id: number
  subvariant_id: number
  product_name: string
  variant_name: string
  subvariant_name: string
  variant_sku: string
  attributes: Record<string, unknown>
  quantity: number
  unit_price: number
  total_price: number
}

export interface OrderResponse {
  id: number
  status: string
  payment_status: string
  subtotal: number
  shipping_cost: number
  total: number
  items: OrderItemResponse[]
  address: AddressResponse
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateOrderRequest {
  address_id: number
  notes?: string
}

// ─── Restrictions ───
export interface RestrictionReasonResponse {
  id: number
  reason_text: string
}

export interface RestrictionReasonCreate {
  reason_text: string
}

export interface CreateRestrictionRequest {
  reason_id: number
  report_id?: number
  description?: string
  penalty_days?: number
  subvariant_ids?: number[]
}

export interface AppealResponse {
  id: number
  restriction_id: number
  appeal_text: string
  status: string
  created_at: string
  reviewed_at: string | null
}

export interface AppealCreate {
  restriction_id: number
  reason_text: string
}

export interface RestrictionProductResponse {
  id: number
  subvariant_id: number | null
  version_snapshot: Record<string, unknown>
  note: string | null
}

export interface RestrictionResponse {
  id: number
  user_id: number
  reason_id: number
  reason_text: string | null
  description: string | null
  penalty_days: number | null
  status: string
  products: RestrictionProductResponse[]
  created_at: string
  lifted_at: string | null
}

// ─── Featured ───
export interface FeaturedVariantInfo {
  id: number
  name: string
  price: number
  image: string | null
  product_id: number
  product_name: string
}

export interface FeaturedItemResponse {
  id: number
  position: number
  start_date: string
  end_date: string
  is_active: boolean
  product: ProductListItem | null
  variant: FeaturedVariantInfo | null
  created_at: string
}

export interface FeaturedItemCreate {
  product_id?: number
  variant_id?: number
  position?: number
  start_date: string
  end_date: string
}

export interface FeaturedItemUpdate {
  position?: number
  start_date?: string
  end_date?: string
}

// ─── Pagination ───
export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface ProductFilters extends PaginationParams {
  category_id?: number
  seller_id?: number
  q?: string
  min_price?: number
  max_price?: number
  sort_by?: "created_at" | "name" | "rating"
  order?: "asc" | "desc"
}
