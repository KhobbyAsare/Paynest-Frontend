export interface ProductCategoriesRequest{
  name: string,
  description: string,
  is_active: boolean
}

export interface ProductCategoriesResponse{
    name: string,
    description: string,
    is_active: boolean,
    id: number,
    shop_id: number,
    organization_id: number,
    created_at: string,
    updated_at: string
}