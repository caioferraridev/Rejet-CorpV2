export interface Company {
  id: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  createdAt: string;
}