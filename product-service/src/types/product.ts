export interface Product {
    id?: string;
    title: string;
    description: string;
    price: number;
  }

export interface ProductRequest extends Product {
  count: number;
}
  