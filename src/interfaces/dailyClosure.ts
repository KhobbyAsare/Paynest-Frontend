export interface DailyClosureRequest {
  shop_id: number,
  closure_date: string,
  opening_balance: number,
  notes: string
}


export interface DailyClosureResponse {
  shop_id: number,
  closure_date: string,
  opening_balance: number,
  notes: string,
  id: number,
  closure_number: string,
  total_orders: number,
  total_items: number,
  total_customers: number,
  expected_cash: number,
  actual_cash: number,
  cash_difference: number,
  cash_total: number,
  card_total: number,
  mobile_total: number,
  credit_total: number,
  gross_sales: number,
  total_discounts: number,
  total_tax: number,
  total_refunds: number,
  net_sales: number,
  status: string,
  prepared_by: number,
  verified_by: number,
  approved_by: number,
  discrepancy_reason: string,
  opened_at: string,
  closed_at: string,
  created_at: string,
  updated_at: string
}


export interface SubmitClosureRequest {
  actual_cash: number,
  notes: string
}


export interface VerifyClosureRequest {
  status: string,
  discrepancy_reason: string
}

export interface ProductSale {
  product_name: string;
  quantity: number;
  total_sales: number;
  unit_price: number;
}

export interface DailyClosureDetailResponse extends DailyClosureResponse {
  sold_products: ProductSale[];
}